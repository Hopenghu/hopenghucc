# 核心模型整合報告

## 整合概述

本報告記錄了將 `penghu_ai_core_model.md` 的核心概念整合到現有系統的實施情況。

**整合日期：** 2025-01-20  
**整合狀態：** ✅ 高優先級項目已完成

---

## ✅ 已完成項目

### 1. 數據庫結構擴展

**文件：** `migrations/0035_add_conversation_stage_system.sql`

**新增內容：**
- ✅ 擴展 `ai_conversation_states` 表：
  - `conversation_stage`（對話階段：initial/getting_to_know/familiar/friend）
  - `total_rounds`（對話輪次）
  - `relationship_depth`（關係深度 0-100）
- ✅ 擴展 `ai_conversations` 表：
  - `metadata`（JSON 格式，存儲提取的信息和 AI 決策）
- ✅ 創建 `user_relationship_profiles` 表（用戶關係檔案）
- ✅ 創建 `conversation_summaries` 表（對話摘要，用於長期記憶）

**索引優化：**
- 為對話階段、關係深度等字段創建了索引以優化查詢性能

---

### 2. 關係深度計算服務

**文件：** `src/services/RelationshipDepthService.js`

**核心功能：**
- ✅ `calculateRelationshipDepth()` - 計算關係深度（0-100）
  - 對話輪次貢獻 (40%)
  - 資訊完整度 (30%)
  - 偏好明確度 (20%)
  - 回訪次數 (10%)
- ✅ `getConversationStage()` - 根據關係深度確定對話階段
- ✅ `getOrCreateRelationshipProfile()` - 獲取或創建用戶關係檔案
- ✅ `updateRelationshipProfile()` - 更新關係檔案
- ✅ `incrementConversationRounds()` - 增加對話輪次
- ✅ `getStageSpecificRule()` - 獲取階段特定規則
- ✅ `getStageGoal()` - 獲取階段目標
- ✅ `formatRememberedFacts()` - 格式化記憶的重要資訊

---

### 3. 動態 Prompt 組裝

**文件：** `src/services/AIService.js`

**修改內容：**
- ✅ 導入 `RelationshipDepthService`
- ✅ 修改 `buildGPTSystemPrompt()` - 支持動態參數（關係深度資訊）
- ✅ 修改 `buildGeminiSystemPrompt()` - 支持動態參數（關係深度資訊）
- ✅ 保留基本版本方法（向後兼容）
- ✅ 在 `handleQuery()` 中整合關係深度計算
- ✅ 在 API 調用時傳入關係深度資訊
- ✅ 添加 `extractInterests()` - 從收集的資料中提取興趣
- ✅ 添加 `extractRememberedFacts()` - 從收集的資料中提取重要事實

**動態 Prompt 特點：**
- 根據對話階段（initial/getting_to_know/familiar/friend）動態調整
- 包含關係深度、對話輪次、已知興趣、記憶的重要資訊
- 每個階段有不同的目標和規則

---

### 4. 資訊提取服務

**文件：** `src/services/InformationExtractionService.js`

**核心功能：**
- ✅ `extractInformation()` - 提取使用者訊息中的關鍵資訊
- ✅ `extractWithGemini()` - 使用 Gemini Pro 進行資訊提取（結構化輸出好）
- ✅ `extractWithOpenAI()` - 使用 OpenAI 進行資訊提取
- ✅ `extractWithRegex()` - 使用正則表達式提取（回退方案）
- ✅ `normalizeExtractedData()` - 標準化提取的資料
- ✅ `updateUserProfile()` - 根據提取的資訊更新用戶檔案

**提取的資訊類型：**
- 用戶類型（resident/visitor/potential_visitor/curious/unknown）
- 興趣列表（帶信心度）
- 旅行計劃（是否計劃、時間框架、持續時間）
- 情感語調（positive/neutral/negative/excited/worried）
- 是否需要後續跟進
- 建議的下一個話題

---

### 5. 對話記錄更新

**修改內容：**
- ✅ 在保存對話時記錄關係深度資訊
- ✅ 自動增加對話輪次計數
- ✅ 更新對話狀態中的階段和關係深度

---

## 📋 待完成項目

### 6. 記憶機制分層（中優先級）

**計劃內容：**
- [ ] 實現短期記憶（當前對話的最近 5-10 輪）
- [ ] 實現中期記憶（用戶檔案中的結構化資訊）
- [ ] 實現長期記憶（摘要化的重要對話片段）
- [ ] 創建 `MemoryService.js` 統一管理記憶機制

**當前狀態：**
- 短期記憶：已通過 `getConversationHistory()` 實現
- 中期記憶：已通過用戶檔案實現
- 長期記憶：需要實現對話摘要功能

---

### 7. 對話品質控制（低優先級）

**計劃內容：**
- [ ] 創建 `ConversationQualityService.js`
- [ ] 實現對話品質指標計算（自然度、資訊獲取量、用戶參與度、關係進展）
- [ ] 實現異常處理規則（用戶沮喪、不清楚輸入、API 錯誤等）

---

### 8. API 選擇策略優化（中優先級）

**計劃內容：**
- [ ] 根據對話階段選擇 API
  - 初識期：Gemini 2.0 Flash（快速、便宜）
  - 深度對話：GPT-4（推理能力強）
- [ ] 資訊提取：Gemini Pro（結構化輸出好）

**當前狀態：**
- 基本 API 選擇邏輯已實現（根據用戶登入狀態和查詢內容）
- 需要根據對話階段進一步優化

---

## 🔧 使用方式

### 運行數據庫遷移

```bash
npm run migrate:remote
```

### 在代碼中使用

關係深度服務會自動在 `AIService.handleQuery()` 中調用，無需手動調用。

如果需要手動計算關係深度：

```javascript
const relationshipDepthService = new RelationshipDepthService(db);
const depthResult = await relationshipDepthService.calculateRelationshipDepth(userId, sessionId);
console.log('關係深度:', depthResult.relationshipDepth);
console.log('對話階段:', depthResult.stage);
```

---

## 📊 整合效果

### 預期改進

1. **更智能的對話階段管理**
   - AI 會根據關係深度自動調整對話策略
   - 初識期專注於確認身份，不提供建議
   - 朋友期像老朋友一樣互動，提供深度個人化建議

2. **更準確的資訊提取**
   - 使用 AI 提取非結構化資訊
   - 自動更新用戶檔案和偏好

3. **更好的用戶體驗**
   - 對話會隨著關係深度增加而變得更加個人化
   - AI 會記住之前的重要資訊

---

## 🐛 已知問題

1. **向後兼容性**
   - 如果數據庫中沒有新字段，會使用預設值
   - 舊的對話記錄不會自動計算關係深度

2. **性能考量**
   - 每次對話都會計算關係深度，可能影響性能
   - 建議在背景異步執行部分計算

---

## 📝 下一步計劃

1. **立即執行：**
   - [ ] 運行數據庫遷移
   - [ ] 測試關係深度計算邏輯
   - [ ] 測試動態 Prompt 組裝

2. **近期完成：**
   - [ ] 實現記憶機制分層
   - [ ] 優化 API 選擇策略
   - [ ] 添加對話品質監控

3. **未來優化：**
   - [ ] 實現敏感資訊過濾
   - [ ] 添加對話摘要功能
   - [ ] 優化性能（異步計算）

---

## 📚 參考文檔

- `penghu_ai_core_model.md` - 核心模型文檔
- `migrations/0035_add_conversation_stage_system.sql` - 數據庫遷移
- `src/services/RelationshipDepthService.js` - 關係深度服務
- `src/services/InformationExtractionService.js` - 資訊提取服務
- `src/services/AIService.js` - AI 服務（已整合）

---

**整合完成日期：** 2025-01-20  
**整合狀態：** ✅ 高優先級項目已完成，可以開始測試
