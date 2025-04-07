# Hopenghu CC - 社區中心管理系統

這是一個基於 React 的社區中心管理系統，提供活動管理、會員管理等功能。

## 功能特點

- 用戶認證（Google OAuth 2.0）
- 活動管理
- 會員管理
- 地圖整合（Google Maps）
- 響應式設計

## 技術棧

- React 18
- React Router v6
- Tailwind CSS
- Google Maps API
- Google OAuth 2.0

## 開始使用

### 前置需求

- Node.js (v14.0.0 或更高版本)
- npm 或 yarn

### 安裝

1. 克隆專案
```bash
git clone https://github.com/Hopenghu/hopenghucc.git
cd hopenghucc
```

2. 安裝依賴
```bash
npm install
# 或
yarn install
```

3. 設置環境變數
創建 `.env` 文件並添加以下內容：
```
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

4. 啟動開發服務器
```bash
npm start
# 或
yarn start
```

## 專案結構

```
src/
  ├── components/     # 可重用組件
  ├── pages/         # 頁面組件
  ├── styles/        # 樣式文件
  └── utils/         # 工具函數
```

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件