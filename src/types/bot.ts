// Bot context types and extensions for CopeBotDatabase

import { Context } from 'telegraf';
import type { D1Database } from '@cloudflare/workers-types';
import { UserRegistrationResult } from './user';

// Extend the Telegraf context to include our custom properties
declare module 'telegraf' {
	interface Context {
		userRegistration?: UserRegistrationResult;
	}
}

// Environment interface for Cloudflare Workers
// D1Database is available from @cloudflare/workers-types
export interface Env {
	BOT_TOKEN: string;
	BOT_DOMAIN: string;
	SECRET_PATH: string;
	DB: D1Database;
}

// Extended context type for type safety
export interface BotContext extends Context {
	userRegistration?: UserRegistrationResult;
}
