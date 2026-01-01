# 核心模型整合測試場景

## 🎯 測試目標

驗證核心模型整合功能是否正常工作，包括：
1. 關係深度計算
2. 對話階段轉換
3. 動態 Prompt 組裝
4. 資訊提取

---

## 📋 測試場景

### 場景 1: 新用戶首次對話（初識期）

**目標：** 驗證新用戶的關係深度計算和對話階段

**步驟：**
1. 打開 AI 聊天頁面
2. 發送第一條訊息：「我想來澎湖玩」
3. 觀察 AI 回應

**預期結果：**
- ✅ 關係深度：0-5
- ✅ 對話階段：'initial'
- ✅ AI 回應：專注確認身份，不提供建議
- ✅ AI 應該問：「你是住在這裡的澎湖人？還是來玩的？甚或是正計畫要來？」

**驗證 SQL：**
```sql
SELECT conversation_stage, total_rounds, relationship_depth 
FROM ai_conversation_states 
ORDER BY updated_at DESC 
LIMIT 1;
```

---

### 場景 2: 多輪對話後（認識期）

**目標：** 驗證關係深度隨對話增加而提升

**步驟：**
1. 繼續對話，回答 AI 的問題
2. 提供身份資訊：「我是第一次來澎湖」
3. 提供興趣資訊：「我喜歡海灘和美食」
4. 進行 5-8 輪對話

**預期結果：**
- ✅ 關係深度：20-50
- ✅ 對話階段：'getting_to_know'
- ✅ 對話輪次：5-8
- ✅ AI 回應：自然探索興趣，不過度提問

**驗證 SQL：**
```sql
SELECT conversation_stage, total_rounds, relationship_depth,
       json_extract(collected_data, '$.user_identity') as user_identity,
       json_extract(collected_data, '$.interests') as interests
FROM ai_conversation_states 
ORDER BY updated_at DESC 
LIMIT 1;
```

---

### 場景 3: 深度互動（熟悉期/朋友期）

**目標：** 驗證深度互動後的關係深度和對話階段

**步驟：**
1. 繼續對話，提供完整的偏好資訊
2. 分享旅行計劃：「我計劃夏天來，大概 3 天 2 夜」
3. 詢問詳細建議：「有什麼必去的景點嗎？」
4. 進行 15+ 輪對話

**預期結果：**
- ✅ 關係深度：75+
- ✅ 對話階段：'friend'
- ✅ 對話輪次：15+
- ✅ AI 回應：像老朋友一樣互動，主動關心，提供深度個人化建議

**驗證 SQL：**
```sql
SELECT conversation_stage, total_rounds, relationship_depth,
       json_extract(collected_data, '$.travel_plans') as travel_plans
FROM ai_conversation_states 
ORDER BY updated_at DESC 
LIMIT 1;
```

---

### 場景 4: 資訊提取測試

**目標：** 驗證資訊提取服務是否正常工作

**步驟：**
1. 發送包含多種資訊的訊息：
   ```
   我是澎湖居民，住在馬公市，我喜歡海灘、潛水和美食，我計劃下個月去七美島
   ```
2. 檢查用戶檔案是否更新

**預期結果：**
- ✅ 用戶類型：'local'
- ✅ 興趣：['beach', 'diving', 'food']
- ✅ 旅行計劃：已記錄

**驗證 SQL：**
```sql
SELECT user_type, interests 
FROM users 
WHERE id = 'YOUR_USER_ID';
```

---

### 場景 5: 對話階段轉換測試

**目標：** 驗證對話階段是否正確轉換

**測試步驟：**

#### 5.1 初識期 → 認識期
- 進行 3-5 輪對話
- 提供身份資訊
- **預期：** 關係深度達到 20+，階段轉換為 'getting_to_know'

#### 5.2 認識期 → 熟悉期
- 繼續對話至 10-12 輪
- 提供興趣和偏好資訊
- **預期：** 關係深度達到 50+，階段轉換為 'familiar'

#### 5.3 熟悉期 → 朋友期
- 繼續對話至 20+ 輪
- 提供完整的偏好和計劃資訊
- **預期：** 關係深度達到 75+，階段轉換為 'friend'

**驗證 SQL：**
```sql
-- 查看對話階段轉換歷史
SELECT conversation_stage, total_rounds, relationship_depth, updated_at
FROM ai_conversation_states 
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY updated_at;
```

---

## 🔍 驗證檢查點

### 數據庫驗證

#### 檢查新表
```bash
# 檢查 user_relationship_profiles
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT COUNT(*) as count FROM user_relationship_profiles;"

# 檢查 conversation_summaries
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT COUNT(*) as count FROM conversation_summaries;"
```

#### 檢查新字段
```bash
# 檢查 ai_conversation_states 的新字段
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 5;"
```

#### 檢查關係深度計算
```bash
# 查看關係深度分佈
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, AVG(relationship_depth) as avg_depth, COUNT(*) as count FROM ai_conversation_states GROUP BY conversation_stage;"
```

---

### 功能驗證

#### 檢查對話輪次自動增加
1. 發送一條訊息
2. 檢查 `total_rounds` 是否增加 1
3. 發送另一條訊息
4. 再次檢查 `total_rounds` 是否增加 1

#### 檢查關係深度更新
1. 進行多輪對話
2. 每次對話後檢查 `relationship_depth` 是否更新
3. 驗證關係深度是否隨對話增加而提升

#### 檢查對話階段轉換
1. 進行足夠的對話以觸發階段轉換
2. 檢查 `conversation_stage` 是否正確轉換
3. 驗證階段轉換的閾值是否正確

---

## 📊 預期數據示例

### 關係深度計算示例

| 對話輪次 | 資訊完整度 | 偏好數量 | 回訪次數 | 關係深度 | 對話階段 |
|---------|----------|---------|---------|---------|---------|
| 1 | 0% | 0 | 0 | 0 | initial |
| 3 | 40% | 1 | 0 | 12 | initial |
| 5 | 60% | 2 | 0 | 28 | getting_to_know |
| 10 | 80% | 5 | 1 | 58 | familiar |
| 20 | 100% | 8 | 3 | 88 | friend |

### 對話階段行為對比

| 階段 | AI 行為 | 示例回應 |
|------|---------|---------|
| initial | 專注確認身份，不提供建議 | 「你是住在這裡的澎湖人？還是來玩的？甚或是正計畫要來？」 |
| getting_to_know | 自然探索興趣，不過度提問 | 「哇！你也喜歡海灘啊？那你會潛水嗎？」 |
| familiar | 記得先前對話，提供初步建議 | 「記得你之前說你喜歡海灘，那我推薦你去...」 |
| friend | 像老朋友一樣互動，主動關心 | 「你上次說計劃夏天來，現在準備得怎麼樣了？需要我幫你規劃行程嗎？」 |

---

## 🐛 問題排查

### 問題 1: 關係深度始終為 0

**症狀：** 無論進行多少輪對話，關係深度都是 0

**可能原因：**
- 對話狀態未正確創建
- 收集的資料為空
- 關係深度計算邏輯有問題

**排查步驟：**
1. 檢查對話狀態是否存在：
   ```sql
   SELECT * FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;
   ```
2. 檢查收集的資料：
   ```sql
   SELECT collected_data FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;
   ```
3. 檢查控制台日誌中的關係深度計算結果

### 問題 2: 對話階段不轉換

**症狀：** 關係深度已達到 50+，但對話階段仍然是 'initial'

**可能原因：**
- 階段轉換邏輯有問題
- 關係深度更新未觸發階段更新

**排查步驟：**
1. 檢查關係深度計算結果：
   ```sql
   SELECT relationship_depth, conversation_stage FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;
   ```
2. 檢查階段轉換邏輯：
   - 查看 `RelationshipDepthService.getConversationStage()` 的實現
   - 驗證閾值是否正確（20, 50, 75）

### 問題 3: Prompt 未動態調整

**症狀：** AI 回應沒有根據對話階段調整

**可能原因：**
- `relationshipInfo` 未正確傳遞
- Prompt 組裝邏輯有問題

**排查步驟：**
1. 檢查控制台日誌：
   ```
   [AIService] Relationship depth calculated: { ... }
   ```
2. 檢查 Prompt 內容是否包含階段資訊
3. 驗證 `buildGPTSystemPrompt(relationshipInfo)` 是否被正確調用

---

## ✅ 測試完成檢查清單

- [ ] 數據庫結構驗證通過
- [ ] 關係深度計算正常
- [ ] 對話階段轉換正確
- [ ] 對話輪次自動增加
- [ ] 動態 Prompt 組裝正確
- [ ] 資訊提取功能正常
- [ ] 用戶檔案自動更新
- [ ] 初識期行為正確
- [ ] 認識期行為正確
- [ ] 熟悉期行為正確
- [ ] 朋友期行為正確

---

## 📝 測試報告模板

```
測試日期：2025-01-20
測試人員：[姓名]
測試環境：開發/生產

測試結果：
- 數據庫結構：✅ 通過 / ❌ 失敗
- 關係深度計算：✅ 通過 / ❌ 失敗
- 對話階段轉換：✅ 通過 / ❌ 失敗
- 動態 Prompt：✅ 通過 / ❌ 失敗
- 資訊提取：✅ 通過 / ❌ 失敗

發現的問題：
1. [問題描述]
2. [問題描述]

建議改進：
1. [建議內容]
2. [建議內容]
```

---

**測試場景版本：** v1.0  
**最後更新：** 2025-01-20
