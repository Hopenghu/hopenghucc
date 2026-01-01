-- Add user_description and status columns to user_locations table
 
ALTER TABLE user_locations ADD COLUMN user_description TEXT;
ALTER TABLE user_locations ADD COLUMN status TEXT; -- As per linkUserToLocation options 