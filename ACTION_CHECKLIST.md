# 核心模型整合 - 行動檢查清單

## ✅ 已完成項目

### 數據庫和代碼
- [x] 數據庫遷移文件創建 (`0035_add_conversation_stage_system.sql`)
- [x] 數據庫遷移執行成功
- [x] `RelationshipDepthService.js` 創建完成
- [x] `InformationExtractionService.js` 創建完成
- [x] `AIService.js` 整合完成
- [x] 代碼語法檢查通過
- [x] 數據庫結構驗證通過

### 文檔和工具
- [x] 整合報告文檔創建
- [x] 測試指南創建
- [x] 測試場景文檔創建
- [x] 驗證腳本創建

---

## 🚀 立即執行（建議優先）

### 1. 構建項目

```bash
npm run build
```

**檢查點：**
- [ ] 構建成功，無錯誤
- [ ] `dist/worker.js` 文件已生成

---

### 2. 啟動開發環境

```bash
npm start
```

**檢查點：**
- [ ] 開發服務器成功啟動
- [ ] 無初始化錯誤
- [ ] 可以訪問 `http://localhost:8787`

---

### 3. 功能測試

#### 3.1 打開 AI 聊天頁面

在瀏覽器中打開：
```
http://localhost:8787/ai-chat
```

#### 3.2 執行測試場景 1: 新用戶首次對話

**操作：**
1. 發送訊息：「我想來澎湖玩」

**驗證：**
- [ ] AI 回應包含身份確認問題
- [ ] 控制台顯示關係深度計算日誌
- [ ] 數據庫中 `conversation_stage` = 'initial'
- [ ] 數據庫中 `relationship_depth` = 0-10

**驗證 SQL：**
```bash
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

#### 3.3 執行測試場景 2: 多輪對話

**操作：**
1. 繼續對話 5-8 輪
2. 提供身份和興趣資訊

**驗證：**
- [ ] 關係深度增加到 20-50
- [ ] 對話階段轉換為 'getting_to_know'
- [ ] AI 回應符合認識期行為

#### 3.4 執行測試場景 3: 深度互動

**操作：**
1. 繼續對話至 15+ 輪
2. 提供完整偏好和計劃資訊

**驗證：**
- [ ] 關係深度達到 75+
- [ ] 對話階段轉換為 'friend'
- [ ] AI 回應符合朋友期行為

---

### 4. 數據驗證

#### 4.1 檢查關係深度分佈

```bash
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, COUNT(*) as count, AVG(relationship_depth) as avg_depth FROM ai_conversation_states GROUP BY conversation_stage;"
```

**預期：**
- [ ] 有不同階段的記錄
- [ ] 平均關係深度隨階段增加

#### 4.2 檢查對話輪次

```bash
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT AVG(total_rounds) as avg_rounds, MAX(total_rounds) as max_rounds FROM ai_conversation_states;"
```

**預期：**
- [ ] 平均對話輪次 > 0
- [ ] 最大對話輪次合理

---

## 📊 監控指標

### 每日檢查

```sql
-- 關係深度分佈
SELECT 
  conversation_stage,
  COUNT(*) as count,
  AVG(relationship_depth) as avg_depth,
  AVG(total_rounds) as avg_rounds
FROM ai_conversation_states
WHERE DATE(updated_at) = DATE('now')
GROUP BY conversation_stage;
```

### 每週檢查

```sql
-- 階段轉換率
SELECT 
  conversation_stage,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ai_conversation_states), 2) as percentage
FROM ai_conversation_states
GROUP BY conversation_stage;
```

---

## 🐛 問題排查

### 如果關係深度不更新

1. **檢查控制台日誌：**
   ```
   [AIService] Relationship depth calculated: { ... }
   ```

2. **檢查數據庫：**
   ```sql
   SELECT * FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;
   ```

3. **檢查服務初始化：**
   - 確認 `RelationshipDepthService` 已正確初始化
   - 確認數據庫連接正常

### 如果對話階段不轉換

1. **檢查關係深度值：**
   - 查看控制台日誌
   - 驗證計算邏輯

2. **檢查階段轉換閾值：**
   - initial: 0-19
   - getting_to_know: 20-49
   - familiar: 50-74
   - friend: 75-100

---

## 📝 測試記錄模板

```
測試日期：2025-01-20
測試人員：[姓名]

測試場景 1: 新用戶首次對話
- 關係深度：□ 通過 / □ 失敗
- 對話階段：□ 通過 / □ 失敗
- AI 行為：□ 通過 / □ 失敗

測試場景 2: 多輪對話
- 關係深度：□ 通過 / □ 失敗
- 對話階段：□ 通過 / □ 失敗
- AI 行為：□ 通過 / □ 失敗

測試場景 3: 深度互動
- 關係深度：□ 通過 / □ 失敗
- 對話階段：□ 通過 / □ 失敗
- AI 行為：□ 通過 / □ 失敗

發現的問題：
1. [問題描述]
2. [問題描述]

建議改進：
1. [建議內容]
2. [建議內容]
```

---

## 🎯 成功標準

### 功能標準
- ✅ 關係深度計算準確
- ✅ 對話階段轉換正確
- ✅ 動態 Prompt 正常工作
- ✅ AI 回應符合階段行為

### 性能標準
- ✅ 關係深度計算 < 100ms
- ✅ 不影響主要對話流程
- ✅ 數據庫查詢性能正常

### 用戶體驗標準
- ✅ 對話自然流暢
- ✅ AI 回應符合階段特徵
- ✅ 用戶感受到個人化體驗

---

**檢查清單版本：** v1.0  
**最後更新：** 2025-01-20
