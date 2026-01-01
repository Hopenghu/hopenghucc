-- Create image error logs table for tracking image loading failures
-- This table will store records of failed image requests for monitoring and debugging

CREATE TABLE IF NOT EXISTS image_error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT UNIQUE NOT NULL,
    error_message TEXT NOT NULL,
    failed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 1,
    last_retry TEXT,
    status TEXT NOT NULL DEFAULT 'failed' CHECK(status IN ('failed', 'retrying', 'resolved')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_error_logs_image_url ON image_error_logs (image_url);
CREATE INDEX IF NOT EXISTS idx_image_error_logs_failed_at ON image_error_logs (failed_at);
CREATE INDEX IF NOT EXISTS idx_image_error_logs_status ON image_error_logs (status);
CREATE INDEX IF NOT EXISTS idx_image_error_logs_retry_count ON image_error_logs (retry_count);

-- Create trigger to update created_at timestamp
CREATE TRIGGER IF NOT EXISTS trigger_image_error_logs_created_at
AFTER INSERT ON image_error_logs
FOR EACH ROW
BEGIN
    UPDATE image_error_logs SET created_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 