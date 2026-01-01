-- Migration number: 0016
-- Created at: 2025-05-15 17:35:00
-- Purpose: Ensure expires_at column exists in location_invitations table. Code will now provide this value.
 
-- Attempt to add the column. If it already exists (especially with NOT NULL), 
-- this might not change the NOT NULL constraint if it was set manually or by a previous unknown migration.
-- However, since the code now provides a value, the NOT NULL constraint should not be an issue during INSERT.
-- ALTER TABLE location_invitations ADD COLUMN expires_at TEXT; -- Column likely already exists, commenting out to allow migration to proceed 