# CSP Inline 違規修復

## 🔍 問題分析

### 錯誤訊息
當 CSP 中有 nonce 時，`unsafe-inline` 會被忽略。這導致：
1. **Inline styles** (`style="..."`) 被阻擋
2. **Inline event handlers** (`onclick="..."`, `onkeydown="..."`, `oninput="..."`) 被阻擋
3. **Inline scripts** 如果沒有 nonce 會被阻擋

### 具體違規
- `ai-chat:14` - Inline style: `style="max-height: calc(100vh - 180px);"`
- `ai-chat:67` - Inline style: `style="min-height: 48px; max-height: 200px;"`
- `ai-chat:104` - Inline event handler: `onkeydown="handleAIChatKeyDown(event)"`
- `ai-chat:124` - Inline event handler: `oninput="autoResizeTextarea(this)"`
- `ai-chat:292` - Inline event handler: `onclick="sendAIMessage()"`

## ✅ 已完成的修復

### 1. 移除 Inline Styles

**修復前：**
```html
<div style="max-height: calc(100vh - 180px);">
<textarea style="min-height: 48px; max-height: 200px;">
```

**修復後：**
```html
<div class="ai-chat-messages-container">
<textarea class="ai-chat-textarea">
```

**樣式移到 `<style nonce="...">` 標籤：**
```html
<style nonce="${nonce}">
  .ai-chat-messages-container {
    max-height: calc(100vh - 180px);
  }
  .ai-chat-textarea {
    min-height: 48px;
    max-height: 200px;
  }
</style>
```

### 2. 移除 Inline Event Handlers

**修復前：**
```html
<textarea 
  onkeydown="handleAIChatKeyDown(event)"
  oninput="autoResizeTextarea(this)"
></textarea>
<button onclick="sendAIMessage()"></button>
```

**修復後：**
```html
<textarea id="ai-chat-input"></textarea>
<button id="ai-send-button"></button>
```

**使用 `addEventListener`：**
```javascript
function initializeAIChat() {
  const input = document.getElementById('ai-chat-input');
  const sendButton = document.getElementById('ai-send-button');
  
  if (input) {
    input.addEventListener('input', function() {
      autoResizeTextarea(this);
    });
    input.addEventListener('keydown', function(event) {
      handleAIChatKeyDown(event);
    });
  }
  
  if (sendButton) {
    sendButton.addEventListener('click', function() {
      sendAIMessage();
    });
  }
}
```

### 3. 確保 Script 標籤有 Nonce

所有 `<script>` 標籤都已經有 `nonce="${nonce}"`，這是正確的。

## 📋 修復清單

- [x] 移除 `style="max-height: calc(100vh - 180px);"` → 使用 CSS class
- [x] 移除 `style="min-height: 48px; max-height: 200px;"` → 使用 CSS class
- [x] 移除 `onkeydown="handleAIChatKeyDown(event)"` → 使用 `addEventListener`
- [x] 移除 `oninput="autoResizeTextarea(this)"` → 使用 `addEventListener`
- [x] 移除 `onclick="sendAIMessage()"` → 使用 `addEventListener`
- [x] 將樣式移到 `<style nonce="...">` 標籤中
- [x] 確保所有 `<script>` 標籤有 nonce

## 🧪 測試方法

### 測試 1：檢查 CSP 錯誤

1. 清除瀏覽器快取
2. 重新載入 `/ai-chat` 頁面
3. 打開開發者工具 > Console
4. **應該沒有 CSP 違規錯誤**

### 測試 2：測試功能

1. **測試輸入框：**
   - 輸入文字，確認 textarea 自動調整高度
   - 按 Enter，確認發送訊息
   - 按 Shift+Enter，確認換行

2. **測試發送按鈕：**
   - 點擊發送按鈕，確認發送訊息
   - 確認按鈕在輸入為空時禁用

3. **測試 AI 回應：**
   - 發送測試查詢
   - 確認 AI 回應正常顯示

## ⚠️ 如果仍有問題

### 問題 1：功能不運作

**可能原因：**
- JavaScript 事件監聽器沒有正確設置
- DOM 元素還沒有載入完成

**檢查：**
- 打開開發者工具 > Console
- 檢查是否有 JavaScript 錯誤
- 確認 `initializeAIChat()` 是否被呼叫

### 問題 2：樣式不正確

**可能原因：**
- CSS class 沒有正確應用
- 樣式被其他 CSS 覆蓋

**檢查：**
- 打開開發者工具 > Elements
- 檢查元素是否有正確的 class
- 檢查 `<style nonce="...">` 標籤是否存在

## 📝 技術說明

### 為什麼 nonce 會忽略 unsafe-inline？

這是 CSP 的安全機制：
- **nonce** 提供更嚴格的安全控制
- 當使用 nonce 時，瀏覽器會忽略 `unsafe-inline`
- 這確保只有帶有正確 nonce 的內容才能執行

### 最佳實踐

1. **使用 nonce**：提供更好的安全性
2. **避免 inline styles**：移到 `<style>` 標籤或外部 CSS
3. **避免 inline event handlers**：使用 `addEventListener`
4. **確保所有 scripts 有 nonce**：防止未授權的腳本執行

## ✅ 總結

- ✅ 已移除所有 inline styles
- ✅ 已移除所有 inline event handlers
- ✅ 已將樣式移到 `<style nonce="...">` 標籤
- ✅ 已使用 `addEventListener` 設置事件監聽器
- ✅ 已確保所有 scripts 有 nonce
- ✅ 已部署到生產環境

**請清除瀏覽器快取並重新測試，CSP 錯誤應該已解決！**
