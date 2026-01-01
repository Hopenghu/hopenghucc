# CSP 錯誤完整診斷與修復

## 🔍 錯誤分析

### 錯誤 1: Inline Event Handler (itinerary:37)
```
Refused to execute a script for an inline event handler because 'unsafe-inline' does not appear in the script-src directive
```

### 錯誤 2: Inline Script (itinerary:86)
```
Refused to execute a script because its hash, its nonce, or 'unsafe-inline' does not appear in the script-src directive
```

### 錯誤 3: 模組解析失敗
```
TypeError: Module name, 'react' does not resolve to a valid URL
Failed to resolve module specifier "react"
```

## 🔧 已完成的修復

### ✅ 修復 1: layout.js 內聯事件處理器
- **位置**: `src/components/layout.js:43`
- **修復**: 移除 `onerror` 和 `onload`，使用 `addEventListener`
- **狀態**: ✅ 已完成

### ✅ 修復 2: importmap nonce
- **位置**: `src/pages/ItineraryPlanner.js:53`
- **修復**: 為 importmap 添加 `nonce="${nonce}"`
- **狀態**: ✅ 已完成

### ✅ 修復 3: importmap 位置
- **位置**: `src/pages/ItineraryPlanner.js`
- **修復**: 將 importmap 移到 `<head>` 中
- **狀態**: ✅ 已完成

## 🚨 可能的原因

### 1. 瀏覽器緩存
**問題**: 瀏覽器可能仍在使用舊的 HTML 版本

**解決方案**:
1. **硬刷新**: `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)
2. **清除緩存**: 瀏覽器設置 > 清除瀏覽數據 > 緩存的圖片和文件
3. **無痕模式**: 使用無痕/隱私模式測試

### 2. Worker 未重新部署
**問題**: 修復後的代碼可能尚未部署到生產環境

**解決方案**:
```bash
npm run build:all
npm run deploy
```

### 3. HTML 行號對應問題
**問題**: 錯誤行號 `itinerary:37` 和 `itinerary:86` 可能對應渲染後的 HTML，而非源代碼

**檢查方法**:
1. 在瀏覽器中：右鍵 > "查看頁面源代碼"
2. 檢查第 37 行和第 86 行的內容
3. 確認是否有內聯事件處理器或無 nonce 的腳本

## 🔍 診斷步驟

### 步驟 1: 檢查源代碼
```bash
# 檢查 layout.js 是否有內聯事件處理器
grep -n "onerror\|onload\|onclick" src/components/layout.js

# 檢查 ItineraryPlanner.js 中 importmap 是否有 nonce
grep -A 5 "importmap" src/pages/ItineraryPlanner.js
```

### 步驟 2: 檢查構建產物
```bash
# 構建項目
npm run build

# 檢查 dist/worker.js 中是否包含修復
grep -n "importmap" dist/worker.js | head -5
```

### 步驟 3: 檢查瀏覽器
1. 打開開發者工具 (F12)
2. 切換到 Network 標籤
3. 勾選 "Disable cache"
4. 重新載入頁面 (Ctrl+Shift+R)
5. 檢查 Console 錯誤

### 步驟 4: 檢查 HTML 源代碼
1. 在瀏覽器中：右鍵 > "查看頁面源代碼"
2. 搜尋 `onerror` 或 `onload`
3. 搜尋 `<script type="importmap">`
4. 確認 importmap 是否有 nonce
5. 確認 importmap 是否在 `<head>` 中

## 🛠️ 額外修復（如果需要）

### 如果錯誤仍然存在，檢查以下項目：

#### 1. 確認所有腳本都有 nonce
```javascript
// 在 layout.js 中
<script nonce="${nonce}">
  // 所有腳本內容
</script>
```

#### 2. 確認 importmap 在 head 中
```html
<head>
  ...
  <script type="importmap" nonce="${nonce}">
    { "imports": {...} }
  </script>
</head>
```

#### 3. 確認 module script 在 importmap 之後
```html
<body>
  ...
  <script type="module" nonce="${nonce}">
    import React from 'react';
    // ...
  </script>
</body>
```

#### 4. 檢查是否有其他內聯事件處理器
搜尋整個項目：
```bash
grep -r "onerror\|onload\|onclick\|onkeydown\|oninput" src/
```

## 📋 驗證清單

- [ ] 已清除瀏覽器緩存
- [ ] 已重新構建項目 (`npm run build`)
- [ ] 已重新部署到生產環境 (`npm run deploy`)
- [ ] 已檢查 HTML 源代碼中沒有內聯事件處理器
- [ ] 已確認 importmap 有 nonce
- [ ] 已確認 importmap 在 `<head>` 中
- [ ] 已確認所有 `<script>` 標籤都有 nonce
- [ ] 已在無痕模式下測試

## 🎯 快速修復命令

```bash
# 1. 清除構建文件
npm run clean

# 2. 重新構建
npm run build:all

# 3. 重新部署
npm run deploy:all

# 4. 檢查代碼
grep -n "onerror\|onload" src/components/layout.js
grep -n "importmap" src/pages/ItineraryPlanner.js
```

## 📝 如果問題仍然存在

1. **提供更多信息**:
   - 瀏覽器類型和版本
   - 完整的 Console 錯誤訊息
   - HTML 源代碼的第 37 行和第 86 行內容

2. **檢查部署狀態**:
   - 確認最新代碼已部署
   - 檢查 Cloudflare Worker 日誌

3. **臨時解決方案**:
   - 如果急需修復，可以暫時移除 CSP 中的 nonce（不推薦，安全性降低）

## ✅ 預期結果

修復後應該：
- ✅ 沒有 CSP 錯誤
- ✅ React 模組正常載入
- ✅ 行程規劃器正常運行
- ✅ 用戶頭像正常顯示

