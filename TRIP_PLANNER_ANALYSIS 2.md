# TripPlanner 行程規劃功能全面分析報告

## 📋 執行摘要

TripPlanner 是網站的核心功能，提供用戶在 Google Maps 上點選地標、建立多日行程、拖拽排序、路線規劃、預訂狀態追蹤和行程分享等功能。目前實現了約 **75%** 的核心功能，採用物件導向架構，程式碼結構清晰。主要問題包括：缺少載入已儲存行程的功能、Directions API 授權問題、以及部分功能需要優化。

---

## 1. TripPlanner.js 檔案分析

### 1.1 基本資訊

| 項目 | 數值 |
|------|------|
| **檔案路徑** | `src/pages/TripPlanner.js` |
| **總行數** | 1,815 行 |
| **主要類別** | `TripPlanner` (物件導向架構) |
| **匯出函數** | `renderTripPlannerPage()`, `renderSharedTripPage()` |

### 1.2 檔案結構

```
TripPlanner.js
├── HTML 結構 (17-79 行)
│   ├── Header Controls (新增天數、天數標籤)
│   ├── Map Container (地圖顯示區域)
│   └── Trip Panel (右側行程面板)
├── CSS 樣式 (81-385 行)
│   ├── Map Container Styles
│   ├── Trip Item Styles
│   ├── Drag and Drop Styles
│   └── Location Detail Panel Styles
└── JavaScript 邏輯 (387-1623 行)
    ├── 全局錯誤處理 (389-421 行)
    ├── TripPlanner 類別 (424-1612 行)
    │   ├── 初始化方法
    │   ├── 地圖相關方法
    │   ├── 地點管理方法
    │   ├── 拖拽排序方法
    │   ├── 路線規劃方法
    │   ├── 儲存/分享方法
    │   └── UI 更新方法
    └── 頁面初始化 (1618-1622 行)
```

### 1.3 使用的外部 API

| API | 用途 | 狀態 |
|-----|------|------|
| **Google Maps JavaScript API** | 地圖顯示、POI 點擊 | ✅ 正常 |
| **Google Places API** | 地點詳情查詢 | ✅ 正常 |
| **Google Directions API** | 路線規劃 | ⚠️ 授權問題（有降級方案） |
| **自定義 API: /api/maps/config** | 獲取 Maps API Key | ✅ 正常 |
| **自定義 API: /api/locations/details-by-placeid/** | 獲取地點詳情 | ✅ 正常 |
| **自定義 API: /api/trip-planner/save** | 儲存行程 | ✅ 正常 |
| **自定義 API: /api/trip-planner/{id}/share** | 分享行程 | ✅ 正常 |

### 1.4 已知問題和 TODO

| 類型 | 位置 | 內容 | 嚴重程度 |
|------|------|------|----------|
| **TODO** | 624 行 | 遷移到 `google.maps.marker.AdvancedMarkerElement` | 🟡 中等 |
| **問題** | 1014-1142 行 | Directions API 可能被拒絕（有降級方案） | 🟡 中等 |
| **缺失** | - | 缺少載入已儲存行程的功能 | 🔴 嚴重 |
| **缺失** | - | 缺少從 URL 參數載入行程的功能 | 🟡 中等 |

### 1.5 程式碼品質評估

#### ✅ 優點

1. **物件導向架構**：使用 `TripPlanner` 類別，結構清晰
2. **錯誤處理完善**：全局錯誤處理器靜默處理第三方腳本錯誤
3. **降級方案**：Directions API 失敗時使用簡單折線
4. **事件委派**：使用 `addEventListener` 和事件委派，避免內聯事件處理器
5. **CSP 兼容**：移除所有 inline styles，使用 CSS 類
6. **響應式設計**：支援行動裝置（768px 斷點）

#### ⚠️ 需要改進的地方

1. **檔案過大**：1,815 行，建議拆分為多個模組
2. **缺少載入功能**：無法載入已儲存的行程
3. **硬編碼值**：部分配置值（如預設時間 '09:00'）硬編碼
4. **缺少單元測試**：沒有測試覆蓋
5. **錯誤訊息**：部分錯誤訊息僅顯示在控制台，用戶看不到

---

## 2. 相關服務和模組

### 2.1 相關檔案清單

| 檔案路徑 | 大小 | 主要功能 | 使用狀態 |
|---------|------|----------|----------|
| `src/pages/TripPlanner.js` | 1,815 行 | 行程規劃頁面主檔案 | ✅ 使用中 |
| `src/api/trip-planner.js` | 683 行 | 行程規劃 API 端點 | ✅ 使用中 |
| `src/api/itinerary.js` | 555 行 | 舊版行程 API（ItineraryService） | ⚠️ 可能未使用 |
| `src/services/ItineraryService.js` | 549 行 | 行程服務（舊版） | ⚠️ 可能未使用 |
| `src/services/LocationService.js` | 1,500+ 行 | 地點服務 | ✅ 使用中 |
| `src/services/agents/TravelPlannerAgent.js` | - | AI 行程規劃代理 | ❓ 未確認 |
| `src/assets/itinerary-assets.js` | - | 行程資源 | ❓ 未確認 |

### 2.2 服務使用分析

#### LocationService
- **用途**：獲取 Google Place 詳情、地點資料庫操作
- **使用位置**：
  - `TripPlanner.js`: 透過 `/api/locations/details-by-placeid/` 間接使用
  - `renderSharedTripPage()`: 直接使用 `LocationService` 獲取地點詳情

#### ItineraryService（舊版）
- **用途**：舊版行程管理（使用 `itineraries` 表）
- **狀態**：可能與新版 `trip-planner` 功能重複
- **建議**：確認是否仍在使用，如未使用可考慮移除

---

## 3. API 端點分析

### 3.1 Trip Planner API (`/api/trip-planner/*`)

| 端點 | 方法 | 功能 | 對應函數 | 狀態 |
|------|------|------|----------|------|
| `/api/trip-planner/save` | POST | 儲存行程 | `handleSaveTrip()` | ✅ 完成 |
| `/api/trip-planner/list` | GET | 獲取用戶所有行程 | `handleGetUserTrips()` | ✅ 完成 |
| `/api/trip-planner/{id}` | GET | 獲取單一行程 | `handleGetTrip()` | ✅ 完成 |
| `/api/trip-planner/{id}` | DELETE | 刪除行程 | `handleDeleteTrip()` | ✅ 完成 |
| `/api/trip-planner/{id}/share` | POST | 生成分享連結 | `handleShareTrip()` | ✅ 完成 |
| `/api/trip-planner/{id}/share` | DELETE | 取消分享 | `handleUnshareTrip()` | ✅ 完成 |
| `/api/trip-planner/shared/{token}` | GET | 獲取公開分享的行程 | `handleGetSharedTrip()` | ✅ 完成 |
| `/api/trip-planner/item/{id}/booking-status` | PUT | 更新預訂狀態 | `handleUpdateBookingStatus()` | ✅ 完成 |
| `/api/trip-planner/item/{id}/booking-info` | PUT | 更新預訂資訊 | `handleUpdateBookingInfo()` | ✅ 完成 |

### 3.2 Itinerary API (`/api/itinerary/*`) - 舊版

| 端點 | 方法 | 功能 | 狀態 |
|------|------|------|------|
| `/api/itinerary` | GET | 獲取用戶所有行程 | ⚠️ 可能未使用 |
| `/api/itinerary` | POST | 建立新行程 | ⚠️ 可能未使用 |
| `/api/itinerary/{id}` | GET | 獲取單一行程 | ⚠️ 可能未使用 |
| `/api/itinerary/{id}` | PUT | 更新行程 | ⚠️ 可能未使用 |
| `/api/itinerary/{id}` | DELETE | 刪除行程 | ⚠️ 可能未使用 |
| `/api/itinerary/{id}/optimize` | POST | 優化行程（AI） | ⚠️ 可能未使用 |
| `/api/itinerary/search-places` | POST | 搜尋地點（Gemini） | ⚠️ 可能未使用 |
| `/api/itinerary/optimize-day-plan` | POST | 優化單日行程 | ⚠️ 可能未使用 |

**建議**：確認舊版 Itinerary API 是否仍在使用，如未使用可考慮移除或標記為 deprecated。

### 3.3 其他相關 API

| 端點 | 方法 | 功能 | 狀態 |
|------|------|------|------|
| `/api/maps/config` | GET | 獲取 Google Maps API Key | ✅ 完成 |
| `/api/locations/details-by-placeid/{id}` | GET | 獲取地點詳情 | ✅ 完成 |

---

## 4. 資料模型分析

### 4.1 資料庫表結構

#### `trip_plans` 表（行程主表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | TEXT PRIMARY KEY | 行程 ID |
| `user_id` | TEXT NOT NULL | 用戶 ID（外鍵） |
| `title` | TEXT NOT NULL | 行程標題 |
| `share_token` | TEXT UNIQUE | 分享令牌 |
| `is_public` | INTEGER DEFAULT 0 | 是否公開（0=私密, 1=公開） |
| `created_at` | INTEGER NOT NULL | 建立時間戳 |
| `updated_at` | INTEGER NOT NULL | 更新時間戳 |

#### `trip_plan_items` 表（行程項目表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | TEXT PRIMARY KEY | 項目 ID |
| `trip_id` | TEXT NOT NULL | 行程 ID（外鍵） |
| `day_index` | INTEGER NOT NULL | 天數索引（0, 1, 2...） |
| `place_id` | TEXT NOT NULL | Google Place ID |
| `time` | TEXT | 時間（HH:MM 格式） |
| `order_index` | INTEGER NOT NULL | 順序索引 |
| `booking_status` | TEXT DEFAULT 'planned' | 預訂狀態 |
| `booking_url` | TEXT | 預訂網址 |
| `booking_phone` | TEXT | 預訂電話 |
| `booking_notes` | TEXT | 預訂備註 |
| `created_at` | INTEGER NOT NULL | 建立時間戳 |

**注意**：`place_id` 存儲的是 Google Place ID，不是 `locations` 表的 `id`。

### 4.2 資料流向

```
用戶操作
  ↓
TripPlanner.js (前端)
  ↓
API 端點 (/api/trip-planner/*)
  ↓
資料庫 (trip_plans, trip_plan_items)
  ↓
LocationService (獲取地點詳情)
  ↓
Google Places API
```

---

## 5. 功能狀態評估

| 功能 | 狀態 | 實現位置 | 說明 |
|------|------|----------|------|
| **地圖顯示** | ✅ 完成 | `initializeMap()` (504-566 行) | Google Maps 正常載入和顯示 |
| **地點搜尋（Autocomplete）** | ❌ 未實現 | - | 目前只能點擊地圖上的 POI |
| **添加地點到行程** | ✅ 完成 | `handlePoiClick()` (569-613 行) | 點擊地圖 POI 或標記可添加 |
| **拖拉排序地點** | ✅ 完成 | `handleDragStart/Drop()` (1166-1258 行) | 支援垂直拖拽排序 |
| **路線計算與顯示** | ⚠️ 部分 | `updateRoute()` (1014-1142 行) | Directions API 有授權問題，有降級方案 |
| **多日行程管理** | ✅ 完成 | `addDay()`, `switchDay()` (729-727 行) | 支援新增天數和切換 |
| **儲存行程到資料庫** | ✅ 完成 | `saveTrip()` (1518-1583 行) | 完整實現 |
| **載入已儲存行程** | ❌ 未實現 | - | **缺失功能** |
| **分享行程（公開連結）** | ✅ 完成 | `shareTrip()` (1351-1445 行) | 生成分享連結並複製 |
| **AI 智慧建議** | ❌ 未實現 | - | 舊版 Itinerary API 有，但新版未使用 |
| **預估時間/距離** | ⚠️ 部分 | `updateRoute()` | Directions API 可提供，但目前有授權問題 |
| **行動裝置響應式** | ✅ 完成 | CSS (359-384 行) | 支援行動裝置佈局 |
| **預訂狀態追蹤** | ✅ 完成 | `updateBookingStatus()` (1271-1297 行) | 支援 4 種狀態 |
| **地點詳情顯示** | ✅ 完成 | `showLocationDetail()` (898-993 行) | 點擊地點名稱或標記顯示詳情 |
| **跨天拖拽** | ❌ 未實現 | - | 目前只支援同一天內拖拽 |

### 功能完成度統計

- **已完成**：10 項 (71%)
- **部分完成**：2 項 (14%)
- **未實現**：2 項 (14%)

**整體完成度**：約 **75%**

---

## 6. 問題和改進空間

### 🔴 嚴重問題（影響功能）

1. **缺少載入已儲存行程的功能**
   - **問題**：用戶無法載入之前儲存的行程
   - **影響**：用戶每次都需要重新建立行程
   - **建議**：
     - 在頁面載入時檢查 URL 參數（如 `?tripId=xxx`）
     - 添加「載入行程」按鈕，顯示用戶的所有行程列表
     - 實現 `loadTrip(tripId)` 方法

2. **Directions API 授權問題**
   - **問題**：API 可能未啟用或未授權
   - **影響**：無法顯示完整路線規劃
   - **現狀**：有降級方案（簡單折線）
   - **建議**：在 Google Cloud Console 啟用 Directions API，或改進降級方案的視覺效果

### 🟡 中等問題（影響體驗）

3. **缺少地點搜尋功能**
   - **問題**：只能點擊地圖上的 POI，無法搜尋特定地點
   - **影響**：用戶體驗受限
   - **建議**：添加 Google Places Autocomplete 搜尋框

4. **缺少跨天拖拽功能**
   - **問題**：無法將地點從一天拖拽到另一天
   - **影響**：調整行程時需要手動刪除和重新添加
   - **建議**：實現跨天拖拽，支援拖拽到天數標籤

5. **檔案過大（1,815 行）**
   - **問題**：維護困難，難以測試
   - **建議**：拆分為多個模組：
     - `TripPlannerMap.js` - 地圖相關
     - `TripPlannerPanel.js` - 行程面板
     - `LocationDetailManager.js` - 地點詳情管理
     - `RouteManager.js` - 路線管理

6. **缺少 AI 智慧建議**
   - **問題**：無法提供行程優化建議
   - **影響**：用戶需要手動規劃最佳路線
   - **建議**：整合 Gemini API 提供行程優化建議

### 🟢 優化建議（提升品質）

7. **遷移到 AdvancedMarkerElement**
   - **問題**：使用已棄用的 `google.maps.Marker`
   - **建議**：遷移到 `google.maps.marker.AdvancedMarkerElement`

8. **改進錯誤處理**
   - **問題**：部分錯誤僅顯示在控制台
   - **建議**：添加用戶可見的錯誤提示（Toast 通知）

9. **添加載入狀態指示**
   - **問題**：API 請求時沒有載入指示
   - **建議**：添加載入動畫和進度條

10. **優化路線顯示**
    - **問題**：降級方案的路線視覺效果較差
    - **建議**：改進折線樣式，添加動畫效果

11. **添加單元測試**
    - **問題**：沒有測試覆蓋
    - **建議**：為核心功能添加單元測試

---

## 7. 架構圖

```
TripPlanner.js (前端)
├── TripPlanner 類別
│   ├── 地圖管理
│   │   ├── initMap()
│   │   ├── initializeMap()
│   │   └── addMarker()
│   ├── 地點管理
│   │   ├── handlePoiClick()
│   │   ├── removePlace()
│   │   └── showLocationDetail()
│   ├── 行程管理
│   │   ├── addDay()
│   │   ├── switchDay()
│   │   └── updateTripPanel()
│   ├── 拖拽排序
│   │   ├── handleDragStart()
│   │   ├── handleDrop()
│   │   └── updateMarkerNumbers()
│   ├── 路線規劃
│   │   ├── updateRoute()
│   │   └── drawSimpleRoute() (降級方案)
│   └── 資料持久化
│       ├── saveTrip()
│       └── shareTrip()
│
├── 使用的服務
│   ├── LocationService (透過 API)
│   └── Trip Planner API
│
└── 使用的 API
    ├── Google Maps JavaScript API
    ├── Google Places API
    ├── Google Directions API (可選)
    └── 自定義 API (/api/trip-planner/*)
```

---

## 8. 建議的開發優先順序

### 第一優先（必須修復）

1. **實現載入已儲存行程功能**
   - 添加 `loadTrip(tripId)` 方法
   - 在頁面載入時檢查 URL 參數
   - 添加「我的行程」列表頁面或下拉選單
   - **預估時間**：4-6 小時

2. **修復 Directions API 授權問題**
   - 在 Google Cloud Console 啟用 Directions API
   - 檢查 API Key 限制設定
   - 測試路線規劃功能
   - **預估時間**：1-2 小時

### 第二優先（重要功能）

3. **添加地點搜尋功能**
   - 整合 Google Places Autocomplete
   - 添加搜尋框 UI
   - 實現搜尋結果選擇和添加
   - **預估時間**：3-4 小時

4. **實現跨天拖拽功能**
   - 擴展拖拽邏輯支援跨天
   - 添加視覺反饋（拖拽到天數標籤）
   - 更新資料結構和 API
   - **預估時間**：4-5 小時

5. **拆分大型檔案**
   - 將 `TripPlanner.js` 拆分為多個模組
   - 保持向後兼容
   - **預估時間**：6-8 小時

### 第三優先（優化提升）

6. **添加 AI 智慧建議**
   - 整合 Gemini API
   - 實現行程優化建議
   - 添加「優化行程」按鈕
   - **預估時間**：6-8 小時

7. **改進錯誤處理和用戶體驗**
   - 添加 Toast 通知系統
   - 改進載入狀態指示
   - 優化路線顯示視覺效果
   - **預估時間**：4-6 小時

8. **遷移到 AdvancedMarkerElement**
   - 更新標記實現
   - 測試兼容性
   - **預估時間**：2-3 小時

---

## 9. 下一步行動項目

### 立即執行（本週）

- [ ] **實現載入已儲存行程功能**
  - [ ] 添加 `loadTrip(tripId)` 方法到 `TripPlanner` 類
  - [ ] 在 `initEventListeners()` 中添加載入邏輯
  - [ ] 添加「載入行程」UI（按鈕或下拉選單）
  - [ ] 測試載入功能

- [ ] **修復 Directions API 授權問題**
  - [ ] 檢查 Google Cloud Console 設定
  - [ ] 啟用 Directions API
  - [ ] 測試路線規劃功能

### 短期目標（2-4 週）

- [ ] **添加地點搜尋功能**
- [ ] **實現跨天拖拽功能**
- [ ] **改進錯誤處理和用戶體驗**

### 中期目標（1-2 個月）

- [ ] **拆分大型檔案**
- [ ] **添加 AI 智慧建議**
- [ ] **遷移到 AdvancedMarkerElement**

---

## 10. 技術債務清單

| 項目 | 嚴重程度 | 預估修復時間 | 優先級 |
|------|----------|--------------|--------|
| 缺少載入已儲存行程功能 | 🔴 高 | 4-6 小時 | P0 |
| Directions API 授權問題 | 🔴 高 | 1-2 小時 | P0 |
| 缺少地點搜尋功能 | 🟡 中 | 3-4 小時 | P1 |
| 缺少跨天拖拽功能 | 🟡 中 | 4-5 小時 | P1 |
| 檔案過大（1,815 行） | 🟡 中 | 6-8 小時 | P2 |
| 缺少 AI 智慧建議 | 🟡 中 | 6-8 小時 | P2 |
| 使用已棄用的 Marker API | 🟢 低 | 2-3 小時 | P3 |
| 缺少單元測試 | 🟢 低 | 8-10 小時 | P3 |

---

## 11. 總結

TripPlanner 功能整體完成度約 **75%**，核心功能（地圖顯示、地點添加、拖拽排序、儲存、分享）已實現，但缺少載入已儲存行程的功能，這是目前最嚴重的問題。建議優先修復載入功能和 Directions API 授權問題，然後逐步添加搜尋、跨天拖拽等進階功能。

**預估完成所有優先功能所需時間**：約 **20-30 小時**

---

*報告生成時間：2025-01-23*
*分析範圍：src/pages/TripPlanner.js 及相關檔案*

