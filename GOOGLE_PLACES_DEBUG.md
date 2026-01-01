# Google Places API 整合問題診斷

## 🔧 已修復的問題

### 1. 查詢字串清理過度
**問題**：原本移除所有空格，導致 "Hasento Inn" 變成 "HasentoInn"
**修復**：保留空格，只移除多餘空格

### 2. 日誌不足
**問題**：無法追蹤 Google Places API 呼叫過程
**修復**：加入詳細日誌記錄

### 3. API 選擇
**問題**：只使用 Find Place API
**修復**：先試 Text Search API（更適合名稱搜尋），沒結果再試 Find Place

## 📋 檢查清單

### 步驟 1：確認 API 已啟用

請前往 [Google Cloud Console](https://console.cloud.google.com/) 確認：

1. **Places API (New)** ✅
2. **Places API (Legacy)** ⚠️ **必須啟用**
   - 這是 Text Search 和 Find Place API 所需的
   - 路徑：API 和服務 > 已啟用的 API > 搜尋 "Places API (Legacy)"
3. **Distance Matrix API** ✅

### 步驟 2：檢查 API Key 權限

確認 `GOOGLE_MAPS_API_KEY` 有權限使用：
- Places API (New)
- Places API (Legacy)
- Distance Matrix API

### 步驟 3：檢查日誌

現在系統會輸出詳細日誌，請檢查 Cloudflare Workers 日誌：

**應該看到的日誌：**
```
[AIService] Searching locations for query: 黑山頭 Hasento Inn
[AIService] Original query: 你有黑山頭 Hasento Inn 的資訊嗎？
[AIService] Found locations in database: 0
[AIService] No locations found in database, searching Google Places...
[AIService] Google Places search query: 黑山頭 Hasento Inn
[AIService] LocationService available: true
[AIService] LocationService API key available: true
[LocationService] Calling Google Places Text Search API
[LocationService] Google Places API response status: OK
[AIService] Found locations from Google Places: 1
```

**如果有錯誤，會看到：**
```
[LocationService] Google Places API error: [錯誤訊息]
```

## 🧪 測試方法

### 測試 1：基本搜尋

```
查詢：「你有黑山頭 Hasento Inn 的資訊嗎？」
```

**預期結果：**
- ✅ 資料庫中找不到
- ✅ 自動搜尋 Google Places
- ✅ 找到地點並回答

### 測試 2：檢查日誌

1. 前往 Cloudflare Dashboard
2. 進入 Workers > hopenghucc > Logs
3. 搜尋關鍵字：`Google Places` 或 `AIService`
4. 檢查是否有錯誤訊息

## 🐛 常見問題

### 問題 1：API 返回 "REQUEST_DENIED"

**原因**：Places API (Legacy) 未啟用

**解決方法**：
1. 前往 Google Cloud Console
2. 啟用 "Places API (Legacy)"
3. 等待幾分鐘讓設定生效

### 問題 2：API 返回 "INVALID_REQUEST"

**原因**：查詢字串格式問題

**檢查**：
- 查詢是否為空
- 查詢是否包含特殊字元
- 查看日誌中的 `cleanQuery` 值

### 問題 3：API 返回 "ZERO_RESULTS"

**原因**：Google Maps 中沒有該地點，或地點不在澎湖地區

**檢查**：
- 在 Google Maps 中手動搜尋該地點
- 確認地點是否在澎湖
- 嘗試使用不同的名稱變體

### 問題 4：LocationService 為 null

**原因**：LocationService 未正確初始化

**檢查**：
- `env.locationService` 是否為 null
- `worker.js` 中 LocationService 是否正確建立
- API Key 是否正確傳遞

## 🔍 診斷步驟

### 步驟 1：檢查 API 啟用狀態

```bash
# 無法直接檢查，請前往 Google Cloud Console
# 確認 "Places API (Legacy)" 已啟用
```

### 步驟 2：檢查日誌輸出

1. 發送測試查詢：「你有黑山頭 Hasento Inn 的資訊嗎？」
2. 檢查 Cloudflare Workers 日誌
3. 尋找以下關鍵字：
   - `[AIService] Google Places search query`
   - `[LocationService] Calling Google Places`
   - `[LocationService] Google Places API response status`

### 步驟 3：手動測試 API

如果日誌顯示 API 呼叫失敗，可以手動測試：

```bash
# 使用 curl 測試 Text Search API
curl "https://maps.googleapis.com/maps/api/place/textsearch/json?query=黑山頭+Hasento+Inn+澎湖&language=zh-TW&key=YOUR_API_KEY"

# 使用 curl 測試 Find Place API
curl "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=黑山頭+Hasento+Inn&inputtype=textquery&fields=place_id,name,formatted_address&key=YOUR_API_KEY"
```

## 📝 日誌範例

### 成功的情況

```
[AIService] Searching locations for query: 黑山頭 Hasento Inn
[AIService] Original query: 你有黑山頭 Hasento Inn 的資訊嗎？
[AIService] Found locations in database: 0
[AIService] No locations found in database, searching Google Places...
[AIService] Google Places search query: 黑山頭 Hasento Inn
[AIService] LocationService available: true
[AIService] LocationService API key available: true
[LocationService] Calling Google Places Text Search API
[LocationService] Google Places API response status: OK
[AIService] Found locations from Google Places: 1
[AIService] Converted Google Places results: 1
```

### 失敗的情況（API 未啟用）

```
[AIService] Searching locations for query: 黑山頭 Hasento Inn
[AIService] Found locations in database: 0
[AIService] No locations found in database, searching Google Places...
[LocationService] Calling Google Places Text Search API
[LocationService] Google Places API response status: REQUEST_DENIED
[LocationService] Google Places API error: This API project is not authorized to use this API.
```

### 失敗的情況（找不到地點）

```
[AIService] Searching locations for query: 黑山頭 Hasento Inn
[AIService] Found locations in database: 0
[AIService] No locations found in database, searching Google Places...
[LocationService] Calling Google Places Text Search API
[LocationService] Google Places API response status: ZERO_RESULTS
[LocationService] No results found for query: 黑山頭 Hasento Inn
[AIService] Google Places API returned no results
```

## 🚀 下一步

1. **檢查日誌**：查看 Cloudflare Workers 日誌，確認 API 是否被呼叫
2. **確認 API 啟用**：確認 "Places API (Legacy)" 已啟用
3. **測試查詢**：再次測試「你有黑山頭 Hasento Inn 的資訊嗎？」
4. **回報結果**：如果還有問題，請提供日誌輸出

## 📞 需要協助

如果問題仍然存在，請提供：
1. Cloudflare Workers 日誌輸出（搜尋 "Google Places"）
2. Google Cloud Console 中已啟用的 API 列表截圖
3. 測試查詢和 AI 的回答

這樣可以更快診斷問題！
