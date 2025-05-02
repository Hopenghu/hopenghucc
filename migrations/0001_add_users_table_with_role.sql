-- Migration number: 0001 	 2025-05-01_19_18_55
-- Please modify this migration file to reflect your D1 schema changes.

-- Create the users table if it doesn't exist (Basic structure)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if they don't exist (More robust than assuming full table creation)
-- Note: D1 doesn't directly support `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
-- We rely on the migration only running once. If it failed mid-way before,
-- manual intervention might be needed, but for a typical run this is safer.

-- Attempt to add googleId (without UNIQUE constraint here)
ALTER TABLE users ADD COLUMN googleId TEXT;

-- Attempt to add lastLogin (will fail if already exists)
ALTER TABLE users ADD COLUMN lastLogin TEXT;

-- Attempt to add role (will fail if already exists)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';


-- Create indexes only after ensuring columns likely exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_googleId ON users (googleId);

-- Add UNIQUE constraint using a separate index after column creation
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_googleId_unique ON users (googleId);
