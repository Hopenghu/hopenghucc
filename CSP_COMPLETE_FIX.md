# CSP 完整修復方案

## 🔍 問題分析

根據 Console 錯誤，有以下問題：

### 問題 1: Google Fonts CSS 被阻止
**錯誤**: `Loading the stylesheet 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap' violates the following Content Security Policy directive: "style-src 'self' 'nonce-...' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com 'unsafe-inline'"`

**原因**: CSP 的 `style-src` 中缺少 `https://fonts.googleapis.com`，或者 `style-src-elem` 沒有正確設置

### 問題 2: 內聯樣式被阻止
**錯誤**: `Applying inline style violates the following Content Security Policy directive 'style-src ...'`

**原因**: `<style>` 標籤沒有 nonce

### 問題 3: 內聯事件處理器被阻止
**錯誤**: `itinerary:34 Executing inline event handler violates the following Content Security Policy directive`

**原因**: 可能有內聯事件處理器（如 `onclick="..."`）

### 問題 4: esm.sh 連接被阻止
**錯誤**: `Connecting to 'https://esm.sh/react@19.2.3/es2022/react.mjs.map' violates the following Content Security Policy directive: "connect-src 'self' https://maps.googleapis.com ..."`

**原因**: CSP 的 `connect-src` 中缺少 `https://esm.sh` 和 `https://*.esm.sh`

### 問題 5: App.tsx 404 錯誤
**錯誤**: `GET https://www.hopenghu.cc/ai-smart-itinerary-planner/App.tsx net::ERR_ABORTED 404 (Not Found)`

**原因**: 代碼嘗試加載 `App.tsx`，但應該加載 `App.js`

## ✅ 修復方案

### 修復 1: 為內聯樣式添加 nonce ✅
- **文件**: `src/pages/ItineraryPlanner.js:201`
- **修復**: `<style>` → `<style nonce="${nonce}">`

### 修復 2: 更新 CSP 策略 ✅
- **文件**: `src/pages/ItineraryPlanner.js:233`
- **修復**: 
  - 確保 `style-src` 包含 `https://fonts.googleapis.com`
  - 確保 `style-src-elem` 包含 `https://fonts.googleapis.com` 和 nonce
  - 確保 `connect-src` 包含 `https://esm.sh` 和 `https://*.esm.sh`

### 修復 3: 確認 App.js 路徑 ✅
- **文件**: `src/pages/ItineraryPlanner.js:89`
- **狀態**: 已經是 `App.js`，可能是瀏覽器緩存問題

