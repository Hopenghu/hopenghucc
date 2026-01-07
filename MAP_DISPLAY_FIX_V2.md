# 地圖顯示問題修復報告 V2

## 問題描述

在 Chrome 瀏覽器中訪問 `https://www.hopenghu.cc/trip-planner` 時，地圖仍然沒有顯示出來。

控制台錯誤：
1. `giveFreely.tsx-69ecb326.js:1` - 第三方腳本錯誤（可能是瀏覽器擴展）
2. Google Maps API 加載警告（已處理）

## 問題分析

經過進一步分析，發現主要問題可能是：

1. **地圖容器高度計算不準確**：CSS 中的 `calc(100vh - 128px - 60px)` 可能不適用於所有情況
2. **地圖初始化時機問題**：地圖可能在容器尺寸確定之前就初始化了
3. **缺少調試信息**：無法確定地圖容器的實際尺寸

## 修復方案

### 1. 改進地圖容器 CSS ✅

**修改前**：
```css
.trip-planner-main-area {
    height: calc(100vh - 128px - 60px);
}

#map-container {
    height: 100%;
    min-height: 400px;
}

.trip-planner-map {
    width: 100%;
    height: 100%;
    min-height: 400px;
}
```

**修改後**：
```css
.trip-planner-main-area {
    height: calc(100vh - 128px - 60px);
    min-height: 500px;
}

#map-container {
    height: 100%;
    min-height: 500px;
    position: relative;
}

.trip-planner-map {
    width: 100%;
    height: 100%;
    min-height: 500px;
    background-color: #e5e7eb;
    position: relative;
    display: block;
}
```

### 2. 添加地圖容器尺寸檢查和動態設置 ✅

在地圖初始化時：
- 檢查容器實際尺寸
- 如果高度不足，動態計算並設置合適的高度
- 添加詳細的調試信息

```javascript
// 確保地圖容器有明確的高度
const mapContainer = document.getElementById('map-container');
const containerHeight = mapDiv.offsetHeight || mapDiv.clientHeight;

console.log('Map container dimensions:', {
    mapDiv: {
        offsetHeight: mapDiv.offsetHeight,
        clientHeight: mapDiv.clientHeight,
        offsetWidth: mapDiv.offsetWidth,
        clientWidth: mapDiv.clientWidth
    },
    mapContainer: mapContainer ? {
        offsetHeight: mapContainer.offsetHeight,
        clientHeight: mapContainer.clientHeight
    } : 'not found'
});

if (containerHeight === 0 || containerHeight < 400) {
    console.warn('Map container has insufficient height, setting explicit height');
    const viewportHeight = window.innerHeight;
    const calculatedHeight = Math.max(viewportHeight - 200, 500);
    mapDiv.style.height = calculatedHeight + 'px';
    mapDiv.style.minHeight = '500px';
    if (mapContainer) {
        mapContainer.style.height = calculatedHeight + 'px';
        mapContainer.style.minHeight = '500px';
    }
    console.log('Set map height to:', calculatedHeight);
}
```

### 3. 改進初始化邏輯 ✅

支持 DOM 已載入完成的情況：

```javascript
// 初始化
function initializeTripPlanner() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            tripPlanner = new TripPlanner();
            tripPlanner.initMap();
            tripPlanner.initEventListeners();
            tripPlanner.checkUrlParams();
        });
    } else {
        // DOM 已經載入完成
        tripPlanner = new TripPlanner();
        tripPlanner.initMap();
        tripPlanner.initEventListeners();
        tripPlanner.checkUrlParams();
    }
}

initializeTripPlanner();
```

### 4. 增強 resize 處理 ✅

- 在頁面完全載入後再次觸發 resize
- 確保地圖在各種情況下都能正確調整大小

```javascript
// 在頁面完全載入後再次觸發 resize
if (document.readyState === 'complete') {
    setTimeout(resizeHandler, 500);
} else {
    window.addEventListener('load', () => {
        setTimeout(resizeHandler, 500);
    });
}
```

## 部署信息

- **部署版本**: `bd4b0d1d-ffa4-4a5e-a1cd-2d72aeff22d9`
- **部署時間**: 2026-01-06
- **提交**: `a030e13 fix: 改進地圖容器高度設置和初始化邏輯`

## 測試建議

1. **清除瀏覽器緩存**：確保載入最新的代碼
2. **檢查控制台**：
   - 查看地圖容器尺寸的調試信息
   - 確認沒有錯誤信息
   - 檢查 "Map initialized successfully" 日誌
3. **檢查地圖顯示**：
   - 確認地圖正常顯示
   - 檢查地圖是否響應窗口大小變化
4. **測試地圖交互**：
   - 點擊地圖上的 POI
   - 確認標記正常顯示

## 調試信息

現在地圖初始化時會在控制台輸出詳細的尺寸信息，包括：
- 地圖容器的 offsetHeight 和 clientHeight
- 地圖容器的 offsetWidth 和 clientWidth
- 父容器的尺寸信息
- 如果高度不足，會顯示設置的高度值

## 注意事項

1. **第三方腳本錯誤**：`giveFreely.tsx` 的錯誤可能是瀏覽器擴展或廣告腳本造成的，不影響地圖功能
2. **Google Maps API 警告**：這是 API 內部的警告，不影響功能
3. **地圖容器高度**：現在會動態計算並設置，確保地圖有足夠的顯示空間

## 如果問題仍然存在

如果地圖仍然不顯示，請檢查控制台中的調試信息：
1. 查看 "Map container dimensions" 的輸出
2. 確認地圖容器是否有正確的高度
3. 檢查是否有其他 JavaScript 錯誤阻止了地圖初始化
4. 確認 Google Maps API 是否正確載入

