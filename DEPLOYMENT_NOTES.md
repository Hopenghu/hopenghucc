# 行程規劃器部署說明

## ✅ 已完成：靜態檔案已整合到 Worker 中

### 建置流程

行程規劃器的靜態檔案已直接整合到 Cloudflare Worker 中，作為網站功能的一部分。

**建置命令**：
```bash
# 只建置行程規劃器
npm run build:itinerary

# 嵌入資產到 Worker
npm run embed:assets

# 建置所有內容（行程規劃器 + 嵌入資產 + Worker）
npm run build:all

# 建置並部署
npm run deploy:all
```

### 技術實現

1. **Vite 建置**：將 TypeScript 檔案建置為 JavaScript
   - 建置產物位於：`static-site/ai-smart-itinerary-planner/`
   - 包含 JS、CSS 等所有資產

2. **資產嵌入**：使用 `scripts/embed-itinerary-assets.js` 將建置產物嵌入到 Worker
   - 生成 `src/assets/itinerary-assets.js` 模組
   - 包含所有靜態檔案內容（約 1.6MB）

3. **Worker 路由**：在 Worker 中提供靜態檔案服務
   - 路由：`/ai-smart-itinerary-planner/*`
   - 自動設定正確的 Content-Type
   - 設定長期緩存標頭

### 檔案結構

```
static-site/ai-smart-itinerary-planner/
├── App.js                    # 應用程式入口點
├── assets/
│   ├── App.jb7t31R_.js      # 應用程式主程式碼 (739KB)
│   ├── main.CPV70D_8.js     # 主要 JavaScript (893KB)
│   └── App.DUuKludz.css     # 樣式檔案 (3.26KB)
└── styles/
    ├── design-tokens.css
    └── responsive.css

src/assets/
└── itinerary-assets.js      # 嵌入的資產模組（自動生成）
```

### 當前狀態

- ✅ Vite 建置配置已完成
- ✅ 建置產物已生成
- ✅ 資產嵌入腳本已建立
- ✅ Worker 路由已設定
- ✅ ItineraryPlanner.js 已更新為使用建置後的檔案
- ✅ 所有靜態檔案已整合到 Worker 中

### 注意事項

- Worker 大小約為 3.1MB（包含所有資產）
- 所有靜態檔案都透過 Worker 提供，無需外部服務
- 檔案會自動設定長期緩存（1年）
- 建置流程已自動化，只需執行 `npm run deploy:all`

