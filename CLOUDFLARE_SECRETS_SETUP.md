# Cloudflare Workers Secrets 設置指南

> **更新日期**: 2025-01-07  
> **狀態**: 需要設置

---

## 📋 概述

由於安全考量，敏感資訊（API Keys、Secrets）已從 `wrangler.toml` 中移除。這些資訊現在需要透過 Cloudflare Workers Secrets 來管理。

---

## 🔐 需要設置的 Secrets

以下 secrets 需要透過 `wrangler secret put` 命令設置：

| Secret 名稱 | 說明 | 是否必需 |
|------------|------|---------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key | ✅ 必需 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ 必需 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ 必需 |
| `OPENAI_API_KEY` | OpenAI API Key | ⚠️ 如果使用 AI 功能 |
| `GEMINI_API_KEY` | Google Gemini API Key | ⚠️ 如果使用 Gemini AI |
| `JWT_SECRET` | JWT 簽名密鑰 | ✅ 必需 |

---

## 🚀 設置步驟

### 步驟 1：確認已登入 Cloudflare

```bash
npx wrangler whoami
```

如果未登入，執行：
```bash
npx wrangler login
```

### 步驟 2：設置 Secrets

逐一設置每個 secret：

```bash
# Google Maps API Key
npx wrangler secret put GOOGLE_MAPS_API_KEY
# 輸入提示時，貼上你的 Google Maps API Key

# Google OAuth Client ID
npx wrangler secret put GOOGLE_CLIENT_ID
# 輸入提示時，貼上你的 Google OAuth Client ID

# Google OAuth Client Secret
npx wrangler secret put GOOGLE_CLIENT_SECRET
# 輸入提示時，貼上你的 Google OAuth Client Secret

# JWT Secret
npx wrangler secret put JWT_SECRET
# 輸入提示時，貼上你的 JWT Secret（建議使用強隨機字串）

# OpenAI API Key（如果使用）
npx wrangler secret put OPENAI_API_KEY
# 輸入提示時，貼上你的 OpenAI API Key

# Gemini API Key（如果使用）
npx wrangler secret put GEMINI_API_KEY
# 輸入提示時，貼上你的 Gemini API Key
```

### 步驟 3：驗證 Secrets 設置

```bash
# 列出所有 secrets（不會顯示值）
npx wrangler secret list
```

### 步驟 4：重新部署 Worker

設置 secrets 後，重新部署 Worker 以確保生效：

```bash
npm run build
npx wrangler deploy
```

---

## 📝 獲取 API Keys

### Google Maps API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 前往「APIs & Services」→「Credentials」
4. 找到或創建 API Key
5. 確保啟用了以下 API：
   - Maps JavaScript API
   - Places API
   - Directions API（路線規劃功能需要）

### Google OAuth Credentials

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 前往「APIs & Services」→「Credentials」
4. 創建 OAuth 2.0 Client ID
5. 設置授權重定向 URI：`https://www.hopenghu.cc/api/auth/google/callback`

### OpenAI API Key

1. 前往 [OpenAI Platform](https://platform.openai.com/)
2. 登入你的帳號
3. 前往「API Keys」
4. 創建新的 API Key

### Google Gemini API Key

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 創建新的 API Key

### JWT Secret

建議使用強隨機字串生成器：

```bash
# 使用 openssl 生成隨機字串
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ 驗證清單

設置完成後，確認：

- [ ] 所有必需的 secrets 已設置
- [ ] `npx wrangler secret list` 顯示所有 secrets
- [ ] Worker 已重新部署
- [ ] 網站功能正常運作
- [ ] Google Maps 地圖正常顯示
- [ ] Google OAuth 登入功能正常
- [ ] AI 功能（如果使用）正常運作

---

## 🔍 故障排除

### 問題：Secret 設置後功能仍無法使用

**解決方案**：
1. 確認 secret 名稱拼寫正確（區分大小寫）
2. 重新部署 Worker：`npx wrangler deploy`
3. 檢查 Worker 日誌：`npx wrangler tail`

### 問題：無法設置 Secret

**解決方案**：
1. 確認已登入：`npx wrangler whoami`
2. 確認有足夠權限
3. 檢查網路連線

### 問題：Secret 值包含特殊字元

**解決方案**：
- 使用引號包裹：`"your-secret-value"`
- 或使用環境變數檔案（`.dev.vars`）進行本地開發

---

## 📚 本地開發

對於本地開發，可以使用 `.dev.vars` 檔案（已在 `.gitignore` 中）：

```bash
# 創建 .dev.vars 檔案
cat > .dev.vars << 'EOF'
GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
EOF
```

然後使用 `npx wrangler dev` 進行本地開發。

---

## 🔗 相關資源

- [Cloudflare Workers Secrets 文檔](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

---

## ⚠️ 重要提醒

1. **不要將 secrets 提交到 Git**
   - 確保 `.dev.vars` 在 `.gitignore` 中
   - 不要將 secrets 寫入 `wrangler.toml`

2. **定期輪換 Secrets**
   - 建議每 3-6 個月輪換一次
   - 如果懷疑洩露，立即輪換

3. **使用最小權限原則**
   - 只啟用必要的 API
   - 限制 API Key 的使用範圍

---

**下一步**：執行 `npx wrangler secret put <KEY_NAME>` 設置所有必需的 secrets

