CREATE TABLE user_locations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL, -- To match the new users.id type
    location_id TEXT NOT NULL,
    link_notes TEXT, -- From original 0002 migration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);
-- Consider adding UNIQUE constraint on (user_id, location_id) if a user can only link to a location once. 