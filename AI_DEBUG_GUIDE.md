# AI 服務除錯指南

## 問題：AI 一直回覆「抱歉，AI 服務暫時無法使用。請稍後再試。」

### 可能原因

1. **OpenAI API Key 無效或過期**
   - 檢查 API Key 是否正確
   - 檢查 API Key 是否已過期
   - 檢查 API Key 是否有足夠的額度

2. **API Key 格式錯誤**
   - OpenAI API Key 應該以 `sk-` 開頭
   - 檢查 wrangler.toml 中的配置

3. **網路連線問題**
   - Cloudflare Workers 無法連接到 OpenAI API
   - 檢查防火牆設定

4. **API 限流**
   - OpenAI API 可能有速率限制
   - 檢查是否超過使用限制

## 檢查步驟

### 1. 檢查 Cloudflare Workers 日誌

訪問 Cloudflare Dashboard：
1. 登入 Cloudflare Dashboard
2. 選擇 Workers & Pages
3. 選擇 `hopenghucc` worker
4. 查看 Logs 標籤頁
5. 搜尋 `[AIService]` 或 `[AI API]` 相關日誌

### 2. 檢查 API Key

在 Cloudflare Dashboard 中：
1. 選擇 Workers & Pages > hopenghucc
2. 選擇 Settings > Variables
3. 檢查 `OPENAI_API_KEY` 是否正確設置
4. 確認 API Key 以 `sk-` 開頭

### 3. 測試 API Key

可以使用以下 curl 命令測試 API Key：

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

如果返回 401 錯誤，表示 API Key 無效。

### 4. 檢查錯誤訊息

現在錯誤處理已改進，會在日誌中記錄詳細錯誤：
- `[AIService] OpenAI API error:` - OpenAI API 錯誤
- `[AIService] Error calling OpenAI:` - 網路或連線錯誤
- `[AI API] Error handling query:` - API 處理錯誤

## 常見錯誤碼

- **401 Unauthorized**: API Key 無效或過期
- **403 Forbidden**: API Key 沒有權限
- **429 Too Many Requests**: 超過速率限制
- **500 Internal Server Error**: OpenAI 服務器錯誤

## 解決方案

### 方案 1：更新 API Key

1. 前往 OpenAI Platform: https://platform.openai.com/api-keys
2. 創建新的 API Key
3. 更新 wrangler.toml 中的 `OPENAI_API_KEY`
4. 重新部署：
   ```bash
   npm run build
   npm run deploy
   ```

### 方案 2：檢查 API 額度

1. 前往 OpenAI Platform: https://platform.openai.com/usage
2. 檢查是否有剩餘額度
3. 如果沒有，需要添加付款方式

### 方案 3：檢查網路連線

如果 Cloudflare Workers 無法連接到 OpenAI API，可能需要：
1. 檢查 Cloudflare Workers 的網路設定
2. 確認沒有被防火牆阻擋
3. 檢查 OpenAI API 服務狀態

## 測試 API

部署後，可以通過以下方式測試：

1. **瀏覽器 Console**
   - 打開開發者工具
   - 查看 Network 標籤頁
   - 發送一個 AI 查詢
   - 查看 `/api/ai/query` 請求的回應

2. **直接測試 API**
   ```bash
   curl -X POST https://www.hopenghu.cc/api/ai/query \
     -H "Content-Type: application/json" \
     -d '{"message":"測試","sessionId":"test123"}'
   ```

## 日誌範例

正常運作時應該看到：
```
[AIService] Calling OpenAI API with: { model: 'gpt-3.5-turbo', ... }
[AIService] OpenAI API response status: 200
[AI API] Query result: { success: true, ... }
```

錯誤時應該看到：
```
[AIService] OpenAI API error: { status: 401, error: { message: 'Invalid API key' } }
[AIService] Error handling query: OpenAI API error (401): Invalid API key
```

## 下一步

如果問題持續，請：
1. 收集 Cloudflare Workers 日誌
2. 檢查 API Key 是否有效
3. 測試 API Key 是否可以直接使用
4. 聯繫 OpenAI 支援（如果是 API 問題）
