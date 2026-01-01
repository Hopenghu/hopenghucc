-- Migration to fix the users table ID column and ensure correct schema

-- Step 0: DROP dependent tables to avoid FK issues during users table rebuild
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_locations;
DROP TABLE IF EXISTS location_invitations;
DROP TABLE IF EXISTS locations;

-- Step 1: Disable foreign key constraints (if D1 supports this via PRAGMA, otherwise skip or handle potential errors)
-- PRAGMA foreign_keys=off; -- D1 might not support this directly in migrations; handle FK issues manually if they arise during copy.

-- Step 2: Rename the existing users table
ALTER TABLE users RENAME TO users_old_for_id_fix;

-- Step 3: Create the new users table with the correct schema
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    google_id TEXT UNIQUE, -- Keep google_id as it's used for lookup, ensure it's unique
    avatar_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME, -- Changed from last_login to match previous fixes, ensure consistency
    role TEXT NOT NULL DEFAULT 'user',
    -- Removed GMB related columns: google_refresh_token, google_access_token, has_synced_google_business
    -- Removed duplicate googleId column
    password_hash TEXT -- Add back password_hash if you plan to support password-based auth
);

-- Step 4: Copy data from the old table to the new table
-- We are intentionally NOT copying the old 'id' field as we want the new one to auto-increment.
-- We also need to be careful about which googleId column to use if both exist in old table.
-- Assuming the relevant google_id is in the column named 'google_id'.
-- Also, ensure timestamp formats are compatible or handle conversion if necessary.
INSERT INTO users (
    email,
    name,
    google_id,
    avatar_url,
    created_at,
    lastLogin,
    role
    -- password_hash -- uncomment if you add it above and want to copy it
)
SELECT
    email,
    name,
    googleId,
    avatar_url,
    created_at,
    lastLogin,
    role
    -- password_hash -- uncomment if you want to copy this from users_old_for_id_fix
FROM users_old_for_id_fix;

-- Step 5: Drop the old table
DROP TABLE users_old_for_id_fix;

-- Step 6: Re-enable foreign key constraints (if disabled earlier and supported)
-- PRAGMA foreign_keys=on; -- D1 might not support this.

-- Note: After this migration, the dropped tables (sessions, user_locations, location_invitations)
-- will need to be recreated by subsequent migration files.

-- Note: After this migration, existing sessions in the 'sessions' table might become invalid
-- because their user_id may no longer match a valid user_id in the new 'users' table.
-- Users will likely need to log in again.
-- Consider clearing the sessions table as part of this migration or in a subsequent step if necessary.
-- Example: DELETE FROM sessions; 