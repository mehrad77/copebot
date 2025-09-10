# copebot
A Telegram bot

## 🚀 Deployment Guide

This project is built to run on Cloudflare Workers and uses the Telegram Bot API. Follow these steps to deploy your bot.

### Prerequisites

1. **Node.js** (v18 or later)
2. **npm** package manager (comes with Node.js)
3. **Cloudflare account** with Workers and D1 enabled
4. **Telegram Bot Token** (get one from [@BotFather](https://t.me/botfather))
5. **Wrangler CLI** for Cloudflare Workers deployment

### 📦 Installation

1. Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd copebot
npm install
```

2. Set up Cloudflare Wrangler CLI:
```bash
npm run setup
```
This will install Wrangler globally and prompt you to log in to your Cloudflare account.

### ⚙️ Configuration

1. **Create D1 Database**:
```bash
npx wrangler d1 create copebot-users
```
   - Copy the database configuration from the output
   - Update `wrangler.toml` with the database_id

2. **Environment Variables**: Copy the example environment file and configure it:
```bash
cp .dev.vars.example .dev.vars
```

3. **Edit `.dev.vars`** with your actual values:
```env
BOT_TOKEN=your_telegram_bot_token_here
BOT_DOMAIN=your_cloudflare_worker_domain
SECRET_PATH=your_webhook_secret_path
```

4. **Update `wrangler.toml`**:
   - Change the `name` field to your desired worker name
   - Update the database_id in the `[[d1_databases]]` section
   - Add your environment variables to the `[vars]` section for production:
```toml
name = "your-bot-name"
main = "dist/index.ts"

[[d1_databases]]
binding = "DB"
database_name = "copebot-users"
database_id = "your-actual-database-id"

[vars]
BOT_TOKEN = "your_production_bot_token"
BOT_DOMAIN = "your_production_domain"
SECRET_PATH = "your_production_secret_path"
```

5. **Initialize Database Schema**:
```bash
# For local development
npx wrangler d1 execute copebot-users --local --file=./src/database/schema.sql

# For production (after deployment)
npx wrangler d1 execute copebot-users --remote --file=./src/database/schema.sql
```

### 🔧 Development

1. **Build the project**:
```bash
npm run prestart
```

2. **Run locally** (for testing):
```bash
npm start
```
This starts a local development server at `https://localhost:8443`

### 🚀 Production Deployment

1. **Build for production**:
```bash
npm run predeploy
```

2. **Deploy to Cloudflare Workers**:
```bash
npm run deploy
```

3. **Initialize production database**:
```bash
npx wrangler d1 execute copebot-users --remote --file=./src/database/schema.sql
```

4. **Set up the webhook** (after deployment):
```bash
npm run set-webhook
```

## 🤖 Bot Features

### User Registration System
- **Automatic Registration**: Users are automatically registered when they send any message
- **User Tracking**: Tracks user activity, message count, and last seen timestamp
- **Duplicate Prevention**: Handles existing users gracefully with welcome back messages
- **Database Storage**: All user data stored in Cloudflare D1 database

### Commands
- `/start` - Shows registration status and user information
- `/help` - Displays help message with available commands
- `/stats` - Shows bot statistics (total users, new users today, active users today)

### Data Collected
- Telegram User ID (unique identifier)
- Username (if available)
- First and Last Name
- Registration timestamp
- Last activity timestamp
- Total message count

### Privacy & Security
- Only stores public Telegram profile information
- Uses prepared statements to prevent SQL injection
- Secure webhook with secret path
- GDPR-ready with user deletion capabilities

### 📱 Telegram Bot Setup

1. **Create a bot** with [@BotFather](https://t.me/botfather):
   - Send `/newbot` to BotFather
   - Choose a name and username for your bot
   - Save the bot token

2. **Configure the webhook**:
   - After deploying to Cloudflare Workers, your bot will be available at: `https://your-worker-name.your-subdomain.workers.dev`
   - Set `BOT_DOMAIN` to this URL
   - Choose a random `SECRET_PATH` for security (e.g., a UUID)
   - Run `npm run set-webhook` to register the webhook with Telegram

### 🔍 Verification

1. **Check deployment**:
   - Visit your worker URL in a browser
   - Check Cloudflare Workers dashboard for logs

2. **Test your bot**:
   - Send `/start` to your bot on Telegram
   - Send `hi` to test the response handler

### 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram Bot API token from BotFather | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `BOT_DOMAIN` | Your Cloudflare Worker domain | `https://my-bot.subdomain.workers.dev` |
| `SECRET_PATH` | Secret path for webhook (security) | `my-secret-webhook-path-123` |
| `DB` | D1 Database binding (configured in wrangler.toml) | Automatic binding |

### 🗄️ Database Schema

The bot uses a single `users` table with the following structure:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_bot INTEGER DEFAULT 0,
    language_code TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 1
);
```

### 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Install Wrangler CLI globally |
| `npm run prestart` | Build the project for development |
| `npm start` | Run local development server |
| `npm run predeploy` | Build the project for production |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run set-webhook` | Configure Telegram webhook |

### 🗄️ Database Commands

| Command | Description |
|---------|-------------|
| `wrangler d1 create copebot-users` | Create a new D1 database |
| `wrangler d1 execute copebot-users --local --file=./src/database/schema.sql` | Initialize local database |
| `wrangler d1 execute copebot-users --remote --file=./src/database/schema.sql` | Initialize production database |
| `wrangler d1 execute copebot-users --local --command="SELECT * FROM users"` | Query local database |
| `wrangler d1 execute copebot-users --remote --command="SELECT * FROM users"` | Query production database |

### 🐛 Troubleshooting

1. **Build errors**: Make sure all dependencies are installed with `npm install`
2. **Deployment fails**: Check your Cloudflare account has Workers and D1 enabled
3. **Database errors**:
   - Ensure D1 database is created: `wrangler d1 create copebot-users`
   - Initialize schema: `wrangler d1 execute copebot-users --local --file=./src/database/schema.sql`
   - Check database binding in `wrangler.toml`
4. **Bot not responding**:
   - Verify webhook is set correctly and environment variables are configured
   - Check database connection and initialization
   - Review Cloudflare Workers logs for errors
5. **User registration issues**:
   - Verify database schema is initialized
   - Check D1 database permissions and bindings
   - Review console logs for database errors
6. **Local development**: Use `wrangler dev` with appropriate flags for local testing

### 🔐 Security Notes

- Keep your `BOT_TOKEN` secret and never commit it to version control
- Use a random, hard-to-guess `SECRET_PATH` for your webhook
- Consider using Cloudflare Workers secrets for production environment variables instead of `wrangler.toml`

### 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegraf.js Documentation](https://telegraf.js.org/)
