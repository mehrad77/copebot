import type { D1Database } from '@cloudflare/workers-types';
import { DatabaseUser, TelegramUser, UserRegistrationResult, UserStats } from '../types/user';

export class UserService {
	private db: D1Database;

	constructor(database: D1Database) {
		this.db = database;
	}

	/**
	 * Register a new user or update existing user's last seen time
	 */
	async registerUser(telegramUser: TelegramUser): Promise<UserRegistrationResult> {
		try {
			// First, check if user already exists
			const existingUser = await this.getUserByTelegramId(telegramUser.id);

			if (existingUser) {
				// User exists, update last seen and increment message count
				const updatedUser = await this.updateUserActivity(telegramUser.id);
				return {
					success: true,
					isNewUser: false,
					user: updatedUser || existingUser,
				};
			}

			// New user, insert into database
			const insertResult = await this.db
				.prepare(
					`INSERT INTO users (telegram_id, username, first_name, last_name, is_bot, language_code, registered_at, last_seen, message_count)
					 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)`,
				)
				.bind(
					telegramUser.id,
					telegramUser.username || null,
					telegramUser.first_name,
					telegramUser.last_name || null,
					telegramUser.is_bot ? 1 : 0,
					telegramUser.language_code || null,
				)
				.run();

			if (!insertResult.success) {
				throw new Error('Failed to insert user into database');
			}

			// Fetch the newly created user
			const newUser = await this.getUserByTelegramId(telegramUser.id);
			if (!newUser) {
				throw new Error('Failed to retrieve newly created user');
			}

			return {
				success: true,
				isNewUser: true,
				user: newUser,
			};
		} catch (error) {
			console.error('Error registering user:', error);
			return {
				success: false,
				isNewUser: false,
				user: {} as DatabaseUser,
				error: error instanceof Error ? error.message : 'Unknown error occurred',
			};
		}
	}

	/**
	 * Get user by Telegram ID
	 */
	async getUserByTelegramId(telegramId: number): Promise<DatabaseUser | null> {
		try {
			const result = await this.db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first<DatabaseUser>();

			return result || null;
		} catch (error) {
			console.error('Error fetching user by telegram ID:', error);
			return null;
		}
	}

	/**
	 * Update user's last seen time and increment message count
	 */
	async updateUserActivity(telegramId: number): Promise<DatabaseUser | null> {
		try {
			const updateResult = await this.db
				.prepare(
					`UPDATE users
					 SET last_seen = CURRENT_TIMESTAMP, message_count = message_count + 1
					 WHERE telegram_id = ?`,
				)
				.bind(telegramId)
				.run();

			if (!updateResult.success) {
				throw new Error('Failed to update user activity');
			}

			// Return updated user data
			return await this.getUserByTelegramId(telegramId);
		} catch (error) {
			console.error('Error updating user activity:', error);
			return null;
		}
	}

	/**
	 * Get basic user statistics
	 */
	async getUserStats(): Promise<UserStats> {
		try {
			// Total users
			const totalUsersResult = await this.db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();

			// New users today
			const newUsersTodayResult = await this.db
				.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(registered_at) = DATE('now')")
				.first<{ count: number }>();

			// Active users today (users who sent messages today)
			const activeUsersTodayResult = await this.db
				.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(last_seen) = DATE('now')")
				.first<{ count: number }>();

			return {
				totalUsers: totalUsersResult?.count || 0,
				newUsersToday: newUsersTodayResult?.count || 0,
				activeUsersToday: activeUsersTodayResult?.count || 0,
			};
		} catch (error) {
			console.error('Error fetching user stats:', error);
			return {
				totalUsers: 0,
				newUsersToday: 0,
				activeUsersToday: 0,
			};
		}
	}

	/**
	 * Get all users (for admin purposes - use with caution)
	 */
	async getAllUsers(limit: number = 100, offset: number = 0): Promise<DatabaseUser[]> {
		try {
			const result = await this.db
				.prepare('SELECT * FROM users ORDER BY registered_at DESC LIMIT ? OFFSET ?')
				.bind(limit, offset)
				.all<DatabaseUser>();

			return result.results || [];
		} catch (error) {
			console.error('Error fetching all users:', error);
			return [];
		}
	}

	/**
	 * Delete user by Telegram ID (for GDPR compliance)
	 */
	async deleteUser(telegramId: number): Promise<boolean> {
		try {
			const result = await this.db.prepare('DELETE FROM users WHERE telegram_id = ?').bind(telegramId).run();

			return result.success && (result.meta.changes || 0) > 0;
		} catch (error) {
			console.error('Error deleting user:', error);
			return false;
		}
	}
}
