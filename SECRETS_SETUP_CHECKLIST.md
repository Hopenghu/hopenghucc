# ✅ Secrets 設置檢查清單

> **狀態**: 待設置  
> **優先級**: P0（關鍵）

---

## 📋 當前狀態

- ✅ Cloudflare 已登入
- ❌ 尚未設置任何 secrets
- ⚠️ 網站返回 404（因為缺少 secrets）

---

## 🔐 需要設置的 Secrets

### 必需的 Secrets（必須設置）

- [ ] `GOOGLE_MAPS_API_KEY` - Google Maps API Key
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth Client ID  
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- [ ] `JWT_SECRET` - JWT 簽名密鑰（可自動生成）

### 可選的 Secrets（如果使用 AI 功能）

- [ ] `OPENAI_API_KEY` - OpenAI API Key
- [ ] `GEMINI_API_KEY` - Google Gemini API Key

---

## 🚀 快速設置步驟

### 步驟 1: 生成 JWT Secret（可選）

已為你生成一個 JWT Secret，你可以使用它：

```bash
# 使用生成的 JWT Secret
npx wrangler secret put JWT_SECRET
# 貼上下面生成的 JWT Secret
```

**生成的 JWT Secret**: 見下方「生成的 Secrets」區塊

---

### 步驟 2: 設置 Google API Keys

你需要從 Google Cloud Console 獲取這些 keys：

1. **前往**: https://console.cloud.google.com/
2. **選擇專案** → **APIs & Services** → **Credentials**
3. **獲取或創建**:
   - Google Maps API Key
   - OAuth 2.0 Client ID 和 Secret

**設置命令**:
```bash
npx wrangler secret put GOOGLE_MAPS_API_KEY
# 貼上你的 Google Maps API Key

npx wrangler secret put GOOGLE_CLIENT_ID
# 貼上你的 Google OAuth Client ID

npx wrangler secret put GOOGLE_CLIENT_SECRET
# 貼上你的 Google OAuth Client Secret
```

---

### 步驟 3: 驗證設置

```bash
npx wrangler secret list
```

應該看到所有設置的 secrets。

---

### 步驟 4: 重新部署

```bash
npm run build
npx wrangler deploy
```

---

### 步驟 5: 驗證網站

```bash
# 等待 1-2 分鐘
sleep 60

# 測試網站
curl -I https://www.hopenghu.cc
```

預期結果: **HTTP 200**（不是 404）

---

## 📝 生成的 Secrets

### JWT Secret（已生成）

你可以使用以下命令生成新的 JWT Secret：

```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**注意**: 每次執行都會生成不同的值，這是正常的。選擇一個並保存好。

---

## 🔗 獲取 API Keys 的詳細步驟

### Google Maps API Key

1. 前往: https://console.cloud.google.com/
2. 選擇專案
3. **APIs & Services** → **Credentials**
4. 點擊「**+ CREATE CREDENTIALS**」→「**API key**」
5. 複製生成的 API Key
6. 點擊 API Key 進入詳情頁面
7. 在「**API restrictions**」中，選擇「**Restrict key**」
8. 勾選以下 API：
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Directions API（路線規劃需要）

### Google OAuth Credentials

1. 前往: https://console.cloud.google.com/
2. 選擇專案
3. **APIs & Services** → **Credentials**
4. 點擊「**+ CREATE CREDENTIALS**」→「**OAuth client ID**」
5. 如果首次使用，需要先配置 OAuth consent screen
6. 選擇應用程式類型：**Web application**
7. 設置「**Authorized redirect URIs**」:
   ```
   https://www.hopenghu.cc/api/auth/google/callback
   ```
8. 創建後，複製 **Client ID** 和 **Client Secret**

---

## ✅ 完成檢查清單

設置完成後，確認：

- [ ] `npx wrangler secret list` 顯示所有必需的 secrets
- [ ] Worker 已重新部署
- [ ] 等待 1-2 分鐘後測試網站
- [ ] `curl -I https://www.hopenghu.cc` 返回 HTTP 200
- [ ] 網站可以正常訪問
- [ ] Google Maps 地圖正常顯示
- [ ] Google OAuth 登入功能正常

---

## 🔍 故障排除

### 問題：設置後網站仍返回 404

**解決方案**:
1. 確認所有必需的 secrets 已設置：`npx wrangler secret list`
2. 重新部署：`npm run build && npx wrangler deploy`
3. 等待 1-2 分鐘
4. 檢查日誌：`npx wrangler tail`

### 問題：Secret 設置失敗

**解決方案**:
1. 確認已登入：`npx wrangler whoami`
2. 確認有足夠權限
3. 檢查網路連線
4. 確認 secret 值正確（沒有多餘空格）

---

## 📚 相關文檔

- 快速設置指南: `QUICK_SECRETS_SETUP.md`
- 完整設置指南: `CLOUDFLARE_SECRETS_SETUP.md`
- 下一步總結: `NEXT_STEPS_SUMMARY.md`

---

**下一步**: 開始設置 secrets，使用 `./scripts/setup-secrets.sh` 或手動設置

