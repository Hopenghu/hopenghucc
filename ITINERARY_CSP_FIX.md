# Itinerary 頁面 CSP 錯誤修復

## 🔍 問題分析

### 錯誤 1: Inline Event Handler 違規
```
[Error] Refused to execute a script for an inline event handler because 'unsafe-inline' does not appear in the script-src directive
itinerary:37
```

**原因**:
- `layout.js` 第 43 行有內聯事件處理器：`onerror` 和 `onload`
- 當 CSP 使用 nonce 時，`unsafe-inline` 會被忽略
- 內聯事件處理器需要 nonce 或必須移除

### 錯誤 2: Inline Script 違規
```
[Error] Refused to execute a script because its hash, its nonce, or 'unsafe-inline' does not appear in the script-src directive
itinerary:86
```

**原因**:
- `importmap` 腳本沒有 nonce
- 雖然 `importmap` 類型理論上不需要 nonce，但某些瀏覽器可能要求

### 錯誤 3: 模組解析失敗
```
[Error] TypeError: Module name, 'react' does not resolve to a valid URL.
Failed to resolve module specifier "react"
```

**原因**:
- `importmap` 可能被 CSP 阻止
- 或者 `importmap` 在 module script 執行時尚未加載完成

## ✅ 修復方案

### 1. 移除 layout.js 中的內聯事件處理器

**修復前**:
```javascript
<img src="${user.avatar_url}" 
     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
     onload="this.nextElementSibling.style.display='none';">
```

**修復後**:
- 移除 `onerror` 和 `onload`
- 使用 JavaScript 事件監聽器
- 移除內聯 `style` 屬性

### 2. 為 importmap 添加 nonce

**修復前**:
```html
<script type="importmap">
```

**修復後**:
```html
<script type="importmap" nonce="${nonce}">
```

### 3. 確保 importmap 在 module script 之前加載

確保 `importmap` 在 `<head>` 中，module script 在 `</body>` 之前。

## 📋 修復清單

- [x] 修復 layout.js 中的內聯事件處理器
  - 移除 `onerror` 和 `onload` 內聯事件處理器
  - 移除內聯 `style` 屬性
  - 使用 JavaScript `addEventListener` 處理圖片載入和錯誤
  - 添加 CSS 類 `.avatar-fallback-hidden` 來控制顯示

- [x] 為 importmap 添加 nonce
  - 在 `<script type="importmap">` 標籤中添加 `nonce="${nonce}"`
  - 將 importmap 移到 `<head>` 中，確保在 module script 之前加載

- [x] 更新 pageTemplate 支持 headScripts
  - 添加 `headScripts` 參數到 `pageTemplate` 函數
  - 允許在 `<head>` 中注入腳本（如 importmap）

- [x] 添加 CSS 樣式支持
  - 添加 `.avatar-fallback-hidden` 類樣式

## ✅ 已完成的修復

### 1. layout.js 修復

**修復前**:
```html
<img src="${user.avatar_url}" 
     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
     onload="this.nextElementSibling.style.display='none';">
<span class="user-avatar avatar-fallback" style="display:none;">...</span>
```

**修復後**:
```html
<img src="${user.avatar_url}" alt="User Avatar" class="user-avatar" id="user-avatar-img">
<span class="user-avatar avatar-fallback avatar-fallback-hidden">...</span>
```

**JavaScript 處理**:
```javascript
const userAvatarImg = document.getElementById('user-avatar-img');
if (userAvatarImg) {
  const fallback = userAvatarImg.nextElementSibling;
  if (fallback && fallback.classList.contains('avatar-fallback')) {
    userAvatarImg.addEventListener('load', function() {
      fallback.classList.add('avatar-fallback-hidden');
    });
    userAvatarImg.addEventListener('error', function() {
      userAvatarImg.style.display = 'none';
      fallback.classList.remove('avatar-fallback-hidden');
    });
  }
}
```

### 2. importmap 修復

**修復前**:
```html
<script type="importmap">
```

**修復後**:
```html
<script type="importmap" nonce="${nonce}">
```

**位置**: 移到 `<head>` 中，在 module script 之前

### 3. pageTemplate 增強

**新增參數**:
```javascript
export function pageTemplate({ 
  title, content, user, nonce, cssContent, 
  useContainer = true, currentPath = '', 
  headScripts = ''  // 新增
})
```

**使用方式**:
```javascript
pageTemplate({
  // ... 其他參數
  headScripts: importMapScript
})
```

## 🧪 測試步驟

1. **清除瀏覽器緩存**
2. **訪問 `/itinerary` 頁面**
3. **檢查 Console**:
   - 不應該有 CSP 錯誤
   - 不應該有模組解析錯誤
   - React 應該正常載入
4. **測試功能**:
   - 用戶頭像應該正常顯示/隱藏
   - 行程規劃器應該正常載入
   - 所有功能應該正常工作

## 📝 技術說明

### 為什麼 nonce 會忽略 unsafe-inline？

這是 CSP 的安全機制：
- **nonce** 提供更嚴格的安全控制
- 當使用 nonce 時，瀏覽器會忽略 `unsafe-inline`
- 這確保只有帶有正確 nonce 的內容才能執行

### importmap 的位置

根據 HTML 規範，`importmap` 應該在：
1. `<head>` 中
2. 在任何使用它的 module script 之前
3. 只有一個 `importmap` 腳本（可以有多個 `<script type="module">`）

### 最佳實踐

1. ✅ **使用 nonce**：提供更好的安全性
2. ✅ **避免 inline styles**：移到 `<style>` 標籤或外部 CSS
3. ✅ **避免 inline event handlers**：使用 `addEventListener`
4. ✅ **確保所有 scripts 有 nonce**：防止未授權的腳本執行
5. ✅ **importmap 在 head 中**：確保模組解析正常

## ✅ 總結

- ✅ 已移除所有內聯事件處理器
- ✅ 已移除所有內聯樣式
- ✅ 已為 importmap 添加 nonce
- ✅ 已將 importmap 移到 head 中
- ✅ 已更新 pageTemplate 支持 headScripts
- ✅ 已添加必要的 CSS 樣式

**請清除瀏覽器緩存並重新測試，CSP 錯誤應該已解決！**

