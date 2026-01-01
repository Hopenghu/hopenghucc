-- Recreate locations table after users.id type fix and to ensure correct FK for created_by_user_id
-- This table was dropped in migration 0005_fix_users_table_id_column.sql

DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
    id TEXT PRIMARY KEY NOT NULL,
    google_place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('google_place', 'user_coordinate')),
    google_types TEXT,
    website TEXT,
    phone_number TEXT,
    business_status TEXT,
    google_rating REAL,
    google_user_ratings_total INTEGER,
    created_by_user_id INTEGER NOT NULL, -- Changed to INTEGER to match new users.id type
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Changed from updatedAt to updated_at for consistency
    thumbnail_url TEXT, -- Added from previous migration 0003
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE -- Ensure FK points to new users.id
);

CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON locations (google_place_id);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_locations_created_by_user_id ON locations (created_by_user_id);

-- Trigger to update 'updated_at' timestamp (ensure column name is updated_at)
CREATE TRIGGER IF NOT EXISTS trigger_locations_updated_at
AFTER UPDATE ON locations
FOR EACH ROW
BEGIN
    UPDATE locations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END; 