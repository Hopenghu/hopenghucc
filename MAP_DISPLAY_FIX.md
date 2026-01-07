# 地圖顯示問題修復報告

## 問題描述

在 Chrome 瀏覽器中訪問 `https://www.hopenghu.cc/trip-planner` 時，地圖沒有顯示出來。

控制台警告：
```
installHook.js:1 Google Maps JavaScript API has been loaded directly without loading=async. This can result in suboptimal performance. For best-practice loading patterns please see https://goo.gle/js-api-loading
```

## 問題分析

1. **非標準參數問題**：代碼中使用了 `loading=async` 參數，但這不是 Google Maps JavaScript API 的標準參數
2. **地圖容器高度問題**：地圖容器可能在某些情況下沒有明確的高度
3. **地圖初始化時機問題**：地圖可能在容器尺寸確定之前就初始化了

## 修復方案

### 1. 移除非標準參數 ✅

**修改前**：
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.mapsApiKey + '&libraries=places&loading=async';
```

**修改後**：
```javascript
// 使用標準加載方式，移除 loading=async 參數（非標準參數）
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.mapsApiKey + '&libraries=places';
```

### 2. 添加地圖容器高度檢查 ✅

在地圖初始化時檢查容器高度，如果為 0 則設置明確的高度：

```javascript
// 確保地圖容器有明確的高度
if (mapDiv.offsetHeight === 0) {
    console.warn('Map container has zero height, setting explicit height');
    mapDiv.style.height = '100%';
    mapDiv.style.minHeight = '400px';
}
```

### 3. 改進地圖初始化配置 ✅

添加更多地圖選項以確保正確顯示：

```javascript
this.map = new google.maps.Map(mapDiv, {
    center: initialCenter,
    zoom: 12,
    mapTypeControl: false,
    clickableIcons: true,
    fullscreenControl: false,
    streetViewControl: false
});
```

### 4. 添加窗口 resize 監聽器 ✅

確保窗口大小改變時地圖能正確調整：

```javascript
// 額外觸發一次 resize 以確保地圖正確顯示
window.addEventListener('resize', () => {
    if (this.map && google && google.maps) {
        google.maps.event.trigger(this.map, 'resize');
    }
});
```

## 部署信息

- **部署版本**: `8885bda1-e217-4e27-940b-24ca13be82ce`
- **部署時間**: 2026-01-06
- **提交**: `268f420 fix: 修復地圖不顯示問題`

## 測試建議

1. **清除瀏覽器緩存**：確保載入最新的代碼
2. **檢查控制台**：確認沒有錯誤信息
3. **檢查地圖顯示**：確認地圖正常顯示
4. **測試地圖交互**：點擊地圖上的 POI，確認功能正常

## 相關資源

- [Google Maps JavaScript API 文檔](https://developers.google.com/maps/documentation/javascript)
- [Google Maps API 加載最佳實踐](https://goo.gle/js-api-loading)

## 注意事項

1. `loading=async` 不是 Google Maps API 的標準參數，應該移除
2. 地圖容器必須有明確的高度才能正確顯示
3. 使用 `async` 和 `defer` 屬性已經足夠實現異步加載

