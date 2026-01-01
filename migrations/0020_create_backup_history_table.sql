-- Create backup history table for tracking database backups
-- This table will store records of all backup operations

CREATE TABLE IF NOT EXISTS backup_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_key TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL,
    table_count INTEGER NOT NULL,
    total_rows INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'in_progress')),
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backup_history_timestamp ON backup_history (timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history (status);
CREATE INDEX IF NOT EXISTS idx_backup_history_backup_key ON backup_history (backup_key);

-- Create trigger to update created_at timestamp
CREATE TRIGGER IF NOT EXISTS trigger_backup_history_created_at
AFTER INSERT ON backup_history
FOR EACH ROW
BEGIN
    UPDATE backup_history SET created_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 