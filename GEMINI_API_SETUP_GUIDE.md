# Google Gemini API Key 取得指南

## 如何取得 Google Gemini API Key

### 步驟 1：前往 Google AI Studio

1. 訪問：https://aistudio.google.com/
2. 使用您的 Google 帳號登入

### 步驟 2：建立 API Key

1. 登入後，點擊左側選單的 **"Get API key"** 或右上角的 **"Get API key"** 按鈕
2. 選擇以下其中一個選項：
   - **Create API key in new project**（在新專案中建立）
   - **Create API key in existing project**（在現有專案中建立）
3. 如果選擇新專案，輸入專案名稱（例如：`hopenghu-ai`）
4. 點擊 **"Create API key"**

### 步驟 3：複製 API Key

1. 系統會顯示您的 API Key（格式類似：`AIzaSy...`）
2. **立即複製並妥善保存**（只會顯示一次）
3. 點擊 **"Done"** 完成

### 步驟 4：設定 API 限制（建議）

1. 前往 Google Cloud Console：https://console.cloud.google.com/
2. 選擇您的專案
3. 前往 **APIs & Services** > **Credentials**
4. 點擊您的 API Key
5. 設定 **API restrictions**：
   - 選擇 **"Restrict key"**
   - 選擇 **"Gemini API"**
6. 設定 **Application restrictions**（可選）：
   - 可以限制只能從特定 IP 或網站使用
7. 點擊 **"Save"**

## API Key 格式

Google Gemini API Key 格式：
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- 通常以 `AIzaSy` 開頭
- 長度約 39 個字元

## 免費額度

Google Gemini API 提供免費額度：
- **Gemini 1.5 Flash**：每月 15 次請求/分鐘，1500 次請求/天
- **Gemini 1.5 Pro**：每月 2 次請求/分鐘，50 次請求/天

超過免費額度後，需要設定付款方式。

## 成本資訊

- **Gemini 1.5 Flash**：$0.075 / 1M tokens（輸入），$0.30 / 1M tokens（輸出）
- **Gemini 1.5 Pro**：$1.25 / 1M tokens（輸入），$5.00 / 1M tokens（輸出）

建議使用 **Gemini 1.5 Flash**，成本較低且速度較快。

## 安全注意事項

1. **不要將 API Key 提交到 Git**
   - 使用環境變數或 Cloudflare Workers 的 Secrets
   - 已加入 `.gitignore`

2. **定期輪換 API Key**
   - 如果 API Key 洩露，立即撤銷並建立新的

3. **設定使用限制**
   - 限制只能從 Cloudflare Workers 使用
   - 監控 API 使用量

## 測試 API Key

取得 API Key 後，可以使用以下方式測試：

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "你好"
      }]
    }]
  }'
```

如果成功，會返回 JSON 回應。

## 相關連結

- **Google AI Studio**：https://aistudio.google.com/
- **Gemini API 文件**：https://ai.google.dev/docs
- **定價資訊**：https://ai.google.dev/pricing
- **Google Cloud Console**：https://console.cloud.google.com/
