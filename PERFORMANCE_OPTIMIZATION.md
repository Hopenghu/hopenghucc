# 性能優化文檔

## ✅ 已完成的優化

### 1. N+1 查詢問題修復

#### 問題描述
在 `worker.js` 的 `/profile` 路由中，存在嚴重的 N+1 查詢問題：
- 對每個地點單獨調用 `getLocationInteractionCounts()` - N 次查詢
- 對每個地點單獨調用 `getUserLocationStatus()` - N 次查詢
- 如果有 100 個地點，就會執行 200 次數據庫查詢！

#### 解決方案
創建了批量查詢方法：
- `getBatchLocationInteractionCounts(locationIds)` - 批量獲取互動統計
- `getBatchUserLocationStatuses(userId, locationIds)` - 批量獲取用戶狀態
- `getUserAllLocationsOptimized(userId)` - 合併獲取用戶所有地點

#### 性能提升
- **之前**: 100 個地點 = 200 次查詢
- **現在**: 100 個地點 = 2 次查詢
- **提升**: 99% 查詢減少

### 2. Profile 頁面查詢優化

#### 優化前
```javascript
const userLocations = await locationService.getUserLocations(user.id);
const userCreatedLocations = await locationService.getUserCreatedLocations(user.id);
```
- 2 次獨立查詢

#### 優化後
```javascript
const { userLocations, userCreatedLocations } = await locationService.getUserAllLocationsOptimized(user.id);
```
- 1 次合併查詢（使用 UNION ALL）

#### 性能提升
- 查詢次數減少 50%
- 數據庫負載降低

## 📊 性能指標

### 查詢優化統計
- **N+1 查詢修復**: 3 個方法
- **批量查詢方法**: 3 個
- **查詢次數減少**: 最多可減少 99%（取決於地點數量）

## 🔍 建議的進一步優化

### 1. 數據庫索引優化
建議添加以下索引以提高查詢性能：

```sql
-- 用戶地點查詢優化
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id_location_id 
ON user_locations(user_id, location_id);

CREATE INDEX IF NOT EXISTS idx_user_locations_location_id_status 
ON user_locations(location_id, status);

-- 地點查詢優化
CREATE INDEX IF NOT EXISTS idx_locations_created_at 
ON locations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_locations_created_by_user_id 
ON locations(created_by_user_id);

-- 收藏查詢優化
CREATE INDEX IF NOT EXISTS idx_location_favorites_location_id 
ON location_favorites(location_id);

CREATE INDEX IF NOT EXISTS idx_location_favorites_user_id_location_id 
ON location_favorites(user_id, location_id);
```

### 2. 圖片加載優化 ✅ **已完成**
- ✅ 已實現懶加載（`loading="lazy"`）
- ✅ 已實現圖片預覽組件
- ✅ **圖片 CDN 緩存**：
  - 實施 Cloudflare Workers Cache API 緩存圖片響應（30天）
  - 優化圖片代理 API (`/api/image/proxy/`) 使用響應緩存
  - 添加緩存狀態頭（`X-Cache-Status: HIT/MISS`）
  - 使用 `ctx.waitUntil()` 非阻塞緩存寫入
- ✅ **圖片優化工具**：
  - 創建 `src/utils/imageOptimizer.js` 提供響應式圖片支持
  - 支持 `srcset` 和 `sizes` 屬性生成
  - 支持圖片尺寸優化（添加 `maxwidth`/`maxheight` 參數）
  - 提供響應式圖片 HTML 生成函數

### 3. API 響應緩存 ✅ **已完成**
- ✅ 創建緩存工具類 (`src/utils/cacheHelper.js`)
- ✅ 實施 Cloudflare Workers Cache API 封裝
- ✅ 為統計類 API 添加緩存：
  - `/api/business/verify/stats` - 5 分鐘緩存
  - `/api/ai/admin/statistics` - 5 分鐘緩存
  - `/api/image/stats` - 5 分鐘緩存
- ✅ 為地點分頁 API 添加緩存：
  - `/api/locations/paginated` - 1 分鐘緩存（考慮用戶特定狀態）
- ✅ **為搜索 API 添加緩存**：
  - `/api/search/locations` - 1 分鐘緩存（考慮搜索結果可能變化）
  - `/api/search/autocomplete` - 5 分鐘緩存（自動完成結果相對穩定）
  - `/api/search/filters` - 30 分鐘緩存（篩選選項變化不頻繁）
  - `/api/search/popular` - 1 小時緩存（熱門搜索關鍵字變化較慢）

**緩存策略**:
- 統計數據：5 分鐘（MEDIUM）
- 地點分頁：1 分鐘（SHORT，因為包含用戶特定數據）
- 搜索結果：1 分鐘（SHORT，考慮結果可能變化）
- 自動完成：5 分鐘（MEDIUM，結果相對穩定）
- 篩選選項：30 分鐘（LONG，變化不頻繁）
- 熱門搜索：1 小時（VERY_LONG，變化較慢）
- 支持自定義緩存鍵生成
- 自動處理緩存命中/未命中

### 4. 分頁優化
- ✅ Footprints 頁面已實現懶加載
- ✅ 已實現動態載入數量計算
- ⏳ 建議：添加虛擬滾動（如果地點數量非常大）

## 📝 實施記錄

### 2025-12-17
- ✅ 修復 Profile 頁面 N+1 查詢問題
- ✅ 創建批量查詢方法
- ✅ 優化用戶地點查詢（合併為單一查詢）

### 2025-12-18
- ✅ 實施數據庫索引優化
  - ✅ 創建 `idx_user_locations_user_id_location_id` - 優化批量查詢用戶地點狀態
  - ✅ 創建 `idx_user_locations_location_id_status` - 優化批量查詢地點互動統計
  - ✅ 創建 `idx_user_locations_user_id_added_at` - 優化用戶地點查詢（按添加時間排序）
  - ✅ 創建 `idx_locations_created_at` - 優化按創建時間排序的分頁查詢
  - ✅ 創建 `idx_locations_created_by_user_id` - 優化查詢用戶創建的地點
  - ✅ 創建 `idx_locations_google_rating` - 優化按評分排序的查詢
  - ✅ 創建 `idx_locations_google_user_ratings_total` - 優化按評分數量排序的查詢
- ✅ 實施 API 響應緩存
  - ✅ 創建 `src/utils/cacheHelper.js` - 緩存工具類
  - ✅ 為 4 個 API 端點添加緩存支持
  - ✅ 實施緩存裝飾器模式，易於擴展

### 5. 緩存監控和性能追蹤 ✅ **已完成**
- ✅ 創建緩存監控工具 (`src/utils/cacheMonitor.js`)
- ✅ 實施緩存命中率追蹤：
  - 記錄緩存命中/未命中
  - 計算緩存命中率
  - 追蹤平均響應時間（緩存命中 vs 未命中）
- ✅ 實施性能指標收集：
  - API 響應時間追蹤
  - 數據庫查詢時間追蹤
  - 統計摘要（平均值、中位數、最小值、最大值）
- ✅ 擴展系統狀態 API：
  - `/api/admin/system/status` - 包含緩存和性能指標
  - `/api/admin/cache/stats` - 緩存統計信息
  - `/api/admin/performance/metrics` - 性能指標
- ✅ 自動監控集成：
  - 緩存操作自動記錄到監控系統
  - 響應頭包含緩存命中率和性能指標

**監控功能**:
- 緩存命中率追蹤（按緩存鍵前綴分組）
- 平均響應時間統計
- 性能指標收集（API 響應時間、數據庫查詢時間）
- 實時統計摘要

## 🎯 下一步計劃

1. ✅ **數據庫索引優化**（優先級：高）- **已完成**
   - ✅ 添加建議的索引
   - ✅ 監控查詢性能改善（已實施監控系統）

2. ✅ **API 響應緩存**（優先級：中）- **已完成**
   - ✅ 實施 Cloudflare Workers 緩存
   - ✅ 設置適當的緩存過期時間
   - ✅ 監控緩存命中率（已實施監控系統）
   - ✅ 為搜索 API 添加緩存

3. **圖片 CDN 優化**（優先級：中）
   - 考慮使用 Cloudflare Images 或 R2
   - 優化圖片格式和大小

