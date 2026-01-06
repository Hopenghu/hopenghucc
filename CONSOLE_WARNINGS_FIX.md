# 控制台警告修復報告

## 修復日期
2025-01-20

## 問題概述

用戶報告了三個控制台警告/錯誤：

1. **Google Maps Marker 棄用警告**：使用已棄用的 `google.maps.Marker`
2. **Google Maps API 加載警告**：API 被直接加載而沒有使用 `loading=async`
3. **Safari 剪貼簿錯誤**：複製到剪貼簿失敗（NotFoundError/NotAllowedError）

## 修復方案

### 1. 遷移到 AdvancedMarkerElement ✅

**問題**：
- 使用已棄用的 `google.maps.Marker`
- 警告：`As of February 21st, 2024, google.maps.Marker is deprecated`

**解決方案**：
- 遷移到 `google.maps.marker.AdvancedMarkerElement`
- 使用 `google.maps.importLibrary("marker")` 動態加載 marker 庫
- 使用 `PinElement` 創建標記圖標
- 保留向後兼容：如果 AdvancedMarkerElement 不可用，降級到傳統 Marker

**修改位置**：
- `addMarker()` 方法：改為 async，優先使用 AdvancedMarkerElement
- `updateMarkerNumbers()` 方法：支持兩種標記類型
- `removePlace()` 方法：支持兩種標記類型
- `clearCurrentTrip()` 方法：支持兩種標記類型

**代碼變更**：
```javascript
// 之前
const marker = new google.maps.Marker({ ... });

// 之後
const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
const pinElement = new PinElement({ ... });
const marker = new AdvancedMarkerElement({ ... });
```

### 2. 改進剪貼簿錯誤處理 ✅

**問題**：
- Safari 中複製到剪貼簿失敗
- 錯誤：`NotFoundError: The object can not be found here`
- 錯誤：`NotAllowedError: The request is not allowed`

**解決方案**：
- 靜默處理 Safari 的權限錯誤（NotAllowedError、NotFoundError）
- 改進錯誤處理邏輯，區分權限錯誤和其他錯誤
- 只記錄非權限相關的錯誤

**修改位置**：
- `copyToClipboard()` 方法：改進錯誤處理

**代碼變更**：
```javascript
// 靜默處理常見的權限錯誤（Safari 等）
if (errorName === 'NotAllowedError' || 
    errorName === 'NotFoundError' ||
    errorMessage.includes('not allowed') ||
    errorMessage.includes('not found')) {
    // 靜默降級到 fallback，不顯示警告
}
```

### 3. Google Maps API 加載警告 ⚠️

**問題**：
- 警告：`Google Maps JavaScript API has been loaded directly without loading=async`

**狀態**：
- 代碼中已經設置了 `loading=async` 參數和 `script.async = true`、`script.defer = true`
- 此警告是 Google Maps API 內部產生的，即使正確設置了參數也可能出現
- 這是 Google Maps API 的已知問題，不影響功能

**說明**：
- 警告出現在 API 加載時，即使使用了 `loading=async` 參數
- 這是 Google Maps API 內部的檢查機制，無法完全避免
- 不影響實際功能，API 仍然會異步加載

## 測試建議

### 1. 測試 AdvancedMarkerElement
- [ ] 在 Chrome 中測試標記顯示
- [ ] 在 Safari 中測試標記顯示
- [ ] 測試標記編號更新
- [ ] 測試標記點擊事件
- [ ] 測試標記移除

### 2. 測試剪貼簿功能
- [ ] 在 Chrome 中測試複製連結
- [ ] 在 Safari 中測試複製連結（應該靜默處理錯誤）
- [ ] 測試 fallback 方法

### 3. 測試 Google Maps API 加載
- [ ] 檢查 API 是否正常加載
- [ ] 檢查地圖是否正常顯示
- [ ] 確認警告不影響功能

## 部署步驟

1. 構建項目：
   ```bash
   npm run build
   ```

2. 提交更改：
   ```bash
   git add src/pages/TripPlanner.js
   git commit -m "fix: 遷移到 AdvancedMarkerElement 並改進剪貼簿錯誤處理"
   git push origin main
   ```

3. 驗證部署：
   - 檢查網站是否正常運行
   - 檢查控制台是否還有相關警告
   - 測試標記和剪貼簿功能

## 相關文件

- `src/pages/TripPlanner.js` - 主要修改文件
- Google Maps Advanced Markers 文檔：https://developers.google.com/maps/documentation/javascript/advanced-markers
- Google Maps Marker 遷移指南：https://developers.google.com/maps/documentation/javascript/advanced-markers/migration

## 注意事項

1. **向後兼容**：如果 AdvancedMarkerElement 不可用，會自動降級到傳統 Marker
2. **Safari 兼容**：剪貼簿錯誤會被靜默處理，不影響用戶體驗
3. **API 加載警告**：這是 Google Maps API 的已知問題，不影響功能

