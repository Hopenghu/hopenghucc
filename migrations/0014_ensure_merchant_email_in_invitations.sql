-- Migration number: 0014
-- Created at: 2025-05-15 17:05:00
-- Purpose: Ensure merchant_email column exists in location_invitations table
 
ALTER TABLE location_invitations ADD COLUMN merchant_email TEXT; 