# 緩存清除指南

## 🔍 問題分析

根據錯誤信息，發現以下問題：

### 問題 1: CSP 與代碼不一致
**現象**: 錯誤顯示的 CSP 與代碼中的不一致
- 錯誤顯示: `style-src 'self' 'nonce-...' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com 'unsafe-inline'`
- 代碼中應該有: `style-src 'self' 'nonce-...' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.tailwindcss.com 'unsafe-inline'`

**原因**: 瀏覽器或 Cloudflare 緩存了舊的 HTML/CSP

### 問題 2: App.tsx 404 錯誤
**現象**: 瀏覽器嘗試加載 `App.tsx`，但代碼中已經是 `App.js`

**原因**: 
- Service Worker 緩存了舊的 JavaScript 代碼
- 瀏覽器緩存了舊的 HTML

## ✅ 已完成的修復

### 修復 1: 添加緩存控制頭 ✅
- **文件**: `src/pages/ItineraryPlanner.js:231-234`
- **修復**: 添加了以下緩存控制頭：
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`
- **狀態**: ✅ 已完成

### 修復 2: 確認代碼正確 ✅
- **文件**: `src/pages/ItineraryPlanner.js:89`
- **狀態**: ✅ 代碼中已經是 `App.js`

## 🧹 清除緩存步驟

### 步驟 1: 清除 Service Worker 緩存

1. **打開開發者工具** (F12)
2. **切換到 Application 標籤** (Chrome) 或 **Storage 標籤** (Firefox)
3. **找到 Service Workers**
   - Chrome: Application > Service Workers
   - Firefox: Storage > Service Workers
4. **取消註冊 Service Worker**
   - 點擊 "Unregister" 按鈕
   - 或點擊 "Update" 按鈕強制更新
5. **清除緩存存儲**
   - Chrome: Application > Cache Storage > 右鍵 > Delete
   - Firefox: Storage > Cache > 右鍵 > Delete All

### 步驟 2: 清除瀏覽器緩存

#### Chrome/Edge:
1. 打開開發者工具 (F12)
2. 右鍵點擊刷新按鈕
3. 選擇 "清空緩存並硬性重新載入" (Empty Cache and Hard Reload)
4. 或使用快捷鍵: `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)

#### Firefox:
1. 打開開發者工具 (F12)
2. 右鍵點擊刷新按鈕
3. 選擇 "清空緩存並重新載入" (Empty Cache and Hard Reload)
4. 或使用快捷鍵: `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)

#### Safari:
1. 打開開發者工具 (Cmd+Option+I)
2. 在開發者工具中，點擊 "清空緩存" (Empty Caches)
3. 或使用快捷鍵: `Cmd+Option+E`

### 步驟 3: 完全清除瀏覽器數據

如果上述步驟無效，請完全清除瀏覽器數據：

#### Chrome/Edge:
1. 設置 > 隱私和安全 > 清除瀏覽數據
2. 選擇 "時間範圍": "全部時間"
3. 勾選:
   - 緩存的圖片和文件
   - Cookie 和其他網站數據
   - 託管的應用數據
4. 點擊 "清除數據"

#### Firefox:
1. 設置 > 隱私與安全 > Cookie 和網站數據
2. 點擊 "清除數據"
3. 勾選所有選項
4. 點擊 "清除"

### 步驟 4: 使用無痕模式測試

1. 打開無痕/隱私窗口
   - Chrome/Edge: `Ctrl+Shift+N` (Windows/Linux) 或 `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
   - Safari: `Cmd+Shift+N`
2. 訪問 `https://www.hopenghu.cc/itinerary`
3. 檢查 Console 是否還有錯誤

### 步驟 5: 清除 Cloudflare 緩存（如果需要）

如果問題仍然存在，可能是 Cloudflare 緩存：

1. 登入 Cloudflare Dashboard
2. 選擇您的域名
3. 進入 "Caching" > "Configuration"
4. 點擊 "Purge Everything" 清除所有緩存
5. 或使用 "Custom Purge" 清除特定 URL

## 🔍 驗證步驟

清除緩存後，請：

1. **檢查 Network 標籤**
   - 打開開發者工具 > Network 標籤
   - 刷新頁面
   - 找到主文檔請求（通常是 `/itinerary`）
   - 查看 Response Headers
   - 確認 `Content-Security-Policy` 頭是否正確
   - 確認 `Cache-Control` 頭是否為 `no-cache, no-store, must-revalidate`

2. **檢查 Console**
   - 不應該有 CSP 錯誤
   - 不應該有 App.tsx 404 錯誤
   - React 應該正常載入

3. **檢查 Service Worker**
   - Application > Service Workers
   - 確認 Service Worker 已更新或已取消註冊

## 📝 技術說明

### 緩存控制頭的作用

1. **Cache-Control: no-cache, no-store, must-revalidate**
   - `no-cache`: 每次請求都必須向服務器驗證
   - `no-store`: 不存儲任何緩存
   - `must-revalidate`: 緩存過期後必須重新驗證

2. **Pragma: no-cache**
   - HTTP/1.0 兼容性頭
   - 告訴舊的代理服務器不要緩存

3. **Expires: 0**
   - 設置過期時間為 0
   - 確保立即過期

### Service Worker 緩存

Service Worker 會緩存 JavaScript 文件，即使服務器更新了文件，瀏覽器仍可能使用緩存的版本。這就是為什麼需要清除 Service Worker 緩存。

## ✅ 總結

所有代碼修復已完成：
- ✅ 添加了緩存控制頭
- ✅ 確認代碼中已經是 App.js
- ✅ CSP 配置完整且正確

**下一步**: 
1. 清除 Service Worker 緩存
2. 清除瀏覽器緩存
3. 硬刷新頁面 (Ctrl+Shift+R)
4. 驗證所有錯誤是否消失

---

**重要提示**: 如果問題仍然存在，請檢查 Network 標籤中的 Response Headers，確認 CSP 和緩存控制頭是否正確應用。

