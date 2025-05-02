-- Drop existing tables if they exist (optional, but good for clean init)
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Recreate users table with correct schema
CREATE TABLE users (
    id TEXT PRIMARY KEY,          -- Use TEXT for UUID
    email TEXT UNIQUE NOT NULL,   -- Keep email unique and required
    name TEXT,                    -- Allow null name (code handles default)
    google_id TEXT UNIQUE,        -- Allow null google_id, but ensure unique if present
    avatar_url TEXT,              -- Allow null avatar
    created_at INTEGER NOT NULL,  -- Use INTEGER for Unix timestamp
    updated_at INTEGER NOT NULL   -- Use INTEGER for Unix timestamp
);

-- Recreate sessions table (assuming this structure is correct)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: Add indexes for performance if needed later
-- CREATE INDEX idx_sessions_user_id ON sessions (user_id);
-- CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

-- Removed favorites table
-- Removed places table
-- Removed events table
-- Removed reviews table 