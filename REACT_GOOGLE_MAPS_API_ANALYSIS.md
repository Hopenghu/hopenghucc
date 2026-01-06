# @react-google-maps/api 使用情況分析報告

**執行時間**: 2025-01-XX  
**專案**: hopenghucc

---

## 1. 搜尋結果

### 1.1 @react-google-maps/api 套件使用情況

**搜尋關鍵字:**
- `from '@react-google-maps/api'`
- `from "@react-google-maps/api"`
- `GoogleMap`
- `LoadScript`
- `useJsApiLoader`
- `useLoadScript`
- `Marker` (React 組件)
- `InfoWindow` (React 組件)
- `Autocomplete` (React 組件)
- `DirectionsRenderer` (React 組件)

**結果:** ❌ **未找到任何使用**

---

## 2. 專案中的地圖實現方式

### 2.1 直接使用 Google Maps JavaScript API

專案**完全使用直接載入 Google Maps JavaScript API** 的方式，而非 React 封裝套件。

**搜尋關鍵字:**
- `maps.googleapis.com` - 找到 29 處使用
- `google.maps` - 找到 62 處使用
- `new google.maps.Map` - 找到多處使用
- `initMap` - 找到多處使用

---

## 3. 使用 Google Maps 的檔案分析

| 檔案 | 使用的組件/API | 檔案是否被 import | 使用位置 | 建議 |
|------|---------------|------------------|---------|------|
| `src/pages/TripPlanner.js` | `google.maps.Map`, `google.maps.Marker`, `google.maps.DirectionsService`, `google.maps.DirectionsRenderer`, `google.maps.places` | ✅ 是 | `src/routes/index.js` (第 23 行) | ✅ 正在使用 |
| `src/templates/html.js` | `google.maps.places.Autocomplete`, `google.maps.Marker` | ✅ 是 | `src/worker.js` (第 24 行) | ✅ 正在使用 |
| `src/pages/AIChatPage.js` | `google.maps.Marker`, `google.maps.places.Autocomplete` | ✅ 是 | `src/routes/index.js` (第 4 行) | ✅ 正在使用 |
| `ai-smart-itinerary-planner/components/MapView.tsx` | `google.maps.importLibrary("maps")`, `Map`, `InfoWindow` | ✅ 是 | `ai-smart-itinerary-planner/App.tsx` (第 25 行) | ✅ 正在使用 |

---

## 4. 詳細使用情況

### 4.1 src/pages/TripPlanner.js

**使用的 Google Maps API:**
- `google.maps.Map` - 建立地圖實例
- `google.maps.Marker` - 地圖標記
- `google.maps.DirectionsService` - 路線服務
- `google.maps.DirectionsRenderer` - 路線渲染
- `google.maps.places` - Places API（POI 點擊）

**載入方式:**
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.mapsApiKey + '&libraries=places&loading=async';
```

**被使用位置:**
- `src/routes/index.js` - `/trip-planner` 路由

---

### 4.2 src/templates/html.js

**使用的 Google Maps API:**
- `google.maps.places.Autocomplete` - 地點自動完成
- `google.maps.Marker` - 地圖標記

**載入方式:**
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + mapsApiKey + '&libraries=places,places.element&loading=async';
```

**被使用位置:**
- `src/worker.js` - `/add-place` 路由

---

### 4.3 src/pages/AIChatPage.js

**使用的 Google Maps API:**
- `google.maps.Marker` - 地圖標記
- `google.maps.places.Autocomplete` - 地點自動完成

**載入方式:**
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=...&libraries=places&loading=async&callback=initChatMapCallback';
```

**被使用位置:**
- `src/routes/index.js` - `/ai-chat` 路由

---

### 4.4 ai-smart-itinerary-planner/components/MapView.tsx

**使用的 Google Maps API:**
- `google.maps.importLibrary("maps")` - 動態載入地圖庫
- `Map` - 地圖類別
- `InfoWindow` - 資訊視窗

**載入方式:**
```typescript
const { Map, InfoWindow } = await (window as any).google.maps.importLibrary("maps");
```

**被使用位置:**
- `ai-smart-itinerary-planner/App.tsx` - 舊版行程規劃器（已隱藏）

---

## 5. 結論與建議

### 5.1 @react-google-maps/api 使用情況

**結論:** ❌ **完全未使用**

- 專案中沒有任何檔案 import 或使用 `@react-google-maps/api`
- 所有地圖功能都直接使用 Google Maps JavaScript API

### 5.2 建議操作

**立即執行:**
```bash
npm uninstall @react-google-maps/api
```

**理由:**
1. ✅ 完全未使用，移除不會影響功能
2. ✅ 減少套件依賴，降低維護成本
3. ✅ 減少 bundle 大小（雖然是 external，但仍會佔用 node_modules 空間）

### 5.3 專案地圖架構總結

**當前架構:**
- ✅ 直接使用 Google Maps JavaScript API
- ✅ 動態載入 API（`loading=async`）
- ✅ 使用 `google.maps.importLibrary()` 動態載入庫（新式方法）
- ✅ 使用傳統 `<script>` 標籤載入（舊式方法，用於兼容性）

**優點:**
- 不依賴 React 封裝套件，更靈活
- 直接使用官方 API，功能完整
- 減少額外的抽象層

**注意事項:**
- 需要手動管理 API 載入狀態
- 需要手動處理錯誤和回退
- 代碼中混合使用新舊 API（`importLibrary` vs `<script>` 標籤）

---

## 6. 移除後的影響

### 6.1 不會影響的功能

- ✅ `/trip-planner` 頁面
- ✅ `/add-place` 頁面
- ✅ `/ai-chat` 頁面
- ✅ 所有地圖相關功能

### 6.2 需要確認的事項

- ⚠️ 檢查 `package.json` 中是否有其他套件依賴 `@react-google-maps/api`
- ⚠️ 確認沒有遺漏的檔案（已全面搜尋，應該沒有）

---

## 7. 執行建議

### 步驟 1: 移除套件
```bash
npm uninstall @react-google-maps/api
```

### 步驟 2: 驗證構建
```bash
npm run build
```

### 步驟 3: 測試功能
- 測試 `/trip-planner` 頁面地圖功能
- 測試 `/add-place` 頁面地圖功能
- 測試 `/ai-chat` 頁面地圖功能

---

**報告結束**

