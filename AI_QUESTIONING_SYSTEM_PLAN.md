# AI 主動問問題系統 - 規劃文件

## 核心需求分析

### 1. 固定資訊 vs 感覺資訊

**固定資訊（需要主動詢問）**：
- 飛機航班：班次、時間（固定但非規律）
- 商家產品費用：價格、消費時間
- 地點距離與時間：A 到 B 的距離、所需時間（可透過 Google Maps API 計算）
- 產品金額與消費時間：價格、體驗時長

**感覺資訊（使用者主動分享）**：
- 旅遊回憶：個人體驗、感受
- 地點評價：個人觀點
- 再次造訪意願：未來計劃

### 2. 使用者類型區分

**商家（Merchant）**：
- 需要詢問：產品、時間、費用
- 引導方向：讓商家提供營業資訊、產品資訊、價格資訊

**旅客（Traveler）**：
- 需要詢問：旅遊回憶、地點、人、再次造訪想去哪裡
- 引導方向：讓旅客分享體驗、回憶、未來計劃

## 資料庫結構分析

### 現有結構檢查

**locations 表**：
- ✅ 有基本地點資訊（名稱、地址、座標）
- ✅ 有商家相關欄位（phone_number, website, business_status）
- ❌ **缺少**：營業時間、產品資訊、價格資訊

**user_locations 表**：
- ✅ 有使用者描述（user_description）
- ✅ 有狀態（status: visited, want_to_go）
- ❌ **缺少**：旅遊回憶、再次造訪意願、消費時間

**users 表**：
- ✅ 有基本使用者資訊
- ❌ **缺少**：使用者類型標記（商家 vs 旅客）

## 需要的資料庫改進

### 1. 擴展 locations 表（商家固定資訊）

需要新增欄位：
- `opening_hours` TEXT - 營業時間（JSON 格式）
- `business_type` TEXT - 商家類型（餐廳、住宿、景點等）
- `is_merchant` BOOLEAN - 是否為商家

### 2. 新增商家產品表（merchant_products）

需要新表：
- `id` - 產品 ID
- `location_id` - 關聯的地點
- `product_name` - 產品名稱
- `price` INTEGER - 價格（分）
- `duration_minutes` INTEGER - 消費所需時間（分鐘）
- `description` TEXT - 產品描述
- `created_at` - 建立時間

### 3. 新增旅遊回憶表（travel_memories）

需要新表：
- `id` - 回憶 ID
- `user_id` - 使用者 ID
- `location_id` - 地點 ID
- `memory_content` TEXT - 回憶內容
- `visited_date` TEXT - 造訪日期
- `companions` TEXT - 同行人員（JSON）
- `want_to_revisit` BOOLEAN - 是否想再次造訪
- `created_at` - 建立時間

### 4. 擴展 users 表

需要新增欄位：
- `user_type` TEXT - 使用者類型（'traveler', 'merchant', 'local'）
- `is_merchant` BOOLEAN - 是否為商家

### 5. 新增距離快取表（location_distances）

需要新表：
- `id` - 記錄 ID
- `from_location_id` - 起點地點 ID
- `to_location_id` - 終點地點 ID
- `distance_meters` INTEGER - 距離（公尺）
- `duration_seconds` INTEGER - 時間（秒）
- `cached_at` TEXT - 快取時間
- `expires_at` TEXT - 過期時間

## Google Maps API 需求

### 需要的 API

1. **Distance Matrix API**
   - 用途：計算兩地點之間的距離和時間
   - 端點：`https://maps.googleapis.com/maps/api/distancematrix/json`
   - 需要參數：起點座標、終點座標、API Key

2. **Directions API**（可選）
   - 用途：獲取詳細路線資訊
   - 端點：`https://maps.googleapis.com/maps/api/directions/json`

### API Key 設定

您已經有 `GOOGLE_MAPS_API_KEY`，需要確認：
1. 是否已啟用 Distance Matrix API
2. 是否有使用限制
3. 是否需要設定付款方式

## AI 問問題邏輯設計

### 1. 商家引導流程

**初始問題**：
- "請問您的商家名稱是什麼？"
- "您提供什麼產品或服務？"

**固定資訊詢問**：
- "請問您的營業時間是？"
- "請問 [產品名稱] 的價格是多少？"
- "請問 [產品名稱] 的消費時間大約需要多久？"

**結構化儲存**：
- 將回答儲存到 `merchant_products` 表
- 更新 `locations` 表的營業時間

### 2. 旅客引導流程

**初始問題**：
- "您來過澎湖嗎？"
- "您最喜歡澎湖的哪個地方？"

**回憶詢問**：
- "請分享您在 [地點名稱] 的回憶"
- "您當時和誰一起去的？"
- "您還想再去 [地點名稱] 嗎？"

**未來計劃詢問**：
- "如果再次造訪澎湖，您想去哪裡？"
- "您想和誰一起去？"

**結構化儲存**：
- 將回答儲存到 `travel_memories` 表
- 更新 `user_locations` 表的狀態

### 3. 距離查詢流程

**當使用者詢問距離時**：
- AI 識別需要計算距離的查詢
- 查詢 `location_distances` 表（快取）
- 如果沒有快取，呼叫 Google Maps Distance Matrix API
- 儲存結果到快取表
- 回答使用者

## 實作優先順序

### 階段 1：資料庫擴展（必須）

1. 建立資料庫遷移檔案
   - 擴展 locations 表
   - 建立 merchant_products 表
   - 建立 travel_memories 表
   - 建立 location_distances 表
   - 擴展 users 表

### 階段 2：AI 問問題邏輯（核心）

1. 建立 AI 問問題服務
   - 識別使用者類型
   - 根據類型選擇問題模板
   - 追蹤對話狀態
   - 結構化儲存回答

### 階段 3：Google Maps 整合（重要）

1. 整合 Distance Matrix API
   - 建立距離計算服務
   - 實作快取機制
   - 整合到 AI 回答中

### 階段 4：前端改進（體驗）

1. 改進對話介面
   - 顯示 AI 正在詢問的問題
   - 提供結構化輸入（價格、時間等）
   - 顯示進度指示

## 需要確認的資訊

### Google Maps API

1. **Distance Matrix API 是否已啟用？**
   - 前往 Google Cloud Console
   - 檢查 API 是否啟用
   - 確認使用限制

2. **API 使用限制**
   - 免費額度：每月 40,000 次請求
   - 付費：$5.00 / 1,000 次請求

3. **需要的 API 端點**
   - Distance Matrix API：已包含在 Google Maps API 中
   - 需要確認您的 API Key 是否有權限

### 資料庫設計確認

1. **使用者類型識別**
   - 如何判斷使用者是商家還是旅客？
   - 是否需要讓使用者選擇？
   - 是否可以自動判斷？

2. **產品資訊結構**
   - 一個商家可以有多個產品嗎？
   - 產品資訊需要哪些欄位？
   - 價格是否需要支援多種貨幣？

3. **旅遊回憶結構**
   - 一個使用者可以對同一個地點有多個回憶嗎？
   - 需要支援圖片嗎？
   - 需要支援標籤嗎？

## 下一步行動

請確認：
1. Google Maps Distance Matrix API 是否已啟用
2. 使用者類型識別方式（自動判斷 vs 使用者選擇）
3. 產品資訊的詳細需求
4. 旅遊回憶的詳細需求

確認後，我將開始實作資料庫遷移和 AI 問問題系統。
