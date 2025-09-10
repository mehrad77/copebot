import { Telegraf } from 'telegraf';
import { Application, Router } from '@cfworker/web';
import createTelegrafMiddleware from 'cfworker-middleware-telegraf';
import { UserService } from './database/userService';
import { TelegramUser } from './types/user';
import './types/bot'; // Import for context extension
import packageJson from '../package.json';

// @ts-expect-error - Cloudflare Workers global
const bot = new Telegraf(self.BOT_TOKEN);

// Middleware to register users on any message
bot.use(async (ctx, next) => {
	// Skip if no user info available
	if (!ctx.from) {
		return next();
	}

	try {
		// @ts-expect-error - Cloudflare Workers global - DB binding
		const userService = new UserService(self.DB);

		const telegramUser: TelegramUser = {
			id: ctx.from.id,
			is_bot: ctx.from.is_bot,
			first_name: ctx.from.first_name,
			last_name: ctx.from.last_name,
			username: ctx.from.username,
			language_code: ctx.from.language_code,
		};

		const result = await userService.registerUser(telegramUser);

		if (result.success) {
			// Store registration result in context for use in handlers
			ctx.userRegistration = result;
		} else {
			console.error('Failed to register user:', result.error);
		}
	} catch (error) {
		console.error('Error in user registration middleware:', error);
	}

	return next();
});

// Start command - shows registration status
bot.start(async (ctx) => {
	console.log('Bot started by user:', ctx.from?.id);

	const registration = ctx.userRegistration;
	if (!registration || !registration.success) {
		return ctx.reply('🤖 Welcome to CopeBotDatabase!\n\nSorry, there was an issue with user registration. Please try again.');
	}

	if (registration.isNewUser) {
		const user = registration.user;
		const welcomeMessage = `🎉 Welcome to CopeBotDatabase!

You've been successfully registered in our system.

👤 **User Info:**
• ID: #${user.telegram_id}
• Name: ${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}
${user.username ? `• Username: @${user.username}` : ''}
• Registered: ${new Date(user.registered_at || '').toLocaleString()}

Send me any message to interact with the bot!`;

		return ctx.reply(welcomeMessage);
	} else {
		const user = registration.user;
		const welcomeBackMessage = `👋 Welcome back, ${user.first_name}!

You're already registered in our system.

📊 **Your Stats:**
• User ID: #${user.telegram_id}
• Messages sent: ${user.message_count}
• Last seen: ${new Date(user.last_seen || '').toLocaleString()}
• Member since: ${new Date(user.registered_at || '').toLocaleString()}

Thanks for using CopeBotDatabase! 🚀`;

		return ctx.reply(welcomeBackMessage);
	}
});

// Help command
bot.help((ctx) => {
	return ctx.reply(`📚 **CopeBotDatabase Help**

This bot automatically registers users when they send any message.

**Commands:**
• /start - Show registration status and welcome message
• /help - Show this help message
• /version - Show bot version information
• /stats - Show bot statistics (if available)

**Features:**
• 🔄 Automatic user registration
• 📊 Activity tracking
• 💾 Persistent data storage

Just send any message to get registered!`);
});

// Version command
bot.command('version', (ctx) => {
	const versionMessage = `🤖 **CopeBotDatabase Version**

📦 **Package Info:**
• Name: ${packageJson.name}
• Version: v${packageJson.version}
• Type: ${packageJson.type}

🛠️ **Build Info:**
• Built for: Cloudflare Workers
• Runtime: ${new Date().toLocaleString()}

Made with ❤️ using Telegraf & TypeScript`;

	return ctx.reply(versionMessage);
});

// Stats command (optional feature)
bot.command('stats', async (ctx) => {
	try {
		// @ts-expect-error - Cloudflare Workers global - DB binding
		const userService = new UserService(self.DB);
		const stats = await userService.getUserStats();

		const statsMessage = `📊 **Bot Statistics**

👥 Total users: ${stats.totalUsers}
🆕 New users today: ${stats.newUsersToday}
🔥 Active users today: ${stats.activeUsersToday}

Updated: ${new Date().toLocaleString()}`;

		return ctx.reply(statsMessage);
	} catch (error) {
		console.error('Error fetching stats:', error);
		return ctx.reply('Sorry, unable to fetch statistics at the moment.');
	}
});

// Catch-all handler for any message type
bot.on('message', async (ctx) => {
	const registration = ctx.userRegistration;

	if (!registration || !registration.success) {
		return ctx.reply('🤖 Hello! There was an issue processing your registration. Please try sending /start again.');
	}

	if (registration.isNewUser) {
		const user = registration.user;
		return ctx.reply(`🎉 Welcome to CopeBotDatabase, ${user.first_name}!

You've been successfully registered. Your user ID is #${user.telegram_id}.

Type /help to see what I can do!`);
	} else {
		// Existing user sent a message
		const responses = [
			`Thanks for the message, ${registration.user.first_name}! 💬`,
			`Hey ${registration.user.first_name}! That's message #${registration.user.message_count} from you! 🎯`,
			`Good to see you again, ${registration.user.first_name}! 👋`,
			`${registration.user.first_name}, your activity has been recorded! 📝`,
		];

		const randomResponse = responses[Math.floor(Math.random() * responses.length)];
		return ctx.reply(randomResponse);
	}
});

// Your code here, but do not `bot.launch()`
// Do not forget to set environment variables BOT_TOKEN, SECRET_PATH, and DB binding on your worker

// Export default object with fetch handler for ES Module format
export default {
	async fetch(request: any, env: any): Promise<any> {
		// Set global variables from environment
		// @ts-expect-error - Cloudflare Workers global
		self.BOT_TOKEN = env.BOT_TOKEN;
		// @ts-expect-error - Cloudflare Workers global
		self.SECRET_PATH = env.SECRET_PATH;
		// @ts-expect-error - Cloudflare Workers global
		self.BOT_DOMAIN = env.BOT_DOMAIN;
		// @ts-expect-error - Cloudflare Workers global
		self.DB = env.DB;

		console.log(`Setting webhook to: ${env.BOT_DOMAIN}/${env.SECRET_PATH}`);

		// Create the router and application
		const router = new Router();
		router.post(`/${env.SECRET_PATH}`, createTelegrafMiddleware(bot));
		const app = new Application().use(router.middleware);

		// The @cfworker/web Application has a method to handle requests directly
		// @ts-expect-error - cfworker Application method
		return app.handleRequest(request);
	},
};
