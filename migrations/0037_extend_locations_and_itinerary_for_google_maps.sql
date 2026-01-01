-- Migration: Extend Locations and Itinerary for Google Maps Integration
-- Description: 擴展 locations 和 itinerary_items 表，支援從 Google Maps 自動創建地點和統計功能
-- Date: 2025-01-29

-- 擴展 locations 表：添加統計欄位和分類
ALTER TABLE locations ADD COLUMN total_visits INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN total_itinerary_uses INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN category TEXT;

-- 擴展 itinerary_items 表：添加狀態、備註和費用欄位
ALTER TABLE itinerary_items ADD COLUMN status TEXT DEFAULT 'planned';
ALTER TABLE itinerary_items ADD COLUMN notes TEXT;
ALTER TABLE itinerary_items ADD COLUMN estimated_cost REAL;
ALTER TABLE itinerary_items ADD COLUMN updated_at INTEGER;

-- 更新現有記錄的 updated_at
UPDATE itinerary_items SET updated_at = created_at WHERE updated_at IS NULL;

-- 擴展 user_locations 表：添加用戶評分和標籤（如果不存在）
-- 檢查欄位是否存在，如果不存在則添加
-- SQLite 不支援直接檢查欄位是否存在，所以使用 IF NOT EXISTS 的替代方案
-- 如果欄位已存在，這些語句會失敗，但不會影響其他操作

-- 為 locations 表添加索引以優化統計查詢
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_total_visits ON locations(total_visits);
CREATE INDEX IF NOT EXISTS idx_locations_total_itinerary_uses ON locations(total_itinerary_uses);

-- 為 itinerary_items 表添加索引以優化狀態查詢
CREATE INDEX IF NOT EXISTS idx_itinerary_items_status ON itinerary_items(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_updated_at ON itinerary_items(updated_at);

-- 創建地點統計視圖（可選，用於快速查詢）
CREATE VIEW IF NOT EXISTS location_stats AS
SELECT 
  l.id,
  l.name,
  l.category,
  l.google_place_id,
  l.latitude,
  l.longitude,
  l.google_rating,
  l.total_visits,
  l.total_itinerary_uses,
  COUNT(DISTINCT ul.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN ul.status = 'visited' THEN ul.user_id END) as visited_users,
  COUNT(DISTINCT CASE WHEN ul.status = 'want_to_visit' THEN ul.user_id END) as want_to_visit_users,
  COUNT(DISTINCT CASE WHEN ul.status = 'favorite' THEN ul.user_id END) as favorite_users,
  AVG(ul.user_rating) as avg_user_rating
FROM locations l
LEFT JOIN user_locations ul ON l.id = ul.location_id
GROUP BY l.id;

