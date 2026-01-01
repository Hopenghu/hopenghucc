# HOPENHU Project Development Guide 🚀

此文件旨在為開發者（與 AI 助手 Cursor）提供專案架構概覽、開發規範與最新狀態報告，以確保共同開發之順暢。

---

## 🏗 專案架構 (Architecture)

本專案採用 **Cloudflare Workers** 為基礎的 Server-Side Rendering (SSR) 架構。

*   **核心技術**：JavaScript (ES Modules), Cloudflare Workers, Hono (路由靈感), Tailwind CSS.
*   **渲染模式**：主要為 SSR (Server-Side Rendering)，HTML 字串拼接。部分互動邏輯透過 Client-side JavaScript (`<script>` 標籤) 實現。
*   **數據存儲**：Cloudflare D1 (SQL), Cloudflare R2 (圖片存儲).

### 核心目錄結構
```
src/
├── api/            # API 端點處理 (JSON response)
├── components/     # 可重用的 UI 組件 (e.g., layout.js, CommentsComponent.js)
├── pages/          # 頁面渲染邏輯 (HTML response)
├── routes/         # 路由定義 (index.js 為核心入口)
├── services/       # 業務邏輯層 (數據庫操作、第三方 API 封裝)
└── worker.js       # Cloudflare Worker 入口點
```

---

## 🔄 最新重大變更 (Recent Major Refactors) [2025-12]

為提升使用者體驗與代碼維護性，近期進行了以下重構：

### 1. 全局通知系統 (Toast System)
*   **狀態**：✅ 已實作
*   **位置**：`src/components/layout.js`
*   **用法**：
    已在全站注入 `window.showToast(message, type)`。
    ```javascript
    // 在 Client-side 腳本中呼叫
    window.showToast('操作成功！', 'success'); // type: success, error, warning, info
    ```
*   **規範**：**嚴禁使用 `alert()`**。所有使用者操作反饋必須使用 `showToast`。

### 2. 錯誤邊界 (Error Boundary)
*   **狀態**：✅ 已實作
*   **位置**：`src/pages/ErrorPage.js`
*   **機制**：
    `src/routes/index.js` 包裹了全域 `try-catch`。當 SSR 渲染發生未捕獲錯誤時，會自動渲染此友善錯誤頁面（包含 "Retry" 與 "Home" 按鈕）。

### 3. 遊戲頁面整合 (Unified Game Page)
*   **狀態**：✅ 已完成
*   **位置**：`src/pages/GamePage.js`
*   **說明**：
    舊有的多個分散遊戲頁面 (`PlayableGamePage`, `PenghuGamePage`, `GamePageSimple`...) 已被**刪除**。
    現在 `/game` 路由唯一指向 `src/pages/GamePage.js`。此頁面整合了「記憶膠囊」、「探索」、「排行榜」與「角色系統」。

---

## 📝 開發規範 (Conventions)

### 1. 路由 (Routing)
*   所有路由應在 `src/routes/index.js` 中定義。
*   **頁面路由** (`/page-name`) 回傳 HTML Response。
*   **API 路由** (`/api/resource`) 回傳 JSON Response。

### 2. 頁面開發 (Page Development)
*   使用 `src/components/layout.js` 中的 `pageTemplate` 包裹內容。
*   HTML 內容以 Template Literal (反引號字串) 建構。
*   Client-side 互動邏輯請寫在 `<script nonce="${nonce}">` 區塊中。
*   **注意**：避免在 Template String 中嵌套 Template String 時發生語法錯誤（需適當使用 String Concatenation）。

### 3. 樣式 (Styling)
*   全面使用 **Tailwind CSS** Utility Classes。
*   不引入額外的 CSS 檔案，維持 Zero-Runtime CSS overhead。

### 4. 待辦事項 (Pending)
*   **商家驗證邏輯** (`BusinessVerificationService.js`) 目前僅為 Placeholder，需實作與 Google Maps API 的真正串接。
*   **密碼處理** (`utils/password.js`) 需確認安全性最佳實踐。

---

## 🤝 給 Cursor 的指令 (Instructions for AI)

當你開始新的任務時，請優先參考此文件：
1.  **檢查**：該修改是否涉及上述的核心組件（如 Layout, Router）？
2.  **搜尋**：修改是否重複了現有功能（如 Toast）？確認是否有名稱衝突？
3.  **驗證**：修改完路由後，務必檢查 `routes/index.js` 的 Import 路徑是否正確。

*Happy Coding!* 🐧
