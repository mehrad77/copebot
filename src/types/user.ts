// User types for the CopeBotDatabase

export interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
}

export interface DatabaseUser {
	id?: number;
	telegram_id: number;
	username?: string;
	first_name: string;
	last_name?: string;
	is_bot: number; // SQLite stores boolean as integer (0 or 1)
	language_code?: string;
	registered_at?: string;
	last_seen?: string;
	message_count?: number;
}

export interface UserRegistrationResult {
	success: boolean;
	isNewUser: boolean;
	user: DatabaseUser;
	error?: string;
}

export interface UserStats {
	totalUsers: number;
	newUsersToday: number;
	activeUsersToday: number;
}
