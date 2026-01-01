-- Add claimed_by_user_id and claimed_at to location_invitations
ALTER TABLE location_invitations ADD COLUMN claimed_by_user_id TEXT REFERENCES users(id);
ALTER TABLE location_invitations ADD COLUMN claimed_at TEXT;
 
-- Ensure existing records have a default updated_at if it's null (though new column defaults to CURRENT_TIMESTAMP)
-- This might be redundant if the ADD COLUMN default works as expected for all D1 versions/scenarios.
-- UPDATE location_invitations SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL; 