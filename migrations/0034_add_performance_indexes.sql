-- Migration number: 0034_add_performance_indexes.sql
-- 性能優化：添加建議的數據庫索引
-- 創建時間: 2025-12-17
-- 
-- 此 migration 添加了根據性能分析建議的索引，以優化常見查詢的性能
-- 參考: PERFORMANCE_OPTIMIZATION.md
-- 
-- 注意：此 migration 只為確定存在的表創建索引
-- 如果某些表不存在（如 location_favorites），相關索引將跳過

-- ============================================
-- 用戶地點查詢優化
-- ============================================

-- 複合索引：優化批量查詢用戶地點狀態
-- 用於 getBatchUserLocationStatuses() 方法
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id_location_id 
ON user_locations(user_id, location_id);

-- 複合索引：優化批量查詢地點互動統計
-- 用於 getBatchLocationInteractionCounts() 方法
CREATE INDEX IF NOT EXISTS idx_user_locations_location_id_status 
ON user_locations(location_id, status);

-- 複合索引：優化用戶地點查詢（按添加時間排序）
-- 用於 getUserLocations() 方法
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id_added_at 
ON user_locations(user_id, added_at);

-- ============================================
-- 地點查詢優化
-- ============================================

-- 索引：優化按創建時間排序的分頁查詢
-- 用於 getLocationsPaginated() 方法
-- 注意：SQLite 不支持 DESC 在索引中，但查詢時使用 ORDER BY ... DESC 仍會使用此索引
CREATE INDEX IF NOT EXISTS idx_locations_created_at 
ON locations(created_at);

-- 索引：優化查詢用戶創建的地點
-- 用於 getUserCreatedLocations() 和 getUserAllLocationsOptimized() 方法
CREATE INDEX IF NOT EXISTS idx_locations_created_by_user_id 
ON locations(created_by_user_id);

-- 索引：優化按評分排序的查詢
-- 用於搜索和推薦功能
-- 注意：SQLite 不支持 DESC 在索引中，但查詢時使用 ORDER BY ... DESC 仍會使用此索引
CREATE INDEX IF NOT EXISTS idx_locations_google_rating 
ON locations(google_rating);

-- 索引：優化按評分數量排序的查詢
CREATE INDEX IF NOT EXISTS idx_locations_google_user_ratings_total 
ON locations(google_user_ratings_total);

