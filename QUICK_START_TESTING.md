# 快速開始測試指南

## 🚀 立即開始測試

### 步驟 1: 啟動開發環境

```bash
# 啟動開發服務器
npm start
```

開發服務器將在 `http://localhost:8787` 啟動。

---

### 步驟 2: 打開 AI 聊天頁面

在瀏覽器中打開：
```
http://localhost:8787/ai-chat
```

或從首頁導航到 AI 聊天功能。

---

### 步驟 3: 執行測試場景

#### 測試場景 1: 新用戶首次對話

**操作：**
1. 發送第一條訊息：「我想來澎湖玩」

**預期結果：**
- ✅ AI 應該專注於確認身份
- ✅ AI 應該問：「你是住在這裡的澎湖人？還是來玩的？甚或是正計畫要來？」
- ✅ 關係深度：0-10
- ✅ 對話階段：'initial'

**驗證：**
```bash
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

---

#### 測試場景 2: 多輪對話後

**操作：**
1. 繼續對話，回答 AI 的問題
2. 發送：「我是第一次來澎湖」
3. 發送：「我喜歡海灘和美食」
4. 進行 5-8 輪對話

**預期結果：**
- ✅ 關係深度：20-50
- ✅ 對話階段：'getting_to_know'
- ✅ AI 應該自然探索興趣，不過度提問
- ✅ AI 應該記得之前的對話

**驗證：**
```bash
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth, json_extract(collected_data, '$.user_identity') as identity, json_extract(collected_data, '$.interests') as interests FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

---

#### 測試場景 3: 深度互動

**操作：**
1. 繼續對話，提供完整的偏好資訊
2. 發送：「我計劃夏天來，大概 3 天 2 夜」
3. 發送：「有什麼必去的景點嗎？」
4. 進行 15+ 輪對話

**預期結果：**
- ✅ 關係深度：75+
- ✅ 對話階段：'friend'
- ✅ AI 應該像老朋友一樣互動
- ✅ AI 應該主動關心，提供深度個人化建議

**驗證：**
```bash
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

---

## 🔍 檢查點

### 1. 控制台日誌

打開瀏覽器開發者工具，查看控制台日誌：

**應該看到的日誌：**
```
[AIService] Relationship depth calculated: {
  userType: '...',
  conversationStage: '...',
  relationshipDepth: ...,
  conversationRound: ...
}
```

### 2. 數據庫驗證

**檢查關係深度分佈：**
```sql
SELECT 
  conversation_stage,
  COUNT(*) as count,
  AVG(relationship_depth) as avg_depth,
  AVG(total_rounds) as avg_rounds
FROM ai_conversation_states
GROUP BY conversation_stage;
```

**檢查對話階段轉換：**
```sql
SELECT 
  conversation_stage,
  total_rounds,
  relationship_depth,
  updated_at
FROM ai_conversation_states
ORDER BY updated_at DESC
LIMIT 10;
```

---

## ✅ 驗證檢查清單

### 功能驗證
- [ ] 關係深度計算正常
- [ ] 對話階段轉換正確
- [ ] 對話輪次自動增加
- [ ] 動態 Prompt 組裝正確
- [ ] AI 回應符合階段行為

### 數據驗證
- [ ] `conversation_stage` 字段正確更新
- [ ] `total_rounds` 字段正確增加
- [ ] `relationship_depth` 字段正確計算
- [ ] `user_relationship_profiles` 表有記錄

### 行為驗證
- [ ] 初識期：專注確認身份，不提供建議
- [ ] 認識期：自然探索興趣，不過度提問
- [ ] 熟悉期：記得先前對話，提供初步建議
- [ ] 朋友期：像老朋友一樣互動，主動關心

---

## 🐛 問題排查

### 如果關係深度不更新

1. **檢查控制台錯誤：**
   - 打開瀏覽器開發者工具
   - 查看 Console 標籤
   - 查找 `[AIService]` 相關日誌

2. **檢查數據庫：**
   ```sql
   SELECT * FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;
   ```

3. **檢查服務初始化：**
   - 確認 `RelationshipDepthService` 已正確初始化
   - 確認數據庫連接正常

### 如果對話階段不轉換

1. **檢查關係深度計算：**
   - 查看控制台日誌中的關係深度值
   - 驗證計算邏輯是否正確

2. **檢查階段轉換閾值：**
   - initial: 0-19
   - getting_to_know: 20-49
   - familiar: 50-74
   - friend: 75-100

---

## 📊 預期結果示例

### 對話輪次 vs 關係深度

| 輪次 | 資訊完整度 | 偏好數量 | 關係深度 | 階段 |
|------|----------|---------|---------|------|
| 1 | 0% | 0 | 0 | initial |
| 3 | 40% | 1 | 12 | initial |
| 5 | 60% | 2 | 28 | getting_to_know |
| 10 | 80% | 5 | 58 | familiar |
| 20 | 100% | 8 | 88 | friend |

---

## 🎯 測試目標

通過這些測試，我們應該能夠驗證：

1. ✅ 關係深度計算是否準確
2. ✅ 對話階段轉換是否正確
3. ✅ 動態 Prompt 是否正常工作
4. ✅ AI 回應是否符合階段行為
5. ✅ 資訊提取是否正常

---

**測試開始時間：** 現在  
**預計測試時間：** 30-60 分鐘  
**測試狀態：** 準備就緒
