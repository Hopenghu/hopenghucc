# ✅ Directions API 完整檢查清單

> **狀態**: Directions API 已啟用（用戶確認）  
> **目的**: 確保所有配置正確，無遺漏

---

## 🔍 必須檢查的配置項

### 1. Google Cloud Console - API 啟用 ✅

- [x] **Directions API 已啟用**（用戶確認）
- [ ] **需要驗證**: 在「Enabled APIs」列表中確認狀態為「Enabled」

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. APIs & Services → Enabled APIs
3. 搜尋「Directions API」
4. 確認狀態為「Enabled」

---

### 2. Google Cloud Console - API Key 權限 ⚠️ **重要**

這是**最常見的遺漏**！

#### 檢查項目

- [ ] **API restrictions 包含 Directions API**

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. 點擊你的 Google Maps API Key（`AIzaSyD1q8Nu0mgGeingP9JJTBwehBxyBTxv46Q`）
4. 在「**API restrictions**」區域：
   - 確認選擇了「**Restrict key**」
   - 在「**Select APIs**」中，確認以下 API 都已勾選：
     - ✅ **Maps JavaScript API**
     - ✅ **Places API**
     - ✅ **Directions API** ← **確認這個已勾選！**
     - ✅ **Geocoding API**（如果使用）
5. 如果未勾選 Directions API，**立即勾選並保存**

#### 檢查項目

- [ ] **Application restrictions 允許你的域名**（如果設置了）

**驗證步驟**:
1. 在同一個 API Key 詳情頁面
2. 在「**Application restrictions**」區域：
   - 如果選擇了「**HTTP referrers (web sites)**」
   - 確認「**Website restrictions**」包含：
     - `*.hopenghu.cc/*`
     - `*.hopenghu.cc`
     - `hopenghu.cc/*`
   - 如果選擇了「**None」**，則不需要檢查

---

### 3. Google Cloud Console - 計費帳戶 ⚠️

- [ ] **計費帳戶已啟用**

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. Billing → Account management
3. 確認專案已連結到計費帳戶
4. 確認帳戶狀態為「Active」

**注意**: 某些 API 需要啟用計費才能使用，即使有免費額度。

---

### 4. Google Cloud Console - API 配額 ⚠️

- [ ] **檢查配額限制**

**驗證步驟**:
1. 前往: https://console.cloud.google.com/
2. APIs & Services → Dashboard
3. 查看「Directions API」的使用量
4. 確認未達到配額限制

**預設配額**:
- 每 100 秒: 100 次請求
- 每天: 2,500 次請求（免費額度）

---

### 5. Cloudflare Workers Secrets ✅

- [x] `GOOGLE_MAPS_API_KEY` 已設置
- [x] API Key 值正確

---

### 6. 代碼配置 ✅

- [x] 使用 `google.maps.DirectionsService`
- [x] 使用 `google.maps.DirectionsRenderer`
- [x] 有錯誤處理機制
- [x] 有降級方案
- [x] Google Maps API 正確載入

**注意**: Directions API 不需要在 `libraries` 參數中指定。

---

## 🚨 最常見的遺漏

### 遺漏 1: API Key 權限未包含 Directions API ⭐⭐⭐

**問題**: Directions API 已啟用，但 API Key 的「API restrictions」未包含 Directions API

**症狀**: 
- 看到 `REQUEST_DENIED` 錯誤
- 看到 `This API key is not authorized to use this service or API` 錯誤

**解決**: 
1. 前往 API Key 詳情頁面
2. 在「API restrictions」中勾選「Directions API」
3. 保存更改
4. 等待 1-2 分鐘讓更改生效

---

### 遺漏 2: Application Restrictions 限制域名 ⭐⭐

**問題**: API Key 的「Application restrictions」不允許當前域名

**症狀**: 
- 看到 `REQUEST_DENIED` 錯誤
- 在特定域名下無法使用

**解決**: 
1. 前往 API Key 詳情頁面
2. 在「Application restrictions」中添加允許的域名
3. 或選擇「None」（不推薦，安全性較低）

---

### 遺漏 3: 計費帳戶未啟用 ⭐

**問題**: 專案未連結計費帳戶

**症狀**: 
- API 無法使用
- 看到計費相關錯誤

**解決**: 
1. 啟用計費帳戶
2. 連結到專案

---

## ✅ 快速驗證步驟

### 步驟 1: 檢查 API 啟用狀態

```bash
# 無法從命令行檢查，需要在 Google Cloud Console 檢查
```

1. 前往: https://console.cloud.google.com/
2. APIs & Services → Enabled APIs
3. 確認「Directions API」在列表中且狀態為「Enabled」

### 步驟 2: 檢查 API Key 權限

1. 前往: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. 點擊 API Key: `AIzaSyD1q8Nu0mgGeingP9JJTBwehBxyBTxv46Q`
4. 檢查「API restrictions」是否包含 Directions API
5. 檢查「Application restrictions」是否允許你的域名

### 步驟 3: 測試功能

1. 訪問: https://www.hopenghu.cc/trip-planner
2. 打開開發者工具（F12）
3. 添加至少 2 個地點
4. 觀察 Console 是否有錯誤
5. 觀察地圖是否顯示路線

---

## 📊 驗證結果

### Google Cloud Console

- [ ] Directions API 在「Enabled APIs」列表中
- [ ] API Key 的「API restrictions」包含 Directions API
- [ ] 「Application restrictions」允許 `*.hopenghu.cc/*`（如果設置了）
- [ ] 計費帳戶已啟用

### 功能測試

- [ ] 路線在地圖上顯示
- [ ] Console 沒有 `REQUEST_DENIED` 錯誤
- [ ] 路線按照正確順序連接
- [ ] 拖拽排序後路線更新

---

## 🔧 如果仍有問題

### 檢查清單

1. **等待時間**: API 設置更改後需要 1-2 分鐘才能生效
2. **清除快取**: 清除瀏覽器快取或使用無痕模式
3. **檢查 Console**: 查看具體錯誤訊息
4. **檢查 Network**: 查看 API 請求是否成功
5. **重新部署**: 如果修改了 secrets，可能需要重新部署

### 常見錯誤訊息

| 錯誤訊息 | 可能原因 | 解決方案 |
|---------|---------|---------|
| `REQUEST_DENIED` | API Key 權限不足 | 檢查 API restrictions |
| `This API key is not authorized` | API 未啟用或權限不足 | 啟用 API 並檢查權限 |
| `OVER_QUERY_LIMIT` | 達到配額限制 | 檢查配額設置 |
| `INVALID_REQUEST` | 請求參數錯誤 | 檢查代碼中的請求參數 |

---

**下一步**: 執行功能測試（見 `FUNCTIONAL_TEST_GUIDE.md`）

