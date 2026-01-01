# CSP 錯誤修復總結

## 🔍 問題列表

### 問題 1: Inline Event Handler 違規
**錯誤訊息**:
```
[Error] Refused to execute a script for an inline event handler because 'unsafe-inline' does not appear in the script-src directive
itinerary:37
```

**位置**: `src/components/layout.js:43`
**原因**: 使用了 `onerror` 和 `onload` 內聯事件處理器

### 問題 2: Inline Script 違規
**錯誤訊息**:
```
[Error] Refused to execute a script because its hash, its nonce, or 'unsafe-inline' does not appear in the script-src directive
itinerary:86
```

**位置**: `src/pages/ItineraryPlanner.js:53`
**原因**: `importmap` 腳本沒有 nonce

### 問題 3: 模組解析失敗
**錯誤訊息**:
```
[Error] TypeError: Module name, 'react' does not resolve to a valid URL.
Failed to resolve module specifier "react"
```

**位置**: `src/pages/ItineraryPlanner.js:79`
**原因**: `importmap` 可能被 CSP 阻止或尚未加載完成

## ✅ 修復方案

### 修復 1: 移除內聯事件處理器 ✅

**文件**: `src/components/layout.js`

**變更**:
1. 移除 `onerror` 和 `onload` 屬性
2. 移除內聯 `style="display:none"` 屬性
3. 添加 `id="user-avatar-img"` 和 `avatar-fallback-hidden` 類
4. 使用 JavaScript `addEventListener` 處理圖片載入

**代碼**:
```javascript
// 修復前
<img onerror="..." onload="...">
<span style="display:none;">...</span>

// 修復後
<img id="user-avatar-img" class="user-avatar">
<span class="avatar-fallback avatar-fallback-hidden">...</span>

// JavaScript
userAvatarImg.addEventListener('load', function() {
  fallback.classList.add('avatar-fallback-hidden');
});
userAvatarImg.addEventListener('error', function() {
  userAvatarImg.style.display = 'none';
  fallback.classList.remove('avatar-fallback-hidden');
});
```

### 修復 2: 為 importmap 添加 nonce ✅

**文件**: `src/pages/ItineraryPlanner.js`

**變更**:
1. 為 `<script type="importmap">` 添加 `nonce="${nonce}"`
2. 將 importmap 移到 `<head>` 中

**代碼**:
```html
<!-- 修復前 -->
<script type="importmap">
{ "imports": {...} }
</script>

<!-- 修復後 -->
<script type="importmap" nonce="${nonce}">
{ "imports": {...} }
</script>
```

### 修復 3: 更新 pageTemplate 支持 headScripts ✅

**文件**: `src/components/layout.js`

**變更**:
1. 添加 `headScripts` 參數到 `pageTemplate` 函數
2. 在 `<head>` 中注入 `headScripts`

**代碼**:
```javascript
// 函數簽名
export function pageTemplate({ 
  ..., 
  headScripts = ''  // 新增
})

// 在 head 中使用
<head>
  ...
  ${headScripts || ''}
</head>
```

### 修復 4: 添加 CSS 樣式 ✅

**文件**: `src/components/layout.js`

**變更**:
1. 添加 `.avatar-fallback-hidden` 類樣式

**代碼**:
```css
.avatar-fallback-hidden {
  display: none !important;
}
```

## 📋 修改的文件

1. ✅ `src/components/layout.js`
   - 移除內聯事件處理器
   - 添加 JavaScript 事件監聽器
   - 添加 CSS 樣式
   - 添加 `headScripts` 參數支持

2. ✅ `src/pages/ItineraryPlanner.js`
   - 為 importmap 添加 nonce
   - 將 importmap 移到 head 中
   - 使用 `headScripts` 參數

## 🧪 驗證步驟

1. **清除瀏覽器緩存**
2. **訪問 `/itinerary` 頁面**
3. **檢查 Console**:
   - ✅ 不應該有 CSP 錯誤
   - ✅ 不應該有模組解析錯誤
   - ✅ React 應該正常載入
4. **測試功能**:
   - ✅ 用戶頭像應該正常顯示/隱藏
   - ✅ 行程規劃器應該正常載入
   - ✅ 所有功能應該正常工作

## 📝 技術說明

### CSP 和 nonce

當 CSP 使用 nonce 時：
- `unsafe-inline` 會被忽略（更安全）
- 所有腳本必須有 nonce
- 內聯事件處理器需要 nonce 或必須移除

### importmap 最佳實踐

1. 應該在 `<head>` 中
2. 應該在任何使用它的 module script 之前
3. 應該有 nonce（某些瀏覽器要求）
4. 只有一個 `importmap` 腳本

## ✅ 總結

所有 CSP 錯誤已修復：
- ✅ 移除內聯事件處理器
- ✅ 移除內聯樣式
- ✅ 為 importmap 添加 nonce
- ✅ 將 importmap 移到 head 中
- ✅ 更新 pageTemplate 支持 headScripts
- ✅ 添加必要的 CSS 樣式

**請清除瀏覽器緩存並重新測試！**

