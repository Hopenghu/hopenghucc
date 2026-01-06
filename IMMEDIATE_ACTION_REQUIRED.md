# 🚨 立即需要執行的行動

> **狀態**: 網站無法運行（返回 404）  
> **原因**: 缺少 Cloudflare Workers Secrets  
> **優先級**: P0（關鍵）

---

## 📊 當前狀態

✅ **已完成**:
- Git 歷史清理完成
- Worker 部署成功
- Cloudflare 已登入
- 所有工具和文檔已準備就緒

❌ **待處理**:
- **缺少 4 個必需的 Secrets**（這是網站無法運行的原因）
- 網站返回 HTTP 404

---

## 🔐 需要立即設置的 Secrets

### 必需的 Secrets（4 個）

1. **GOOGLE_MAPS_API_KEY** - Google Maps API Key
2. **GOOGLE_CLIENT_ID** - Google OAuth Client ID
3. **GOOGLE_CLIENT_SECRET** - Google OAuth Client Secret
4. **JWT_SECRET** - JWT 簽名密鑰（已生成，見下方）

---

## 🚀 快速設置（3 種方法）

### 方法 1: 使用自動化腳本（最簡單）⭐

```bash
./scripts/setup-secrets.sh
```

腳本會引導你完成所有設置。

---

### 方法 2: 手動設置（逐步）

#### 步驟 1: 設置 JWT Secret（已生成）

```bash
npx wrangler secret put JWT_SECRET
# 貼上: Cu40unfaPtd2QDL8FUwMn0630nWVYlYNgd0fpc4fN88=
```

**或生成新的**:
```bash
./scripts/generate-jwt-secret.sh
```

#### 步驟 2: 獲取 Google API Keys

你需要從 Google Cloud Console 獲取：

1. **前往**: https://console.cloud.google.com/
2. **選擇專案** → **APIs & Services** → **Credentials**
3. **獲取或創建**:
   - Google Maps API Key
   - OAuth 2.0 Client ID 和 Secret

**詳細步驟**: 見 `SECRETS_SETUP_CHECKLIST.md`

#### 步驟 3: 設置 Google API Keys

```bash
npx wrangler secret put GOOGLE_MAPS_API_KEY
# 貼上你的 Google Maps API Key

npx wrangler secret put GOOGLE_CLIENT_ID
# 貼上你的 Google OAuth Client ID

npx wrangler secret put GOOGLE_CLIENT_SECRET
# 貼上你的 Google OAuth Client Secret
```

#### 步驟 4: 驗證設置

```bash
./scripts/check-secrets-status.sh
```

應該看到所有 4 個必需的 secrets 都已設置。

#### 步驟 5: 重新部署

```bash
npm run build
npx wrangler deploy
```

#### 步驟 6: 驗證網站

```bash
# 等待 1-2 分鐘
sleep 60

# 測試網站
curl -I https://www.hopenghu.cc
```

預期結果: **HTTP 200** ✅

---

### 方法 3: 查看詳細指南

```bash
# 快速指南（5 分鐘）
cat QUICK_SECRETS_SETUP.md

# 完整指南
cat CLOUDFLARE_SECRETS_SETUP.md

# 檢查清單
cat SECRETS_SETUP_CHECKLIST.md
```

---

## 📝 已生成的 JWT Secret

你可以使用以下 JWT Secret（已生成）：

```
Cu40unfaPtd2QDL8FUwMn0630nWVYlYNgd0fpc4fN88=
```

**或生成新的**:
```bash
./scripts/generate-jwt-secret.sh
```

---

## 🔗 獲取 Google API Keys

### Google Maps API Key

1. 前往: https://console.cloud.google.com/
2. 選擇專案
3. **APIs & Services** → **Credentials**
4. 點擊「**+ CREATE CREDENTIALS**」→「**API key**」
5. 複製 API Key
6. 點擊 API Key 進入詳情
7. 在「**API restrictions**」中勾選：
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Directions API

### Google OAuth Credentials

1. 前往: https://console.cloud.google.com/
2. 選擇專案
3. **APIs & Services** → **Credentials**
4. 點擊「**+ CREATE CREDENTIALS**」→「**OAuth client ID**」
5. 設置「**Authorized redirect URIs**」:
   ```
   https://www.hopenghu.cc/api/auth/google/callback
   ```
6. 複製 **Client ID** 和 **Client Secret**

---

## ✅ 完成檢查清單

設置完成後，確認：

- [ ] `./scripts/check-secrets-status.sh` 顯示所有 4 個必需的 secrets
- [ ] Worker 已重新部署
- [ ] 等待 1-2 分鐘
- [ ] `curl -I https://www.hopenghu.cc` 返回 HTTP 200
- [ ] 網站可以正常訪問

---

## 🔍 故障排除

### 問題：設置後網站仍返回 404

**解決方案**:
1. 確認所有 secrets 已設置：`./scripts/check-secrets-status.sh`
2. 重新部署：`npm run build && npx wrangler deploy`
3. 等待 1-2 分鐘
4. 檢查日誌：`npx wrangler tail`

### 問題：無法獲取 Google API Keys

**解決方案**:
1. 確認 Google Cloud Console 帳號有權限
2. 確認專案已啟用計費（某些 API 需要）
3. 查看詳細指南：`SECRETS_SETUP_CHECKLIST.md`

---

## 📚 相關文檔

| 文檔 | 用途 |
|------|------|
| `QUICK_SECRETS_SETUP.md` | ⚡ 5 分鐘快速設置 |
| `SECRETS_SETUP_CHECKLIST.md` | ✅ 詳細檢查清單 |
| `CLOUDFLARE_SECRETS_SETUP.md` | 📚 完整設置指南 |
| `NEXT_STEPS_SUMMARY.md` | 📋 所有下一步總結 |

---

## 🛠️ 可用工具

| 工具 | 用途 |
|------|------|
| `./scripts/setup-secrets.sh` | 自動化設置所有 secrets |
| `./scripts/check-secrets-status.sh` | 檢查 secrets 設置狀態 |
| `./scripts/generate-jwt-secret.sh` | 生成 JWT Secret |

---

## ⏱️ 預估時間

- **獲取 Google API Keys**: 10-15 分鐘
- **設置 Secrets**: 5 分鐘
- **重新部署**: 2 分鐘
- **驗證**: 1 分鐘

**總計**: 約 20 分鐘

---

## 🎯 下一步

1. **立即執行**: `./scripts/setup-secrets.sh`
2. **或手動設置**: 按照上方「方法 2」步驟
3. **驗證**: `./scripts/check-secrets-status.sh`
4. **重新部署**: `npm run build && npx wrangler deploy`
5. **測試**: `curl -I https://www.hopenghu.cc`

---

**優先級**: P0（關鍵）  
**狀態**: 待執行  
**預估時間**: 20 分鐘

