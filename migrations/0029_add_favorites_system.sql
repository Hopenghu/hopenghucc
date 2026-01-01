-- Migration: 0029_add_favorites_system.sql
-- 建立收藏系統資料表
-- 創建時間: 2025-01-21

-- 地點收藏表
CREATE TABLE IF NOT EXISTS location_favorites (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(user_id, location_id)
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_location_favorites_user_id ON location_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_location_favorites_location_id ON location_favorites(location_id);
CREATE INDEX IF NOT EXISTS idx_location_favorites_created_at ON location_favorites(created_at);

-- 地點評分表
CREATE TABLE IF NOT EXISTS location_ratings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(user_id, location_id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_location_ratings_user_id ON location_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_location_ratings_location_id ON location_ratings(location_id);
CREATE INDEX IF NOT EXISTS idx_location_ratings_rating ON location_ratings(rating);

-- 地點評論表
CREATE TABLE IF NOT EXISTS location_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_location_comments_user_id ON location_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_location_id ON location_comments(location_id);
CREATE INDEX IF NOT EXISTS idx_location_comments_created_at ON location_comments(created_at);

