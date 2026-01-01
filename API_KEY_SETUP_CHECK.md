# API 金鑰設定檢查指南

根據您提供的 Google Cloud Console 截圖，以下是需要檢查和設定的項目：

## 📋 從截圖看到的資訊

### ✅ 已確認
1. **API 金鑰存在**：`Maps Platform API Key`
2. **API 限制**：限制為 "11 個 API"
3. **OAuth 2.0 用戶端**：已設定 "HOPE PENGHU"
4. **URL 簽署密鑰**：已設定

### ⚠️ 需要確認

## 🔍 必須檢查的項目

### 1. 確認 API 金鑰限制中包含的 API

您的 API 金鑰限制為 "11 個 API"，但截圖中沒有顯示具體是哪些 API。

**必須包含的 API：**

#### ✅ 必要 API（用於 AI 功能）
1. **Places API (New)** - ✅ 截圖顯示已選擇此 API
2. **Places API (Legacy)** - ⚠️ **必須確認是否在 11 個 API 中**
   - 這是 Text Search 和 Find Place API 所需的
   - 如果沒有，AI 無法從 Google Maps 搜尋地點
3. **Distance Matrix API** - ⚠️ **必須確認是否在 11 個 API 中**
   - 用於計算地點之間的距離和時間

#### 📝 其他可能需要的 API
- Geocoding API（如果使用）
- Maps JavaScript API（前端地圖顯示）
- 其他您網站使用的 Google Maps API

### 2. 檢查 API 啟用狀態

**步驟：**
1. 在 Google Cloud Console 中，點擊左側選單的「API 和服務」>「已啟用的 API」
2. 搜尋並確認以下 API 的狀態：

**必須啟用：**
- ✅ Places API (New) - 應該已啟用（截圖顯示）
- ⚠️ **Places API (Legacy)** - **必須啟用**
- ⚠️ **Distance Matrix API** - **必須啟用**

### 3. 檢查 API 金鑰限制設定

**步驟：**
1. 在「金鑰和憑證」頁面，點擊 API 金鑰旁的「顯示金鑰」或編輯圖示
2. 查看「API 限制」部分
3. 確認以下 API 在限制列表中：
   - Places API (New)
   - **Places API (Legacy)** ⚠️
   - **Distance Matrix API** ⚠️

## 🛠️ 需要做的設定

### 如果 Places API (Legacy) 未啟用

1. **啟用 API：**
   - 前往「API 和服務」>「已啟用的 API」
   - 搜尋 "Places API (Legacy)"
   - 點擊「啟用」

2. **將 API 加入金鑰限制：**
   - 前往「金鑰和憑證」
   - 點擊 API 金鑰旁的編輯圖示
   - 在「API 限制」中，選擇「限制金鑰」
   - 確認 "Places API (Legacy)" 在列表中
   - 如果沒有，點擊「新增 API」並選擇 "Places API (Legacy)"
   - 儲存變更

### 如果 Distance Matrix API 未啟用

1. **啟用 API：**
   - 前往「API 和服務」>「已啟用的 API」
   - 搜尋 "Distance Matrix API"
   - 點擊「啟用」

2. **將 API 加入金鑰限制：**
   - 同樣在 API 金鑰的編輯頁面
   - 確認 "Distance Matrix API" 在限制列表中

## 📊 檢查清單

請確認以下項目：

- [ ] Places API (New) 已啟用 ✅（截圖顯示）
- [ ] **Places API (Legacy) 已啟用** ⚠️ **必須確認**
- [ ] **Distance Matrix API 已啟用** ⚠️ **必須確認**
- [ ] API 金鑰限制中包含 Places API (New)
- [ ] **API 金鑰限制中包含 Places API (Legacy)** ⚠️ **必須確認**
- [ ] **API 金鑰限制中包含 Distance Matrix API** ⚠️ **必須確認**

## 🔍 如何檢查 API 金鑰限制

### 方法 1：在 Google Cloud Console 中檢查

1. 前往「金鑰和憑證」頁面
2. 點擊 API 金鑰旁的「顯示金鑰」或編輯圖示（三個點）
3. 查看「API 限制」部分
4. 確認所有必要的 API 都在列表中

### 方法 2：查看已啟用的 API

1. 前往「API 和服務」>「已啟用的 API」
2. 搜尋以下 API 並確認狀態：
   - Places API (New)
   - Places API (Legacy)
   - Distance Matrix API

## ⚠️ 重要提醒

### Places API (Legacy) 的重要性

**Places API (Legacy)** 是 AI 功能正常運作的關鍵，因為：

1. **Text Search API** 需要 Places API (Legacy)
   - 端點：`/place/textsearch/json`
   - 用於根據名稱搜尋地點

2. **Find Place API** 需要 Places API (Legacy)
   - 端點：`/place/findplacefromtext/json`
   - 用於更精確的地點搜尋

3. **如果沒有啟用**：
   - AI 無法從 Google Maps 搜尋地點
   - 會返回 "REQUEST_DENIED" 錯誤
   - 只能使用資料庫中的地點資訊

### Distance Matrix API 的重要性

**Distance Matrix API** 用於：
- 計算地點之間的距離
- 計算旅行時間
- AI 回答距離相關問題

## 🧪 測試方法

設定完成後，請測試：

1. **測試地點搜尋：**
   ```
   查詢：「你有黑山頭 Hasento Inn 的資訊嗎？」
   ```
   - 如果 Places API (Legacy) 已正確設定，AI 應該能從 Google Maps 找到地點

2. **測試距離查詢：**
   ```
   查詢：「從天后宮到機場的距離」
   ```
   - 如果 Distance Matrix API 已正確設定，AI 應該能計算距離

3. **檢查日誌：**
   - 前往 Cloudflare Workers 日誌
   - 搜尋 "Google Places API response status"
   - 應該看到 "OK" 而不是 "REQUEST_DENIED"

## 📝 下一步

1. **立即檢查**：確認 Places API (Legacy) 和 Distance Matrix API 是否在已啟用的 API 列表中
2. **檢查金鑰限制**：確認這兩個 API 是否在 API 金鑰的限制列表中
3. **如果缺少**：按照上述步驟啟用並加入限制
4. **測試功能**：設定完成後測試 AI 功能

## 🚨 如果仍有問題

如果設定完成後仍有問題，請提供：
1. 「已啟用的 API」頁面截圖
2. API 金鑰限制設定截圖
3. Cloudflare Workers 日誌中的錯誤訊息

這樣可以更快診斷問題！
