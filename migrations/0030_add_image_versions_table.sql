-- Migration: 0030_add_image_versions_table.sql
-- 建立圖片版本控制表
-- 創建時間: 2025-01-21

-- 圖片版本表（用於版本控制）
CREATE TABLE IF NOT EXISTS image_versions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  location_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(location_id, version)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_image_versions_location_id ON image_versions(location_id);
CREATE INDEX IF NOT EXISTS idx_image_versions_version ON image_versions(version);
CREATE INDEX IF NOT EXISTS idx_image_versions_created_at ON image_versions(created_at);

