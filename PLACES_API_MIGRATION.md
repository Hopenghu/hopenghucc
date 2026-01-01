# Places API 遷移說明

## 📋 現況分析

### 目前使用的端點（舊版格式）

1. **Text Search**：`/place/textsearch/json` (GET)
2. **Find Place**：`/place/findplacefromtext/json` (GET)
3. **Place Details**：`/place/details/json` (GET)

### 新版 Places API 端點

根據 Google Maps Platform 最新文件（2024）：
- **Text Search**：`https://places.googleapis.com/v1/places:searchText` (POST)
- **Find Place**：可能需要使用不同的端點
- **Place Details**：`https://places.googleapis.com/v1/places/{place_id}` (GET)

## ⚠️ 重要發現

### 舊版端點可能仍然可用

根據 Google 的遷移政策：
- 舊版端點（`/place/textsearch/json`）可能仍然可以使用
- 但需要確認是否只需要啟用 **Places API (New)** 即可
- 或者這些端點已經被完全取代

### 測試建議

1. **先測試舊版端點是否仍可用**
   - 使用目前的 API Key 和 Places API (New)
   - 測試 `/place/textsearch/json` 端點
   - 如果返回 "REQUEST_DENIED"，則需要遷移到新版 API

2. **如果舊版不可用，遷移到新版 API**
   - 使用 `https://places.googleapis.com/v1/places:searchText`
   - 改用 POST 方法和新的認證方式
   - 更新請求格式

## 🔧 需要確認的事項

### 1. 測試目前端點是否可用

請測試以下查詢，檢查 Cloudflare Workers 日誌：

```
查詢：「你有黑山頭 Hasento Inn 的資訊嗎？」
```

**檢查日誌中的錯誤訊息：**
- 如果看到 "REQUEST_DENIED"：需要遷移到新版 API
- 如果看到 "OK" 但沒有結果：可能是搜尋問題，不是 API 問題
- 如果看到其他錯誤：需要根據錯誤訊息處理

### 2. 確認 API 啟用狀態

根據您的截圖，您有：
- ✅ Places API (New) - 已啟用
- ❓ 需要確認舊版端點是否仍可用

## 🚀 遷移方案

### 方案 A：如果舊版端點仍可用（推薦）

如果 Google 仍然支援舊版端點，且只需要 Places API (New)：
- ✅ 不需要額外設定
- ✅ 代碼可以繼續使用
- ⚠️ 但需要測試確認

### 方案 B：遷移到新版 API

如果舊版端點已不可用，需要：
1. 更新 `searchPlaceByName` 方法使用新版端點
2. 更新 `findPlace` 方法使用新版端點
3. 改用 POST 方法和新的認證方式
4. 更新請求/回應格式

## 📝 下一步行動

1. **立即測試**：發送測試查詢，檢查日誌
2. **確認錯誤**：如果看到 "REQUEST_DENIED"，需要遷移
3. **根據結果決定**：是否需要更新代碼

## 🔍 診斷方法

### 檢查日誌中的錯誤

在 Cloudflare Workers 日誌中搜尋：
- `Google Places API response status`
- `REQUEST_DENIED`
- `INVALID_REQUEST`

### 如果看到 "REQUEST_DENIED"

這表示：
- 舊版端點已不可用
- 需要遷移到新版 API
- 或者需要啟用其他 API（但根據您的說明，應該不需要 Legacy API）

## 💡 建議

根據您的說明，**Places API (Legacy) 已停用**，那麼：

1. **如果舊版端點仍可用**：可能是因為 Google 仍然支援這些端點，只需要 Places API (New)
2. **如果舊版端點不可用**：需要遷移到新版 API 端點

**最簡單的確認方法**：測試一下，看日誌中的錯誤訊息！
