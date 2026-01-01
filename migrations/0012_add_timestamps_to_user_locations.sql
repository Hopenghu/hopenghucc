-- Add added_at and updated_at columns to user_locations table
-- This assumes the existing 'created_at' column might be a misnamed 'added_at'
-- or that we are prioritizing getting the correct columns in place.

ALTER TABLE user_locations ADD COLUMN added_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_locations ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- Optional: If you are certain that the existing 'created_at' values should be in 'added_at'
-- and the table is not empty, you could uncomment the following:
-- UPDATE user_locations SET added_at = created_at WHERE added_at IS NULL;

-- We will leave the old 'created_at' column for now to avoid potential issues with DROP COLUMN.
-- The application code should be updated to use 'added_at' and 'updated_at'. 