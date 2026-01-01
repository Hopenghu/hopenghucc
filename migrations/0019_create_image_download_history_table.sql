-- Create image download history table for tracking downloaded images
-- This table will store records of when images were downloaded from Google Places API

CREATE TABLE IF NOT EXISTS image_download_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_place_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    original_url TEXT NOT NULL,
    local_url TEXT NOT NULL,
    downloaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    content_type TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_download_google_place_id ON image_download_history (google_place_id);
CREATE INDEX IF NOT EXISTS idx_image_download_location_id ON image_download_history (location_id);
CREATE INDEX IF NOT EXISTS idx_image_download_downloaded_at ON image_download_history (downloaded_at);

-- Create trigger to update file_size and content_type when local_url is a data URL
CREATE TRIGGER IF NOT EXISTS trigger_image_download_metadata
AFTER INSERT ON image_download_history
FOR EACH ROW
WHEN NEW.local_url LIKE 'data:%'
BEGIN
    -- Extract content type and calculate file size from base64 data URL
    UPDATE image_download_history 
    SET content_type = CASE 
        WHEN NEW.local_url LIKE 'data:image/jpeg%' THEN 'image/jpeg'
        WHEN NEW.local_url LIKE 'data:image/png%' THEN 'image/png'
        WHEN NEW.local_url LIKE 'data:image/webp%' THEN 'image/webp'
        ELSE 'image/jpeg'
    END,
    file_size = (length(NEW.local_url) - (instr(NEW.local_url, ',') + 1)) * 0.75
    WHERE id = NEW.id;
END; 