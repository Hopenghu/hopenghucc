# CSP (Content Security Policy) 錯誤修復

## ✅ 已修復的問題

### 問題描述
頁面出現 CSP 錯誤：
```
The Content Security Policy (CSP) prevents the evaluation of arbitrary strings as JavaScript
```

### 原因
1. **AIChatPage 沒有設置 CSP headers**：頁面回應只包含 `Content-Type`，缺少 CSP headers
2. **CSP 設定不完整**：SecurityService 的 CSP 設定缺少 Google Maps API 和 AI API 所需的來源

## 🔧 已完成的修復

### 1. 更新 SecurityService CSP 設定

**新增的來源：**
- `https://ajax.googleapis.com` - Google Extended Component Library
- `https://generativelanguage.googleapis.com` - Google Gemini API
- `https://api.openai.com` - OpenAI API
- `https://maps.googleapis.com` - Google Maps API（已存在，但確保完整）
- `https://maps.gstatic.com` - Google Maps 靜態資源

**完整的 CSP 設定：**
```javascript
script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 
  https://apis.google.com 
  https://maps.googleapis.com 
  https://accounts.google.com 
  https://ajax.googleapis.com

connect-src 'self' 
  https://apis.google.com 
  https://accounts.google.com 
  https://maps.googleapis.com 
  https://www.googleapis.com 
  https://oauth2.googleapis.com 
  https://generativelanguage.googleapis.com 
  https://api.openai.com
```

### 2. 更新 AIChatPage

**修復前：**
```javascript
return new Response(pageTemplate({...}), {
  headers: { 'Content-Type': 'text/html;charset=utf-8' }
});
```

**修復後：**
```javascript
const { SecurityService } = await import('../services/SecurityService.js');
const securityService = new SecurityService();
const securityHeaders = securityService.getCSPHeaders();

return new Response(pageTemplate({...}), {
  headers: { 
    'Content-Type': 'text/html;charset=utf-8',
    ...securityHeaders  // 包含 CSP headers
  }
});
```

## 📋 CSP 設定說明

### 為什麼需要 `unsafe-eval`？

Google Maps JavaScript API 在載入時會使用：
- `eval()` - 動態執行 JavaScript
- `new Function()` - 動態建立函數
- `setTimeout([string])` - 字串形式的回調

這些功能需要 `unsafe-eval` 才能運作。

### 安全性考量

雖然 `unsafe-eval` 會降低安全性，但：
1. **Google Maps API 是可信來源**：來自 Google 的官方 API
2. **必要功能**：Google Maps API 需要這些功能才能正常運作
3. **其他安全措施**：我們仍然使用 nonce、限制來源等安全措施

## 🧪 測試方法

### 測試 1：檢查 CSP headers

1. 打開瀏覽器開發者工具
2. 前往 Network 標籤
3. 重新載入 `/ai-chat` 頁面
4. 檢查回應 headers，應該看到：
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' 'unsafe-inline' 'unsafe-eval' ...
   ```

### 測試 2：檢查控制台錯誤

1. 打開瀏覽器開發者工具
2. 前往 Console 標籤
3. 重新載入 `/ai-chat` 頁面
4. **應該沒有 CSP 錯誤**

### 測試 3：測試 AI 功能

1. 發送測試查詢：「你有黑山頭 Hasento Inn 的資訊嗎？」
2. 確認 AI 功能正常運作
3. 確認沒有 CSP 錯誤

## ⚠️ 如果仍有問題

### 問題 1：仍然看到 CSP 錯誤

**可能原因：**
- 瀏覽器快取了舊的 CSP 設定
- 其他頁面沒有設置 CSP headers

**解決方法：**
1. 清除瀏覽器快取
2. 硬重新載入（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 檢查其他頁面是否也需要更新

### 問題 2：Google Maps 無法載入

**可能原因：**
- CSP 設定缺少某些來源
- Google Maps API Key 問題

**解決方法：**
1. 檢查瀏覽器控制台的錯誤訊息
2. 確認錯誤是否與 CSP 相關
3. 檢查 Network 標籤，確認 Google Maps API 請求是否成功

## 📝 其他頁面

目前只有 `AIChatPage` 更新了 CSP headers。如果其他頁面也出現 CSP 錯誤，需要同樣更新：

1. 導入 SecurityService
2. 獲取 CSP headers
3. 將 headers 加入 Response

## ✅ 總結

- ✅ 已更新 SecurityService CSP 設定
- ✅ 已更新 AIChatPage 使用 CSP headers
- ✅ 已包含所有必要的來源（Google Maps、AI APIs）
- ✅ 已部署到生產環境

**請測試 `/ai-chat` 頁面，確認 CSP 錯誤已解決！**
