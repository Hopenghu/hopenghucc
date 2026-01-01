-- Add claimed_by_user_id and owner_email to locations table

ALTER TABLE locations ADD COLUMN claimed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE locations ADD COLUMN owner_email TEXT;
 
-- Optional: Add an index for faster lookups on claimed_by_user_id if needed
-- CREATE INDEX IF NOT EXISTS idx_locations_claimed_by_user_id ON locations (claimed_by_user_id); 