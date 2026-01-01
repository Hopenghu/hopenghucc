-- Create rate limit logs table for tracking API requests
-- This table will store records of all API requests for rate limiting

CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    window_type TEXT NOT NULL CHECK(window_type IN ('minute', 'hour', 'day')),
    request_time TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_client_id ON rate_limit_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint ON rate_limit_logs (endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_window_type ON rate_limit_logs (window_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_request_time ON rate_limit_logs (request_time);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_composite ON rate_limit_logs (client_id, endpoint, window_type, request_time);

-- Create trigger to update created_at timestamp
CREATE TRIGGER IF NOT EXISTS trigger_rate_limit_logs_created_at
AFTER INSERT ON rate_limit_logs
FOR EACH ROW
BEGIN
    UPDATE rate_limit_logs SET created_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 