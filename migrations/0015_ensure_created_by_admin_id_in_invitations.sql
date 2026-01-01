-- Migration number: 0015
-- Created at: 2025-05-15 17:18:00
-- Purpose: Ensure created_by_admin_id column exists in location_invitations table
 
ALTER TABLE location_invitations ADD COLUMN created_by_admin_id TEXT; 