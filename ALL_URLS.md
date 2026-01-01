# HOPENGHU.CC 所有網址列表

## 🌐 域名
- **主域名**: https://www.hopenghu.cc
- **備用域名**: https://hopenghu.cc

---

## 📄 頁面路由（前端頁面）

### 公開頁面（無需登入）
- `https://www.hopenghu.cc/` - 首頁（時光機）
- `https://www.hopenghu.cc/footprints` - 足跡頁面（所有地點列表）
- `https://www.hopenghu.cc/search` - 搜尋頁面
- `https://www.hopenghu.cc/location/{locationId}` - 地點詳情頁面

### 需要登入的頁面
- `https://www.hopenghu.cc/login` - 登入頁面
- `https://www.hopenghu.cc/profile` - 個人檔案頁面
- `https://www.hopenghu.cc/ai-chat` - AI 聊天頁面
- `https://www.hopenghu.cc/story-timeline` 或 `/timeline` - 故事時間線
- `https://www.hopenghu.cc/recommendations` 或 `/recommend` - 推薦頁面
- `https://www.hopenghu.cc/favorites` - 收藏頁面
- `https://www.hopenghu.cc/google-info` - Google 帳號資訊頁面
- `https://www.hopenghu.cc/game` - 遊戲頁面

### 管理員頁面（需要 admin 權限）
- `https://www.hopenghu.cc/admin/dashboard` - 管理員儀表板
- `https://www.hopenghu.cc/admin/images` - 圖片管理頁面
- `https://www.hopenghu.cc/admin/ai` 或 `/ai-admin` - AI 管理後台

### 測試/開發頁面
- `https://www.hopenghu.cc/test` - 簡單測試頁面
- `https://www.hopenghu.cc/test-simple` - 最簡單測試頁面
- `https://www.hopenghu.cc/design-preview` - 設計預覽頁面
- `https://www.hopenghu.cc/cards` - 卡片路由（測試用）
- `https://www.hopenghu.cc/game-test` - 遊戲測試路由

---

## 🔌 API 端點

### 認證相關 API
- `GET /api/auth/google` - 開始 Google OAuth 登入
- `GET /api/auth/google/request-gmb-scope` - 請求 Google My Business 權限
- `GET /api/auth/google/callback` - Google OAuth 回調
- `POST /api/auth/logout` - 登出

### 地點相關 API
- `GET /api/locations/paginated` - 獲取分頁地點列表
  - 參數: `limit`, `offset`, `userId` (可選)
- `GET /api/locations/existing` - 檢查地點是否已存在
- `POST /api/locations/import/google-place` - 從 Google Places 導入地點
- `POST /api/locations/nearby-search` - 搜尋附近地點
- `GET /api/locations/google-details/{placeId}` - 獲取 Google Places 詳情
- `GET /api/locations/details-by-placeid/{placeId}` - 根據 Place ID 獲取詳情
- `GET /api/locations/{locationId}/details` - 獲取地點詳情
- `POST /api/location/status` - 更新地點狀態（來過/想來/想再來）
- `GET /api/user/locations` - 獲取用戶的地點列表
- `GET /api/user/location-counts` - 獲取用戶地點統計
- `GET /api/location/global-counts` - 獲取全局地點統計
- `GET /api/location/{locationId}/interaction-counts` - 獲取地點互動統計

### 收藏、評分、評論 API
- `POST /api/favorites/toggle` - 切換收藏狀態
- `GET /api/favorites/list` - 獲取用戶收藏列表
- `GET /api/favorites/check` - 檢查是否已收藏
- `POST /api/favorites/rating` - 添加/更新評分
- `GET /api/favorites/rating` - 獲取地點評分資訊
  - 參數: `location_id`, `userId` (可選)
- `POST /api/favorites/comment` - 添加評論
- `GET /api/favorites/comments` - 獲取地點評論列表
  - 參數: `location_id`, `limit`, `offset`

### 搜尋 API
- `GET /api/search/locations` - 搜尋地點
  - 參數: `q` (查詢關鍵字), `types`, `min_rating`, `sort_by`, `limit`, `offset`
- `GET /api/search/autocomplete` - 自動完成搜尋
  - 參數: `q` (查詢關鍵字)
- `GET /api/search/filters` - 獲取搜尋篩選選項
- `GET /api/search/popular` - 獲取熱門搜尋關鍵字

### 推薦 API
- `GET /api/recommendation/personal` - 獲取個人化推薦
  - 參數: `limit` (可選，預設 12)
- `GET /api/recommendation/popular` - 獲取熱門地點推薦
  - 參數: `limit` (可選，預設 12)

### 故事 API
- `GET /api/story/timeline` - 獲取用戶故事時間線
  - 參數: `limit`, `offset`
- `GET /api/story/user/{userId}` - 獲取指定用戶的故事
- `POST /api/story/create` - 創建新故事
- `GET /api/story/{storyId}` - 獲取故事詳情
- `POST /api/story/share` - 分享故事

### AI 相關 API
- `POST /api/ai/query` - 發送 AI 查詢
- `GET /api/ai/conversations` - 獲取對話記錄
- `GET /api/ai/conversations/{conversationId}` - 獲取特定對話詳情

### AI 管理 API（需要 admin 權限）
- `GET /api/ai/admin/learning-records` - 獲取學習記錄
- `GET /api/ai/admin/question-templates` - 獲取問題模板
- `GET /api/ai/admin/improvement-records` - 獲取改進記錄

### 圖片相關 API
- `GET /api/image/stats` - 獲取圖片緩存統計
- `POST /api/image/cleanup` - 清理過期圖片緩存
- `GET /api/image/proxy/{imagePath}` - 圖片代理（處理 Google Places 圖片）
- `POST /api/image/refresh-location` - 刷新指定地點的圖片
- `POST /api/image/refresh-all` - 批量刷新所有圖片
- `POST /api/image/download-location` - 下載地點圖片到 R2
  - 參數: `locationId` 或 `googlePlaceId`
- `POST /api/image/download-all` - 批量下載所有圖片到 R2
- `GET /api/image/download-stats` - 獲取下載統計
- `GET /api/image/r2/{key}` - 從 R2 獲取圖片
- `POST /api/image/batch-update` - 批量更新圖片（定期任務）
  - 參數: `batch_size`, `max_age`
- `GET /api/image/versions` - 獲取圖片版本歷史
  - 參數: `locationId`
- `POST /api/image/scheduler/run` - 執行圖片排程任務
  - 參數: `batch_size`, `max_age`
- `GET /api/image/scheduler/stats` - 獲取排程統計

### 管理員 API（需要 admin 權限）
- `GET /api/admin/users` - 獲取用戶列表
- `POST /api/admin/users/{userId}/set-role` - 設置用戶角色
- `GET /api/admin/stats` - 獲取管理統計
- `POST /api/admin/locations/generate-claim-link` - 生成地點認領連結
- `GET /api/admin/locations-for-invitation` - 獲取可邀請的地點列表

### 遊戲相關 API
- `POST /api/game/*` - 遊戲 API（使用 Hono 路由）
- `POST /api/penghu-game/*` - 澎湖遊戲 API（使用 Hono 路由）
- `POST /api/simple-game/*` - 簡化遊戲 API（使用 Hono 路由）

### 其他 API
- `GET /api/maps/config` - 獲取地圖配置
- `POST /api/locations/reverse-geocode` - 反向地理編碼
- `POST /api/csp-report` - CSP 違規報告

### 調試 API
- `GET /api/debug/*` - 調試相關 API

---

## 📝 使用範例

### 獲取地點列表（分頁）
```
GET https://www.hopenghu.cc/api/locations/paginated?limit=20&offset=0&userId={userId}
```

### 搜尋地點
```
GET https://www.hopenghu.cc/api/search/locations?q=餐廳&types=restaurant&min_rating=4.0&sort_by=rating
```

### 切換收藏
```
POST https://www.hopenghu.cc/api/favorites/toggle
Content-Type: application/json
{
  "location_id": "location-id-here"
}
```

### 添加評分
```
POST https://www.hopenghu.cc/api/favorites/rating
Content-Type: application/json
{
  "location_id": "location-id-here",
  "rating": 5,
  "comment": "很棒的地方！" // 可選
}
```

### 獲取地點評論
```
GET https://www.hopenghu.cc/api/favorites/comments?location_id={locationId}&limit=20&offset=0
```

---

## 🔒 權限說明

- **公開**: 任何人都可以訪問
- **需要登入**: 需要 Google OAuth 登入
- **需要 admin**: 需要管理員權限（role = 'admin'）

---

*最後更新: 2025-01-20*

