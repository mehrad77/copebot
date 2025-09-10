-- User registration table for CopeBotDatabase
-- Stores Telegram user information and registration details

DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_registered_at ON users(registered_at);
CREATE INDEX IF NOT EXISTS idx_last_seen ON users(last_seen);

-- Insert some test data (optional, for development)
-- This will be removed in production
INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name, is_bot, language_code)
VALUES
    (123456789, 'testuser', 'Test', 'User', 0, 'en'),
    (987654321, 'anotheruser', 'Another', 'User', 0, 'en');
