# ✅ Directions API 啟用驗證報告

> **日期**: 2025-01-07  
> **狀態**: Directions API 已啟用（用戶確認）

---

## 📋 配置檢查清單

### 1. Google Cloud Console 配置 ✅

- [x] Directions API 已啟用（用戶確認）
- [ ] **需要驗證**: API Key 的「API restrictions」包含 Directions API
- [ ] **需要驗證**: 在「Enabled APIs」列表中確認 Directions API 狀態為「Enabled」

### 2. Cloudflare Workers Secrets ✅

- [x] `GOOGLE_MAPS_API_KEY` 已設置
- [x] API Key 已正確配置

### 3. 代碼配置 ✅

- [x] 使用 `google.maps.DirectionsService`
- [x] 使用 `google.maps.DirectionsRenderer`
- [x] 有錯誤處理機制（`directionsApiDenied`）
- [x] 有降級方案（`drawSimpleRoute`）
- [x] Google Maps API 已正確載入（包含 `places` 庫）

**注意**: Directions API 不需要在 `libraries` 參數中指定，只要 API 已啟用即可使用。

---

## 🔍 可能遺漏的配置

### 1. API Key 權限限制 ⚠️

**檢查項目**:
- API Key 的「API restrictions」是否包含 Directions API
- 如果設置了「Application restrictions」，確認允許的域名包含 `www.hopenghu.cc`

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. 點擊你的 Google Maps API Key
4. 檢查「API restrictions」：
   - 應該勾選「Restrict key」
   - 在「Select APIs」中應該包含：
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ **Directions API** ← 確認這個已勾選
5. 檢查「Application restrictions」（如果設置了）：
   - HTTP referrers 應該包含 `*.hopenghu.cc/*`

### 2. 計費帳戶 ⚠️

**檢查項目**:
- Google Cloud 專案是否已啟用計費
- 某些 API 需要啟用計費才能使用

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. Billing → Account management
3. 確認專案已連結到計費帳戶

### 3. API 配額限制 ⚠️

**檢查項目**:
- Directions API 是否有配額限制
- 是否達到每日/每月限制

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. APIs & Services → Dashboard
3. 查看 Directions API 的使用量和配額

---

## 🧪 功能測試步驟

### 測試 1: 基本路線規劃

1. **訪問**: https://www.hopenghu.cc/trip-planner
2. **登入**（如果尚未登入）
3. **添加地點**:
   - 點擊地圖上的至少 2 個 POI 標記
   - 或使用地點搜尋功能（如果已實現）
4. **觀察地圖**:
   - 應該看到藍色路線連接地點
   - 路線應該按照地點的順序顯示
5. **檢查 Console**:
   - 打開開發者工具（F12）
   - 切換到 Console 標籤
   - 不應該看到 `REQUEST_DENIED` 錯誤
   - 不應該看到 Directions API 相關錯誤

### 測試 2: 路線更新

1. **拖拽排序**:
   - 在行程面板中拖拽地點改變順序
   - 路線應該自動更新
2. **添加更多地點**:
   - 添加第 3、4 個地點
   - 路線應該包含所有地點
3. **移除地點**:
   - 移除一個地點
   - 路線應該自動更新

### 測試 3: 錯誤處理

1. **測試降級方案**:
   - 如果 Directions API 失敗，應該使用簡單的折線連接地點
   - 不應該顯示錯誤訊息（已靜默處理）

### 測試 4: 多天行程

1. **添加多天**:
   - 點擊「+ 新增一天」
   - 在不同天添加地點
2. **切換天數**:
   - 點擊天數標籤切換
   - 路線應該只顯示當前天的地點

---

## 📊 預期結果

### ✅ 成功指標

- [ ] 路線在地圖上正確顯示
- [ ] 路線按照地點順序連接
- [ ] 拖拽排序後路線自動更新
- [ ] Console 沒有 Directions API 錯誤
- [ ] 路線樣式正確（藍色線條）

### ❌ 失敗指標

- [ ] 看到 `REQUEST_DENIED` 錯誤
- [ ] 看到 `This API key is not authorized` 錯誤
- [ ] 路線不顯示（使用降級方案）
- [ ] Console 有 Directions API 相關錯誤

---

## 🔧 故障排除

### 問題 1: 看到 REQUEST_DENIED 錯誤

**可能原因**:
1. Directions API 未在 API Key 的「API restrictions」中啟用
2. API Key 的「Application restrictions」不允許當前域名
3. Directions API 未在 Google Cloud Console 中啟用

**解決方案**:
1. 檢查 API Key 的「API restrictions」是否包含 Directions API
2. 檢查「Application restrictions」設置
3. 確認 Directions API 已在「Enabled APIs」列表中

### 問題 2: 路線不顯示

**可能原因**:
1. Directions API 未啟用
2. API Key 權限不足
3. 地點坐標不正確

**解決方案**:
1. 檢查 Console 是否有錯誤
2. 確認至少添加了 2 個地點
3. 確認地點有正確的坐標

### 問題 3: 路線顯示但樣式不正確

**可能原因**:
1. 使用降級方案（簡單折線）
2. DirectionsRenderer 配置問題

**解決方案**:
1. 檢查是否使用了 `drawSimpleRoute`（降級方案）
2. 確認 Directions API 是否正常工作

---

## ✅ 驗證檢查清單

### Google Cloud Console

- [ ] Directions API 在「Enabled APIs」列表中
- [ ] API Key 的「API restrictions」包含 Directions API
- [ ] 「Application restrictions」允許 `*.hopenghu.cc/*`（如果設置了）
- [ ] 計費帳戶已啟用（如果需要）

### 功能測試

- [ ] 可以添加地點到行程
- [ ] 路線在地圖上顯示
- [ ] 路線按照正確順序連接
- [ ] 拖拽排序後路線更新
- [ ] Console 沒有錯誤
- [ ] 多天行程路線正確顯示

---

## 📝 測試報告模板

```
測試日期: ___________
測試人員: ___________

### Google Cloud Console 配置
- [ ] Directions API 已啟用
- [ ] API Key 權限包含 Directions API
- [ ] Application restrictions 正確設置

### 功能測試
- [ ] 基本路線規劃：✅ / ❌
- [ ] 路線更新：✅ / ❌
- [ ] 錯誤處理：✅ / ❌
- [ ] 多天行程：✅ / ❌

### Console 錯誤
- [ ] 無錯誤：✅
- [ ] 有錯誤：❌（請記錄錯誤訊息）

### 備註
_________________________________
_________________________________
```

---

**下一步**: 執行功能測試並填寫測試報告

