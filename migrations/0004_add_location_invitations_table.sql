-- Migration number: 0004
-- Created at: YYYY-MM-DD HH:MM:SS

CREATE TABLE location_invitations (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    merchant_email TEXT NOT NULL,
    claim_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending_claim',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_admin_id TEXT NOT NULL,
    claimed_at TEXT,
    claimed_by_user_id TEXT,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by_admin_id) REFERENCES users(id),
    FOREIGN KEY (claimed_by_user_id) REFERENCES users(id)
);

-- Optional: Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_invitations_location_id ON location_invitations(location_id);
CREATE INDEX IF NOT EXISTS idx_location_invitations_merchant_email ON location_invitations(merchant_email);
CREATE INDEX IF NOT EXISTS idx_location_invitations_status ON location_invitations(status); 