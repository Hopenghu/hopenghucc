-- Add missing columns to user_locations table for location status functionality

-- Add added_at column if it doesn't exist
ALTER TABLE user_locations ADD COLUMN added_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column if it doesn't exist  
ALTER TABLE user_locations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have timestamps
UPDATE user_locations SET added_at = created_at, updated_at = created_at WHERE added_at IS NULL; 