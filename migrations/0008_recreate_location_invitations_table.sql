-- Recreate location_invitations table after users.id type fix
-- This table was dropped in migration 0005_fix_users_table_id_column.sql

DROP TABLE IF EXISTS location_invitations;

CREATE TABLE location_invitations (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    user_id INTEGER, -- Changed to INTEGER to match new users.id type
    claim_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, claimed, expired
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL -- user_id now correctly references users.id as INTEGER
);

CREATE INDEX idx_location_invitations_location_id ON location_invitations(location_id);
CREATE INDEX idx_location_invitations_user_id ON location_invitations(user_id);
CREATE INDEX idx_location_invitations_claim_token ON location_invitations(claim_token);

-- Trigger to update 'updated_at' timestamp
CREATE TRIGGER IF NOT EXISTS trigger_location_invitations_updated_at
AFTER UPDATE ON location_invitations
FOR EACH ROW
BEGIN
    UPDATE location_invitations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END; 