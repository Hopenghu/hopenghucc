# 核心模型整合測試指南

## 🧪 測試概述

本指南提供測試核心模型整合功能的步驟和方法。

**測試日期：** 2025-01-20  
**測試狀態：** 準備就緒

---

## ✅ 已完成項目

### 1. 數據庫遷移
- ✅ 遷移文件 `0035_add_conversation_stage_system.sql` 已執行
- ✅ 創建了新表和字段
- ✅ 添加了索引

### 2. 核心服務
- ✅ `RelationshipDepthService.js` - 已創建
- ✅ `InformationExtractionService.js` - 已創建
- ✅ `AIService.js` - 已整合

### 3. 代碼驗證
- ✅ 所有文件通過語法檢查
- ✅ 整合點驗證通過

---

## 📋 手動驗證步驟

### 步驟 1: 驗證數據庫結構

#### 1.1 檢查新表是否存在

```bash
# 檢查 user_relationship_profiles 表
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='user_relationship_profiles';"

# 檢查 conversation_summaries 表
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='conversation_summaries';"
```

#### 1.2 檢查新字段是否存在

```bash
# 檢查 ai_conversation_states 表的新字段
npx wrangler d1 execute hopenghucc_db --remote --command="PRAGMA table_info(ai_conversation_states);"

# 檢查 ai_conversations 表的新字段
npx wrangler d1 execute hopenghucc_db --remote --command="PRAGMA table_info(ai_conversations);"
```

**預期結果：**
- `ai_conversation_states` 表應該有：
  - `conversation_stage` (TEXT, DEFAULT 'initial')
  - `total_rounds` (INTEGER, DEFAULT 0)
  - `relationship_depth` (REAL, DEFAULT 0.0)
- `ai_conversations` 表應該有：
  - `metadata` (TEXT)

---

### 步驟 2: 測試關係深度計算

#### 2.1 創建測試會話

在 AI 聊天頁面發送第一條訊息，例如：
```
我想來澎湖玩
```

#### 2.2 檢查關係深度

```bash
# 查詢對話狀態
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

**預期結果：**
- `conversation_stage`: 'initial'
- `total_rounds`: 1
- `relationship_depth`: 0-5

#### 2.3 進行多輪對話

繼續發送 5-10 條訊息，提供身份和興趣資訊：
```
我是第一次來澎湖
我喜歡海灘和美食
我計劃夏天來
```

#### 2.4 再次檢查關係深度

```bash
# 查詢更新後的關係深度
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

**預期結果：**
- `conversation_stage`: 'getting_to_know' 或 'familiar'
- `total_rounds`: 5-10
- `relationship_depth`: 20-50

---

### 步驟 3: 測試動態 Prompt

#### 3.1 檢查 Prompt 內容

在開發環境中，查看控制台日誌：
```
[AIService] Relationship depth calculated: { ... }
```

#### 3.2 驗證階段特定規則

根據對話階段，AI 的回應應該不同：

- **初識期 (initial):**
  - 應該專注於確認身份
  - 不應該提供建議
  - 應該問：「你是住在這裡的澎湖人？還是來玩的？甚或是正計畫要來？」

- **認識期 (getting_to_know):**
  - 應該自然探索興趣
  - 不應該像問卷一樣連續發問
  - 應該基於對話自然延伸

- **熟悉期 (familiar):**
  - 應該記得先前對話
  - 可以提供初步建議
  - 基於已知的偏好

- **朋友期 (friend):**
  - 應該像老朋友一樣互動
  - 主動關心
  - 提供深度個人化建議

---

### 步驟 4: 測試資訊提取

#### 4.1 發送包含資訊的訊息

```
我是澎湖居民，住在馬公市，我喜歡海灘和潛水
```

#### 4.2 檢查用戶檔案更新

```bash
# 查詢用戶資訊
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT user_type, interests FROM users WHERE id='YOUR_USER_ID';"
```

**預期結果：**
- `user_type`: 'local'
- `interests`: JSON 包含興趣資訊

---

## 🔍 驗證檢查清單

### 數據庫結構
- [ ] `user_relationship_profiles` 表存在
- [ ] `conversation_summaries` 表存在
- [ ] `ai_conversation_states.conversation_stage` 字段存在
- [ ] `ai_conversation_states.total_rounds` 字段存在
- [ ] `ai_conversation_states.relationship_depth` 字段存在
- [ ] `ai_conversations.metadata` 字段存在
- [ ] 所有索引已創建

### 功能驗證
- [ ] 關係深度計算正常
- [ ] 對話階段轉換正確
- [ ] 對話輪次自動增加
- [ ] 動態 Prompt 組裝正確
- [ ] 資訊提取功能正常
- [ ] 用戶檔案自動更新

### 對話質量
- [ ] 初識期：專注確認身份，不提供建議
- [ ] 認識期：自然探索興趣，不過度提問
- [ ] 熟悉期：記得先前對話，提供初步建議
- [ ] 朋友期：像老朋友一樣互動，主動關心

---

## 🐛 常見問題排查

### 問題 1: 關係深度始終為 0

**可能原因：**
- 對話狀態未正確創建
- 收集的資料為空

**解決方法：**
```bash
# 檢查對話狀態
npx wrangler d1 execute hopenghucc_db --remote --command="SELECT * FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"
```

### 問題 2: 對話階段不轉換

**可能原因：**
- 關係深度計算邏輯有問題
- 對話輪次未正確增加

**解決方法：**
- 檢查 `RelationshipDepthService.calculateRelationshipDepth()` 的日誌
- 確認對話輪次是否自動增加

### 問題 3: Prompt 未動態調整

**可能原因：**
- `relationshipInfo` 未正確傳遞
- Prompt 組裝邏輯有問題

**解決方法：**
- 檢查控制台日誌中的 `relationshipInfo`
- 確認 `buildGPTSystemPrompt(relationshipInfo)` 被正確調用

---

## 📊 測試場景示例

### 場景 1: 新用戶首次對話

**輸入：**
```
我想來澎湖玩
```

**預期：**
- 關係深度：0-5
- 對話階段：'initial'
- AI 回應：專注確認身份，不提供建議

### 場景 2: 多輪對話後

**輸入（5-8 輪對話）：**
```
我是第一次來澎湖
我喜歡海灘和美食
我計劃夏天來
```

**預期：**
- 關係深度：20-50
- 對話階段：'getting_to_know'
- AI 回應：自然探索興趣，不過度提問

### 場景 3: 深度互動

**輸入（15+ 輪對話）：**
- 提供完整的偏好資訊
- 分享旅行計劃
- 詢問詳細建議

**預期：**
- 關係深度：75+
- 對話階段：'friend'
- AI 回應：像老朋友一樣互動，主動關心

---

## 🚀 性能測試

### 測試關係深度計算性能

```bash
# 在開發環境中測試
time node -e "
  const { RelationshipDepthService } = require('./src/services/RelationshipDepthService.js');
  // 測試代碼
"
```

**預期：**
- 關係深度計算應該在 100ms 內完成
- 不應該影響主要對話流程

---

## 📝 測試報告模板

### 測試結果記錄

```
測試日期：2025-01-20
測試人員：[姓名]

數據庫結構：
- [ ] 所有表存在
- [ ] 所有字段存在
- [ ] 所有索引存在

功能測試：
- [ ] 關係深度計算：通過/失敗
- [ ] 對話階段轉換：通過/失敗
- [ ] 動態 Prompt：通過/失敗
- [ ] 資訊提取：通過/失敗

對話質量：
- [ ] 初識期行為：通過/失敗
- [ ] 認識期行為：通過/失敗
- [ ] 熟悉期行為：通過/失敗
- [ ] 朋友期行為：通過/失敗

問題記錄：
1. [問題描述]
2. [問題描述]

建議：
1. [建議內容]
2. [建議內容]
```

---

## 📚 相關文檔

- `CORE_MODEL_INTEGRATION_REPORT.md` - 詳細整合報告
- `CORE_MODEL_INTEGRATION_VERIFICATION.md` - 驗證報告
- `penghu_ai_core_model.md` - 核心模型文檔

---

**測試指南版本：** v1.0  
**最後更新：** 2025-01-20
