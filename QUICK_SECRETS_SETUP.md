# ⚡ 快速 Secrets 設置指南

> **快速開始**: 5 分鐘內設置所有必需的 secrets

---

## 🚀 方法 1: 使用自動化腳本（推薦）

```bash
# 執行設置腳本
./scripts/setup-secrets.sh
```

腳本會引導你：
- ✅ 檢查 Cloudflare 登入狀態
- ✅ 逐一設置所有 secrets
- ✅ 自動生成 JWT Secret（可選）
- ✅ 驗證設置
- ✅ 重新部署 Worker（可選）

---

## 🔧 方法 2: 手動設置

### 步驟 1: 確認登入

```bash
npx wrangler whoami
```

如果未登入：
```bash
npx wrangler login
```

### 步驟 2: 設置必需的 Secrets

```bash
# 1. Google Maps API Key
npx wrangler secret put GOOGLE_MAPS_API_KEY
# 貼上你的 API Key 後按 Enter

# 2. Google OAuth Client ID
npx wrangler secret put GOOGLE_CLIENT_ID
# 貼上你的 Client ID 後按 Enter

# 3. Google OAuth Client Secret
npx wrangler secret put GOOGLE_CLIENT_SECRET
# 貼上你的 Client Secret 後按 Enter

# 4. JWT Secret（生成隨機字串）
openssl rand -base64 32 | npx wrangler secret put JWT_SECRET
# 或手動輸入
npx wrangler secret put JWT_SECRET
```

### 步驟 3: 驗證設置

```bash
npx wrangler secret list
```

應該看到：
```
[
  {
    "name": "GOOGLE_MAPS_API_KEY",
    "type": "secret_text"
  },
  {
    "name": "GOOGLE_CLIENT_ID",
    "type": "secret_text"
  },
  {
    "name": "GOOGLE_CLIENT_SECRET",
    "type": "secret_text"
  },
  {
    "name": "JWT_SECRET",
    "type": "secret_text"
  }
]
```

### 步驟 4: 重新部署

```bash
npm run build
npx wrangler deploy
```

---

## 📝 獲取 API Keys

### Google Maps API Key

1. 前往: https://console.cloud.google.com/
2. 選擇專案 → APIs & Services → Credentials
3. 創建或選擇 API Key
4. 確保啟用：
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Directions API（路線規劃需要）

### Google OAuth Credentials

1. 前往: https://console.cloud.google.com/
2. 選擇專案 → APIs & Services → Credentials
3. 創建 OAuth 2.0 Client ID
4. 設置重定向 URI: `https://www.hopenghu.cc/api/auth/google/callback`

### JWT Secret

使用以下命令生成：

```bash
# 方法 1: 使用 openssl
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ 驗證清單

設置完成後確認：

- [ ] `npx wrangler secret list` 顯示所有必需的 secrets
- [ ] Worker 已重新部署
- [ ] 等待 1-2 分鐘後測試網站
- [ ] `curl -I https://www.hopenghu.cc` 返回 HTTP 200（不是 404）

---

## 🔍 故障排除

### 問題：網站仍返回 404

**解決方案**：
1. 確認所有必需的 secrets 已設置
2. 重新部署：`npm run build && npx wrangler deploy`
3. 等待 1-2 分鐘
4. 檢查日誌：`npx wrangler tail`

### 問題：Secret 設置失敗

**解決方案**：
1. 確認已登入：`npx wrangler whoami`
2. 確認有足夠權限
3. 檢查網路連線

---

## 📚 詳細文檔

- 完整設置指南: `CLOUDFLARE_SECRETS_SETUP.md`
- 部署報告: `DEPLOYMENT_COMPLETE_REPORT.md`

---

**預估時間**: 5-10 分鐘  
**優先級**: P0（必需）

