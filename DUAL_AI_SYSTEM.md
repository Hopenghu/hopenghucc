# 雙引擎 AI 系統說明

## 系統架構

現在系統支援雙引擎 AI 架構：

1. **Gemini（旅客模式）**
   - 使用 Google Gemini 2.0 Flash 模型
   - 適合：旅遊路線、天氣、交通、景點推薦
   - 支援圖片識別（未來功能）

2. **GPT（居民/知識庫模式）**
   - 使用 OpenAI GPT-3.5-turbo 模型
   - 適合：知識整理、事實校正、資訊摘要
   - 優先使用資料庫中的地點資訊

## 模型選擇邏輯

### 自動判斷（預設）

系統會根據以下規則自動選擇模型：

1. **已登入使用者**：預設使用 GPT（居民/知識庫模式）
2. **未登入使用者**：
   - 如果查詢包含旅客關鍵字（旅遊、路線、天氣、交通、推薦、景點、行程、怎麼去、怎麼走）→ 使用 Gemini
   - 如果查詢包含居民關鍵字（整理、校正、事實、知識庫、編輯、摘要）→ 使用 GPT
   - 其他情況 → 預設使用 Gemini（旅客模式）

### 手動指定模式

API 請求可以包含 `mode` 參數：

```json
{
  "message": "澎湖哪裡可以看夕陽？",
  "sessionId": "session_xxx",
  "mode": "traveler"  // 或 "resident"
}
```

- `mode: "traveler"` → 強制使用 Gemini
- `mode: "resident"` → 強制使用 GPT
- `mode: null` 或不提供 → 自動判斷

## API 使用方式

### 基本查詢（自動選擇模型）

```javascript
fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '澎湖哪裡可以看夕陽？',
    sessionId: 'session_xxx'
  })
})
```

### 指定模式

```javascript
// 使用 Gemini（旅客模式）
fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '澎湖哪裡可以看夕陽？',
    sessionId: 'session_xxx',
    mode: 'traveler'  // 強制使用 Gemini
  })
})

// 使用 GPT（居民模式）
fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '整理天后宮的資訊',
    sessionId: 'session_xxx',
    mode: 'resident'  // 強制使用 GPT
  })
})
```

## API 回應格式

```json
{
  "success": true,
  "message": "AI 的回答內容...",
  "sessionId": "session_xxx",
  "model": "gemini",  // 或 "gpt"
  "mode": "traveler"  // 或 "resident"
}
```

## 系統提示詞

### Gemini 系統提示詞（旅客模式）

```
你是澎湖旅客 AI 導遊助手。

你的任務：
1. 即時理解使用者需求
2. 提供旅遊建議（路線、天氣、季節、交通、安全）
3. 讀取圖片（如果使用者提供）
4. 提供最新公開資訊
5. 溫暖清晰的溝通
```

### GPT 系統提示詞（居民/知識庫模式）

```
你是「澎湖知識庫總編輯 AI」，負責整理居民、旅客、官方與非官方的訊息。

你要做到：
1. 整理、摘要、校正事實
2. 忠實呈現居民聲音（不要抹去差異）
3. 不確定時要明確說不確定
4. 回答時保持「在地觀點 + 可讀性」
```

## 使用場景

### 旅客模式（Gemini）適合：

- "澎湖哪裡可以看夕陽？"
- "推薦三天兩夜的行程"
- "這個季節適合去哪些景點？"
- "從機場到市區怎麼走？"
- "澎湖的天氣如何？"

### 居民模式（GPT）適合：

- "整理天后宮的資訊"
- "校正這個地點的資料"
- "摘要使用者對這個地點的評價"
- "整理知識庫中的相關資訊"

## 資料庫記錄

所有對話都會記錄在 `ai_conversations` 表中，包含：
- `message_type`: 'user' 或 'assistant'
- `message_content`: 訊息內容
- `context_data`: JSON 格式，包含使用的模型和模式資訊

## 成本考量

- **Gemini 2.0 Flash**: $0.075 / 1M tokens（輸入），$0.30 / 1M tokens（輸出）
- **GPT-3.5-turbo**: $0.50 / 1M tokens（輸入），$1.50 / 1M tokens（輸出）

Gemini 通常比 GPT 便宜，適合大量使用的旅客查詢。

## 未來改進

1. **圖片識別**：使用 Gemini 的圖片識別功能
2. **更智能的模型選擇**：使用機器學習判斷最佳模型
3. **模型效能比較**：記錄不同模型的回答品質
4. **使用者偏好**：讓使用者可以設定偏好的模型

## 測試建議

1. **測試自動選擇**：
   - 未登入：詢問旅遊問題 → 應該使用 Gemini
   - 已登入：詢問任何問題 → 應該使用 GPT

2. **測試手動指定**：
   - 指定 `mode: "traveler"` → 應該使用 Gemini
   - 指定 `mode: "resident"` → 應該使用 GPT

3. **檢查回應**：
   - 確認 `model` 和 `mode` 欄位正確
   - 確認回答符合對應模式的風格
