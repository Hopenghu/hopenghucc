# AI 問問題系統 - 實作完成報告

## 已完成的工作

### 1. 資料庫擴展

已建立遷移檔案：`migrations/0027_add_ai_questioning_system.sql`

**新增/擴展的資料表：**

1. **users 表擴展**
   - `user_type` - 使用者類型（traveler, merchant, local）
   - `is_merchant` - 是否為商家

2. **locations 表擴展**
   - `opening_hours` - 營業時間（JSON 格式）
   - `business_type` - 商家類型
   - `is_merchant` - 是否為商家

3. **merchant_products 表（新增）**
   - 儲存商家產品資訊
   - 欄位：產品名稱、描述、價格、消費時間、類別

4. **travel_memories 表（新增）**
   - 儲存旅遊回憶
   - 欄位：回憶內容、造訪日期、同行人員、是否想再去、原因、評分

5. **location_distances 表（新增）**
   - 快取地點之間的距離和時間
   - 整合 Google Maps Distance Matrix API

6. **ai_conversation_states 表（新增）**
   - 追蹤問問題的對話狀態
   - 儲存已收集的資料和上下文

7. **fixed_information 表（新增）**
   - 記錄所有收集到的固定資訊
   - 支援多種資訊類型：航班、產品價格、距離時間、營業時間、消費時間

### 2. AI 問問題服務

已建立：`src/services/AIQuestioningService.js`

**核心功能：**
- 對話狀態管理
- 使用者類型判斷（商家 vs 旅客）
- 問題生成邏輯（商家設定、旅遊回憶）
- 結構化資訊提取（價格、時間、日期等）
- 資料儲存（商家產品、旅遊回憶）

### 3. 距離計算服務

已建立：`src/services/DistanceService.js`

**核心功能：**
- 整合 Google Maps Distance Matrix API
- 距離和時間計算
- 快取機制（30 天）
- 從查詢中自動識別地點並計算距離

### 4. AI Service 整合

已更新：`src/services/AIService.js`

**新增功能：**
- 整合問問題服務
- 整合距離計算服務
- 改進提示詞（嚴格禁止編造地點）
- 支援問問題流程
- 自動儲存收集到的固定資訊

### 5. API 端點更新

已更新：`src/api/ai.js`

**新增功能：**
- 支援 Google Maps API Key
- 傳遞距離服務到 AI Service

## 系統運作流程

### 商家引導流程

1. **識別商家**：檢查使用者是否 claim 了地點
2. **詢問地點**：「請問您要提供資訊的商家名稱是什麼？」
3. **確認地點**：「這是您的商家嗎？」
4. **詢問商家類型**：「請問您的商家類型是什麼？」
5. **詢問營業時間**：「請問您的營業時間是？」
6. **詢問產品**：「請問您提供什麼產品或服務？」
7. **詢問價格**：「請問 [產品名稱] 的價格是多少？」
8. **詢問消費時間**：「請問 [產品名稱] 的消費時間大約需要多久？」
9. **儲存資訊**：將所有資訊儲存到資料庫

### 旅客引導流程

1. **識別旅客**：未登入或未 claim 地點的使用者
2. **詢問地點**：「您想分享哪個地點的回憶？」
3. **詢問回憶**：「請分享您在 [地點名稱] 的回憶或體驗。」
4. **詢問同行人員**：「您當時和誰一起去的？」
5. **詢問造訪日期**：「您是什麼時候去的？」
6. **詢問再次造訪意願**：「您還想再去 [地點名稱] 嗎？」
7. **詢問原因**：「為什麼想再去呢？」（如果想再去）
8. **儲存資訊**：將回憶儲存到資料庫

### 距離查詢流程

1. **識別距離查詢**：檢測「從 A 到 B」或「A 到 B 的距離」等模式
2. **查詢快取**：檢查 `location_distances` 表
3. **計算距離**：如果沒有快取，呼叫 Google Maps Distance Matrix API
4. **儲存快取**：將結果儲存到快取表
5. **回答使用者**：提供距離和時間資訊

## 固定資訊類型

### 1. 航班資訊（未來功能）
- 資訊類型：`flight`
- 固定特性：班次、時間（固定但非規律）

### 2. 產品價格
- 資訊類型：`product_price`
- 固定特性：價格、產品名稱
- 儲存位置：`merchant_products` 表

### 3. 距離時間
- 資訊類型：`distance_time`
- 固定特性：距離、時間（可透過 API 計算）
- 儲存位置：`location_distances` 表

### 4. 營業時間
- 資訊類型：`business_hours`
- 固定特性：營業時間
- 儲存位置：`locations.opening_hours`

### 5. 消費時間
- 資訊類型：`consumption_time`
- 固定特性：產品消費所需時間
- 儲存位置：`merchant_products.duration_minutes`

## Google Maps API 設定

### 已確認
- ✅ Distance Matrix API 已啟用
- ✅ API Key 已配置：`GOOGLE_MAPS_API_KEY`

### API 使用
- **端點**：`https://maps.googleapis.com/maps/api/distancematrix/json`
- **參數**：origins, destinations, mode, language, key
- **快取**：30 天

### 成本
- 免費額度：每月 40,000 次請求
- 付費：$5.00 / 1,000 次請求

## 資料庫設計檢查

### 已解決的問題

1. ✅ **使用者類型識別**：透過 `user_type` 和 `is_merchant` 欄位
2. ✅ **商家產品資訊**：`merchant_products` 表支援多個產品
3. ✅ **營業時間**：`locations.opening_hours` 欄位（JSON 格式）
4. ✅ **旅遊回憶**：`travel_memories` 表支援詳細回憶資訊
5. ✅ **距離快取**：`location_distances` 表，30 天過期

### 資料庫結構

所有必要的資料表都已建立，支援：
- 商家固定資訊（產品、價格、時間、營業時間）
- 旅客感覺資訊（回憶、感受、未來計劃）
- 距離時間計算（整合 Google Maps API）
- 對話狀態追蹤（問問題進度）

## 下一步操作

### 1. 執行資料庫遷移

```bash
# 本地測試
npm run migrate

# 生產環境
npm run migrate:remote
```

### 2. 建置和部署

```bash
npm run build
npm run deploy
```

### 3. 測試問問題系統

**測試商家流程：**
1. 登入並 claim 一個地點
2. 詢問：「我想提供商家資訊」
3. 按照 AI 的問題回答

**測試旅客流程：**
1. 未登入或登入但未 claim 地點
2. 詢問：「我想分享回憶」
3. 按照 AI 的問題回答

**測試距離查詢：**
1. 詢問：「從天后宮到機場的距離」
2. AI 應該計算並回答距離和時間

## 注意事項

1. **資料庫遷移**：必須先執行遷移才能使用新功能
2. **Google Maps API**：確認 API Key 有 Distance Matrix API 權限
3. **問問題流程**：對話狀態會持續追蹤，直到完成或使用者中斷
4. **資訊提取**：目前使用簡單的正則表達式，未來可以改進為更智能的 NLP

## 未來改進

1. **更智能的資訊提取**：使用 NLP 技術更準確地提取結構化資訊
2. **地點名稱匹配**：改進地點名稱的識別和匹配邏輯
3. **營業時間解析**：將文字轉換為結構化的 JSON 格式
4. **多輪對話優化**：改進對話流程，讓使用者可以跳過或修改回答
