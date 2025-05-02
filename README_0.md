# Hopenghu Cloudflare Workers Baseline (v0) - README

## 🎯 目標與狀態 (Goal & Status)

此專案旨在提供一個基於 Cloudflare Workers 和 D1 的網站後端基礎框架。目前已實現以下核心功能，可作為後續多個網站開發的起點：

*   **Google OAuth 2.0 登入/登出流程：** 完整且模組化。
*   **Session 管理：** 基於 Cookie 和 D1 資料庫的 Session 驗證。
*   **基礎資料庫操作：** 新用戶創建 (INSERT) 和現有用戶查找 (SELECT)。
*   **模組化後端結構：** 主要邏輯已拆分到 `modules` 和 `templates` 目錄。
*   **基礎前端頁面渲染：** Worker 可根據登入狀態渲染不同的簡單 HTML 頁面 (首頁、個人資料頁、登入成功頁)。
*   **基礎樣式：** 透過 Tailwind CSS CDN 實現基本的頁面佈局和樣式。

## 🛠️ 技術棧 (Technology Stack)

*   **Runtime:** Cloudflare Workers
*   **資料庫:** Cloudflare D1 (SQLite)
*   **主要語言:** JavaScript (Node.js modules)
*   **身份驗證:** Google OAuth 2.0
*   **樣式:** Tailwind CSS (via CDN)
*   **開發/部署工具:** Wrangler CLI

## 📂 專案結構 (Project Structure)

```
.
├── init.sql                # D1 資料庫初始化腳本
├── node_modules/           # Node.js 依賴
├── package-lock.json       # 依賴鎖定文件
├── package.json            # 專案依賴與腳本
├── src/                    # 主要原始碼目錄
│   ├── modules/            # 後端邏輯模組
│   │   ├── auth/
│   │   │   ├── google.js   # Google OAuth 處理
│   │   │   └── logout.js   # 登出處理
│   │   └── session/
│   │       └── service.js  # Session 驗證與用戶獲取
│   ├── styles/             # 樣式文件 (Tailwind input/output)
│   │   ├── globals.css     # Tailwind input
│   │   └── tailwind.output.css # Tailwind output (generated)
│   ├── templates/          # HTML 生成模組
│   │   └── html.js         # 包含頁面和組件的 HTML 生成函數
│   └── worker.js           # Cloudflare Worker 入口點 (路由、協調)
├── tailwind.config.js      # Tailwind CSS 配置
└── wrangler.toml           # Cloudflare Wrangler 配置文件 (環境變數、綁定等)
```

## 🚀 設定與運行 (Setup & Running)

**1. 前置需求:**
   *   Node.js 和 npm/pnpm/yarn
   *   安裝 Wrangler CLI: `npm install -g wrangler` (或 `pnpm add -g wrangler` 等)
   *   登入 Wrangler: `wrangler login`

**2. 獲取程式碼:**
   *   `git clone <repository_url>`
   *   `cd <project_directory>`

**3. 安裝依賴:**
   *   `npm install` (或 `pnpm install` / `yarn install`)

**4. 環境變數與 Secrets:**
   *   **Google OAuth Credentials:**
      *   需要從 Google Cloud Console 獲取 Client ID 和 Client Secret。
      *   設置 Wrangler Secrets (用於生產部署):
         ```bash
         wrangler secret put GOOGLE_CLIENT_ID
         # (貼上你的 Client ID)
         wrangler secret put GOOGLE_CLIENT_SECRET
         # (貼上你的 Client Secret)
         ```
   *   **本地開發環境變數 (`.dev.vars`):**
      *   創建一個 `.dev.vars` 文件在專案根目錄。
      *   添加以下內容 (替換為你的實際值):
         ```
         GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
         GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
         # 注意: DB 綁定名稱應與 wrangler.toml 中的 [[d1_databases]] binding 一致
         # 不需要在此處設置 DB 綁定，Wrangler 會自動處理
         ```
      *   **重要:** `.dev.vars` **不應**提交到版本控制 (添加到 `.gitignore`)。

**5. 資料庫設定 (D1):**
   *   確保 `wrangler.toml` 中已配置 D1 資料庫綁定，例如：
     ```toml
     [[d1_databases]]
     binding = "DB" # Worker 中使用的綁定名稱 (env.DB)
     database_name = "hopenghucc_db"
     database_id = "c2b675cd-af9c-4da9-b35c-aa7fb7f35344" # 你的 D1 DB ID
     ```
   *   **初始化/重置資料庫:**
      *   **遠程 (生產):**
         ```bash
         # 警告: 這會清空遠程數據庫!
         wrangler d1 execute hopenghucc_db --remote --file=init.sql
         ```
      *   **本地 (開發):**
         ```bash
         # 警告: 這會清空本地數據庫!
         wrangler d1 execute hopenghucc_db --local --file=init.sql
         ```

**6. 本地開發:**
   *   `npm run dev` (或 `wrangler dev`)
   *   Wrangler 會啟動本地伺服器，並加載 `.dev.vars` 中的環境變數。

**7. 生產部署:**
   *   `npm run deploy` (或 `wrangler deploy`)
   *   Wrangler 會使用設置的 Secrets。

## 🧩 關鍵模組概覽

*   **`worker.js`:** Worker 入口點，處理請求路由，調用 `getUserFromSession` 獲取用戶狀態，並根據路由調用其他模組 (Auth, Templates) 來生成回應。
*   **`modules/auth/google.js`:** 封裝 Google OAuth 流程，包括生成授權 URL、處理回調、交換 Code、獲取用戶資訊、與資料庫交互 (查找/創建用戶) 以及創建 Session。
*   **`modules/auth/logout.js`:** 處理登出請求，刪除資料庫 Session 並清除客戶端 Cookie。
*   **`modules/session/service.js`:** 提供 `getUserFromSession` 函數，用於驗證請求中的 Session Cookie 並從資料庫獲取關聯的用戶數據。
*   **`templates/html.js`:** 包含生成不同頁面 (首頁、個人資料頁等) 的 HTML 字符串的函數，並實現了基於登入狀態的條件渲染邏輯和共享的頁頭/頁尾。

## 🌱 後續步驟與擴展方向 (Next Steps & Extension)

這個基礎框架可以用於：

1.  **完善前端 UI/UX:** 使用 Tailwind CSS 或引入前端框架 (Alpine.js, petite-vue, React, Vue 等) 創建更豐富、更美觀的用戶界面。
2.  **開發核心功能頁面:** 添加如 `/places`, `/events` 等頁面，包括對應的 D1 數據查詢邏輯 (放入新的 `modules`) 和前端渲染模板。
3.  **增強用戶功能:** 添加編輯個人資料、收藏、評論等互動功能。
4.  **進一步重構:** 將數據訪問邏輯 (D1 操作) 從 Auth 模組中提取到專門的 `UserService` 模組，使 Auth 模組更專注於驗證流程本身。
5.  **添加測試:** 為關鍵模組添加單元測試或整合測試。

---

這個 `README_0.md` 文件提供了對當前專案狀態的快照和必要的設置說明。 