# Google Places API 與 AI 功能整合完成報告

## ✅ 已完成的工作

### 1. LocationService 擴展

在 `src/services/locationService.js` 中新增兩個方法：

#### `searchPlaceByName(query, region = 'tw')`
- 使用 Google Places **Text Search API**
- 根據地點名稱搜尋
- 限制在澎湖地區（50km 半徑，中心座標 23.5, 119.5）
- 返回最多 5 個結果

#### `findPlace(input, inputType = 'textquery')`
- 使用 Google Places **Find Place API**
- 更精確的搜尋（支援名稱、地址、電話）
- 同樣限制在澎湖地區
- 返回最多 5 個結果

### 2. AIService 整合

在 `src/services/AIService.js` 中：

#### `getLocationContext(query, searchGooglePlaces = true)`
- **改進**：當資料庫中找不到地點時，自動搜尋 Google Places
- **流程**：
  1. 先查詢資料庫
  2. 如果資料庫中沒有，且 `searchGooglePlaces = true`，則搜尋 Google Places
  3. 如果從 Google Places 找到，獲取完整詳情
  4. 標記來源（`isFromGooglePlaces: true`）

#### `buildUserPrompt(query, context)`
- **改進**：區分資料庫中的地點和從 Google Places 找到的地點
- **提示詞**：
  - 資料庫地點：標示為「資料庫中的地點資訊」
  - Google Places 地點：標示為「從 Google Maps 找到的地點資訊」
  - 明確指示 AI 說明資訊來源

## 🔧 需要的設定

### Google Cloud Console 設定

請確認以下 API 已啟用：

1. ✅ **Places API (New)** - 已確認有使用
2. ✅ **Places API (Legacy)** - 用於 Text Search 和 Find Place
3. ✅ **Distance Matrix API** - 已啟用（用於距離計算）

### API Key 權限

確認 `GOOGLE_MAPS_API_KEY` 有權限使用：
- ✅ Places API (New)
- ✅ Places API (Legacy) - **Text Search** 和 **Find Place**
- ✅ Distance Matrix API

### 檢查方式

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 進入「API 和服務」>「已啟用的 API」
4. 確認以下 API 已啟用：
   - Places API (New)
   - Places API (Legacy)
   - Distance Matrix API

## 📊 API 使用情況

### Text Search API
- **端點**：`https://maps.googleapis.com/maps/api/place/textsearch/json`
- **使用時機**：當資料庫中找不到地點時
- **限制**：限制在澎湖地區（50km 半徑）
- **成本**：$32.00 / 1,000 次請求

### Find Place API
- **端點**：`https://maps.googleapis.com/maps/api/place/findplacefromtext/json`
- **使用時機**：更精確的搜尋（目前使用此方法）
- **限制**：限制在澎湖地區（50km 半徑）
- **成本**：$17.00 / 1,000 次請求

### 免費額度
- 每月 $200 免費額度
- 足夠應付大部分使用情況

## 🎯 功能說明

### 運作流程

1. **使用者詢問地點**
   ```
   使用者：「你有黑山頭 Hasento Inn 的資訊嗎？」
   ```

2. **資料庫查詢**
   ```
   AI 系統：查詢資料庫中的 locations 表
   結果：沒有找到
   ```

3. **Google Places 搜尋**（自動觸發）
   ```
   AI 系統：呼叫 Google Places Find Place API
   查詢：「黑山頭 Hasento Inn」
   限制：澎湖地區（50km 半徑）
   結果：找到地點資訊
   ```

4. **獲取完整詳情**
   ```
   AI 系統：使用 Place ID 獲取完整詳情
   包含：名稱、地址、電話、網站、評分、簡介等
   ```

5. **AI 回答**
   ```
   AI：「根據 Google Maps 的資訊，黑山頭 Hasento Inn 位於...」
   ```

### 回答格式

- **資料庫中的地點**：
  - 「根據資料庫中的資訊...」
  - 優先使用資料庫資訊

- **Google Maps 找到的地點**：
  - 「根據 Google Maps 的資訊...」
  - 明確標示來源
  - 確認地址是否在澎湖

## 🧪 測試方法

### 測試 1：查詢資料庫中沒有的地點

```
步驟：
1. 詢問一個確定不在資料庫中但存在於 Google Maps 的地點
   「你有黑山頭 Hasento Inn 的資訊嗎？」
2. 觀察 AI 回答

預期結果：
✅ AI 應該從 Google Maps 找到地點
✅ AI 回答應該包含「根據 Google Maps 的資訊...」
✅ AI 應該提供地點的詳細資訊（地址、電話、評分等）
```

### 測試 2：查詢資料庫中已有的地點

```
步驟：
1. 詢問一個確定在資料庫中的地點
   「你有天后宮的資訊嗎？」
2. 觀察 AI 回答

預期結果：
✅ AI 應該使用資料庫資訊
✅ AI 回答應該包含「根據資料庫中的資訊...」
✅ 不會呼叫 Google Places API
```

### 測試 3：查詢不存在的地點

```
步驟：
1. 詢問一個不存在的地點
   「你有 XYZ 不存在地點 的資訊嗎？」
2. 觀察 AI 回答

預期結果：
✅ AI 應該明確說明「資料庫中沒有相關資訊，Google Maps 中也找不到」
✅ 不會編造地點資訊
```

## ⚠️ 注意事項

### 1. API 成本
- Google Places API 有使用成本
- 建議監控 API 使用量
- 每月有 $200 免費額度

### 2. 地區限制
- 目前限制在澎湖地區（50km 半徑）
- 如果找到的地點不在澎湖，AI 會提醒確認

### 3. 資料庫同步
- 從 Google Places 找到的地點**不會自動儲存**到資料庫
- 如果需要儲存，可以：
  - 手動匯入
  - 或實作自動儲存邏輯（未來功能）

### 4. 快取機制
- 目前沒有快取 Google Places 搜尋結果
- 每次查詢都會呼叫 API
- 可以考慮加入快取（未來改進）

## 🔄 未來改進

1. **自動儲存到資料庫**
   - 當從 Google Places 找到地點時，自動儲存到資料庫
   - 避免重複查詢

2. **快取機制**
   - 快取 Google Places 搜尋結果
   - 減少 API 呼叫次數

3. **更智能的地點匹配**
   - 使用相似度計算
   - 處理地點名稱變體

4. **批量搜尋**
   - 支援一次搜尋多個地點
   - 提高效率

## 📝 總結

✅ **已完成**：
- Google Places API 整合
- 自動搜尋功能
- AI 回答格式改進

✅ **已部署**：
- 所有更改已部署到生產環境

✅ **可以測試**：
- 現在可以測試「你有黑山頭 Hasento Inn 的資訊嗎？」
- AI 應該能夠從 Google Maps 找到並回答

## 🚨 如果遇到問題

### 問題 1：API 返回錯誤
- **檢查**：Google Cloud Console 中 API 是否已啟用
- **檢查**：API Key 是否有正確權限
- **檢查**：API Key 是否在 `wrangler.toml` 中正確設定

### 問題 2：找不到地點
- **檢查**：地點是否在澎湖地區
- **檢查**：地點名稱是否正確
- **檢查**：Google Maps 中是否有該地點

### 問題 3：AI 沒有使用 Google Maps 資訊
- **檢查**：`searchGooglePlaces` 參數是否為 `true`
- **檢查**：資料庫中是否已有該地點（會優先使用資料庫）
- **檢查**：日誌中的錯誤訊息

## 📞 需要協助

如果遇到任何問題，請提供：
1. 錯誤訊息
2. 查詢的地點名稱
3. 日誌輸出（如果有的話）

這樣可以更快診斷問題！
