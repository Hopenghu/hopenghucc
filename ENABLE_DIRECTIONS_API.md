# 🗺️ 啟用 Google Directions API 指南

> **目的**: 啟用路線規劃功能  
> **預估時間**: 15-30 分鐘  
> **優先級**: P0

---

## 📋 概述

TripPlanner 的路線規劃功能需要 Google Directions API。如果未啟用，會看到以下錯誤：

```
This API key is not authorized to use this service or API
```

---

## 🚀 啟用步驟

### 步驟 1: 登入 Google Cloud Console

1. 前往: https://console.cloud.google.com/
2. 選擇你的專案（或創建新專案）

### 步驟 2: 啟用 Directions API

1. 在左側選單中，點擊「**APIs & Services**」→「**Library**」
2. 在搜尋框中輸入「**Directions API**」
3. 點擊「**Directions API**」結果
4. 點擊「**Enable**」按鈕
5. 等待幾秒鐘讓 API 啟用完成

### 步驟 3: 確認 API Key 權限

1. 前往「**APIs & Services**」→「**Credentials**」
2. 找到你的 Google Maps API Key
3. 點擊 API Key 名稱進入詳情頁面
4. 在「**API restrictions**」區域：
   - 選擇「**Restrict key**」
   - 在「**Select APIs**」中，確保以下 API 已勾選：
     - ✅ **Maps JavaScript API**（地圖顯示）
     - ✅ **Places API**（地點搜尋）
     - ✅ **Directions API**（路線規劃）← **新增這個**
     - ✅ **Geocoding API**（地址轉換，如果使用）
5. 點擊「**Save**」

### 步驟 4: 驗證啟用

在瀏覽器控制台或 Worker 日誌中，應該不再看到 Directions API 授權錯誤。

---

## 🔍 驗證方法

### 方法 1: 在 Google Cloud Console 檢查

1. 前往「**APIs & Services**」→「**Enabled APIs**」
2. 確認「**Directions API**」在列表中
3. 狀態應顯示為「**Enabled**」

### 方法 2: 測試路線規劃功能

1. 訪問: https://www.hopenghu.cc/trip-planner
2. 添加至少 2 個地點到行程
3. 點擊「計算路線」或類似按鈕
4. 應該能看到路線在地圖上顯示，而不是錯誤訊息

### 方法 3: 檢查 API 使用量

1. 前往「**APIs & Services**」→「**Dashboard**」
2. 查看「**Directions API**」的使用量圖表
3. 如果有請求記錄，表示 API 已啟用並在使用

---

## 💰 費用說明

### Directions API 定價

- **每 1000 次請求**: 約 $5 USD
- **免費額度**: 每月 $200 USD 免費額度（約 40,000 次請求）

### 節省成本建議

1. **啟用快取**: 相同路線的請求會被快取
2. **限制使用**: 只對已登入用戶啟用路線規劃
3. **監控使用量**: 定期檢查 API 使用量

---

## 🔧 故障排除

### 問題：啟用後仍看到錯誤

**解決方案**：
1. 等待 5-10 分鐘讓更改生效
2. 確認 API Key 的「API restrictions」包含 Directions API
3. 檢查 API Key 是否正確設置在 Cloudflare Workers Secrets 中
4. 重新部署 Worker：`npm run build && npx wrangler deploy`

### 問題：找不到 Directions API

**解決方案**：
1. 確認專案已啟用計費（某些 API 需要）
2. 檢查專案權限
3. 嘗試搜尋「Google Maps Directions API」

### 問題：API 使用量異常

**解決方案**：
1. 檢查是否有異常請求
2. 設置使用量限制
3. 啟用 API Key 限制（只允許特定 IP 或域名）

---

## 📚 相關資源

- [Google Directions API 文檔](https://developers.google.com/maps/documentation/directions)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 定價](https://developers.google.com/maps/billing-and-pricing/pricing)

---

## ✅ 完成檢查清單

- [ ] Directions API 已在 Google Cloud Console 啟用
- [ ] API Key 的「API restrictions」包含 Directions API
- [ ] 等待 5-10 分鐘讓更改生效
- [ ] 測試路線規劃功能正常運作
- [ ] 沒有看到授權錯誤訊息

---

**下一步**: 測試載入行程功能（見 `TRIP_PLANNER_ANALYSIS.md`）

