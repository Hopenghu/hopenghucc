# 🔍 API Key Configuration Missing 錯誤診斷報告

## 📊 問題描述

**錯誤訊息**: "Internal Server Error - API Key Configuration Missing"  
**影響範圍**: 整個網站 (hopenghu.cc)  
**HTTP 狀態碼**: 500

## 🔍 根本原因分析

### 問題1: LocationService 缺少 API Key 參數

在以下文件中，`LocationService` 被實例化時沒有傳遞 `GOOGLE_MAPS_API_KEY`：

1. ✅ **已修復**: `src/pages/Home.js` (第 18 行)
2. ✅ **已修復**: `src/api/location.js` (第 59 行)
3. ✅ **已修復**: `src/api/debug.js` (第 70 行)

### 問題2: 環境變數在 Cloudflare 中可能未正確設置

雖然 `wrangler.toml` 中配置了環境變數，但部署到 Cloudflare 時，環境變數可能沒有正確傳遞。

## 🛠️ 解決方案

### 步驟1: 驗證環境變數配置

檢查 `wrangler.toml` 中的環境變數配置：

```toml
[vars]
# Note: Sensitive keys should be set via Cloudflare Workers secrets
# Use: wrangler secret put <KEY_NAME>
GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI = "https://www.hopenghu.cc/auth/google/callback"
JWT_SECRET = "YOUR_JWT_SECRET"
```

### 步驟2: 重新構建和部署

```bash
# 1. 重新構建 Worker
npm run build

# 2. 部署到 Cloudflare
npx wrangler deploy

# 3. 驗證部署
curl https://www.hopenghu.cc/
```

### 步驟3: 檢查 Cloudflare 控制台

1. 登入 Cloudflare Dashboard: https://dash.cloudflare.com/
2. 前往 Workers & Pages → hopenghucc
3. 檢查 Settings → Variables 確保環境變數已設置
4. 查看 Logs 以獲取詳細錯誤訊息

### 步驟4: 使用 Wrangler 檢查環境變數

```bash
# 檢查環境變數是否正確設置
npx wrangler secret list

# 如果需要設置 secret（敏感資訊）
npx wrangler secret put GOOGLE_MAPS_API_KEY
```

## 🔧 已修復的代碼

### 1. src/pages/Home.js
```javascript
// 修復前
const locationService = new LocationService(env.DB);

// 修復後
const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
```

### 2. src/api/location.js
```javascript
// 修復前
const locationService = new LocationService(env.DB);

// 修復後
const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
```

### 3. src/api/debug.js
```javascript
// 修復前
const locationService = new LocationService(env.DB);

// 修復後
const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
```

## 📋 驗證步驟

1. **檢查代碼修復**:
   ```bash
   grep -r "new LocationService(env.DB)" src/
   ```
   應該只找到不需要 API key 的實例（如 debug 用途）

2. **重新構建**:
   ```bash
   npm run build
   ```

3. **部署**:
   ```bash
   npx wrangler deploy
   ```

4. **測試網站**:
   ```bash
   curl https://www.hopenghu.cc/
   ```

5. **檢查日誌**:
   ```bash
   npx wrangler tail
   ```

## ⚠️ 注意事項

1. **API Key 安全性**: 
   - `GOOGLE_MAPS_API_KEY` 在 `wrangler.toml` 中是明文存儲的
   - 如果這是公開的 API key（前端使用），這是正常的
   - 如果是私密 key，應該使用 `wrangler secret put` 設置

2. **LocationService 構造函數**:
   - `mapsApiKey` 參數是可選的
   - 但如果後續代碼需要使用 Google Maps API，必須提供
   - 缺少 API key 時，某些功能會失敗但不一定會拋出錯誤

3. **錯誤訊息來源**:
   - 錯誤訊息 "API Key Configuration Missing" 可能來自：
     - Cloudflare 控制台的錯誤處理
     - 某個中間件或錯誤處理邏輯
     - 前端代碼的錯誤處理

## 🎯 下一步

1. ✅ 修復所有缺少 API key 的 LocationService 實例化
2. ⏳ 重新構建和部署 Worker
3. ⏳ 驗證網站是否正常運作
4. ⏳ 檢查 Cloudflare 日誌確認沒有其他錯誤

---

**狀態**: 代碼修復完成，等待部署驗證  
**建議**: 部署後檢查 Cloudflare 日誌以確認問題是否解決

