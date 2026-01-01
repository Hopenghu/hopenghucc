-- Create image cache table for handling Google Places API image URL expiration
-- This table will store cached image URLs to prevent broken images when Google's photoreference expires

CREATE TABLE IF NOT EXISTS image_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    cached_url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_cache_key ON image_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_image_cache_created_at ON image_cache (created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS trigger_image_cache_updated_at
AFTER UPDATE ON image_cache
FOR EACH ROW
BEGIN
    UPDATE image_cache SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END; 