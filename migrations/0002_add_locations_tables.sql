-- Migration number: 0002 	 2025-05-01T22:48:24.294Z

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY NOT NULL,
    google_place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('google_place', 'user_coordinate')),
    google_types TEXT, -- Store as JSON string or comma-separated
    created_by_user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups on google_place_id
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON locations (google_place_id);
-- Index for potential geospatial queries (if D1 supports them well in the future)
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations (latitude, longitude);

-- Create user_locations table for user-specific data related to a location
CREATE TABLE IF NOT EXISTS user_locations (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    location_id TEXT NOT NULL REFERENCES locations(id),
    user_description TEXT,
    status TEXT CHECK(status IN ('visited', 'want_to_go')), -- Example statuses
    added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, location_id) -- Prevent duplicate user-location entries
);

-- Indexes for user_locations
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations (user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location_id ON user_locations (location_id);

-- Create user_location_links table
CREATE TABLE IF NOT EXISTS user_location_links (
    id TEXT PRIMARY KEY NOT NULL,
    user_location_id TEXT NOT NULL REFERENCES user_locations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    label TEXT,
    added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for user_location_links
CREATE INDEX IF NOT EXISTS idx_user_location_links_user_location_id ON user_location_links (user_location_id);
