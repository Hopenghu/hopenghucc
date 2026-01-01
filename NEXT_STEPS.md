# HOPENGHU.CC 後續行動計劃

基於 `DEVELOPMENT_GUIDE.md` 和當前代碼狀態，以下是清晰的後續行動計劃。

## 📊 當前狀態總結

### ✅ 已完成
1. **Toast 通知系統** - 已在 `layout.js` 中實作 `window.showToast()`
2. **錯誤邊界處理** - 已實作 `ErrorPage.js`
3. **遊戲頁面整合** - 已統一為 `GamePage.js`

### 🔄 進行中
1. **替換 alert()** - 還有 38 個 `alert()` 需要替換為 `showToast()`

### 📋 待辦事項
1. **商家驗證功能** - `BusinessVerificationService.js` 仍為空殼
2. **遊戲深化** - 任務系統和排行榜功能開發中
3. **代碼清理** - 移除廢棄代碼和註釋

---

## 🎯 階段一：完成 alert() 替換（優先級最高）

### 目標
將所有 38 個 `alert()` 替換為 `showToast()`

### 需要替換的文件（按優先級）

#### 高優先級（用戶常用功能）
1. **`src/pages/Footprints.js`** - 7 個 alert()
   - 收藏操作
   - 地點狀態更新
   - 載入錯誤

2. **`src/pages/LocationDetail.js`** - 4 個 alert()
   - 收藏操作
   - 地點狀態更新
   - 評分操作

3. **`src/pages/Profile.js`** - 2 個 alert()
   - 用戶操作反饋

4. **`src/components/CommentsComponent.js`** - 5 個 alert()
   - 評論發布
   - 載入錯誤

5. **`src/components/RatingComponent.js`** - 3 個 alert()
   - 評分操作
   - 錯誤處理

#### 中優先級（管理功能）
6. **`src/pages/AIAdminPage.js`** - 5 個 alert()
   - 管理操作反饋

7. **`src/pages/ImageManagement.js`** - 6 個 alert()
   - 圖片管理操作

#### 低優先級（其他功能）
8. **`src/pages/StoryTimeline.js`** - 3 個 alert()
9. **`src/pages/Favorites.js`** - 2 個 alert()
10. **`src/pages/GamePage.js`** - 9 個 alert()

### 替換模式

#### 替換前
```javascript
alert('操作成功！');
alert('操作失敗: ' + error.message);
```

#### 替換後
```javascript
window.showToast('操作成功！', 'success');
window.showToast('操作失敗: ' + error.message, 'error');
```

### 實施步驟
1. 從高優先級文件開始
2. 逐個文件替換
3. 測試每個替換的功能
4. 確保所有通知類型正確（success/error/warning/info）

---

## 🎯 階段二：完善商家驗證功能

### 當前狀態
- `BusinessVerificationService.js` 只有 placeholder 邏輯
- 需要實現真正的驗證流程

### 實施步驟

#### 2.1 設計驗證流程
```
商家申請驗證
    ↓
系統記錄申請（創建 verification record）
    ↓
管理員審核（手動驗證）
    ↓
發送驗證結果通知
```

#### 2.2 創建數據庫遷移
- 創建 `business_verifications` 表
- 字段：
  - `id` (TEXT PRIMARY KEY)
  - `location_id` (TEXT, FOREIGN KEY)
  - `user_id` (TEXT, FOREIGN KEY)
  - `status` (TEXT: pending/approved/rejected)
  - `requested_at` (TEXT)
  - `verified_at` (TEXT)
  - `verified_by` (TEXT, admin user_id)
  - `notes` (TEXT)

#### 2.3 實現驗證邏輯
- `adminInitiateForPlaceId()` - 管理員發起驗證
- `userRequestVerificationForPlaceId()` - 用戶申請驗證
- `approveVerification()` - 批准驗證
- `rejectVerification()` - 拒絕驗證

#### 2.4 創建 API 端點
- `POST /api/business/verify/request` - 申請驗證
- `POST /api/business/verify/approve` - 批准驗證（admin）
- `POST /api/business/verify/reject` - 拒絕驗證（admin）
- `GET /api/business/verify/status` - 查詢驗證狀態

#### 2.5 整合到 UI
- 在地點詳情頁顯示驗證狀態
- 提供「申請驗證」按鈕（商家用戶）
- 管理員驗證界面

---

## 🎯 階段三：完善遊戲功能

### 當前狀態
- 記憶膠囊系統 ✅
- 角色系統 ✅
- 點數/等級系統 ✅
- 任務系統 ⚠️ 開發中
- 排行榜 ⚠️ 開發中

### 實施步驟

#### 3.1 任務系統
- 設計任務類型：
  - 每日任務（每日重置）
  - 週任務（每週重置）
  - 成就任務（一次性）
- 實現任務追蹤：
  - 任務進度記錄
  - 任務完成檢查
  - 任務獎勵發放
- 創建任務 UI：
  - 任務列表
  - 任務進度顯示
  - 任務完成動畫

#### 3.2 排行榜系統
- 設計排行榜類型：
  - 總點數排行榜
  - 等級排行榜
  - 記憶膠囊數量排行榜
  - 本週活躍度排行榜
- 實現排行榜 API：
  - `GET /api/game/leaderboard` - 獲取排行榜
  - 支援分頁和篩選
- 實現排行榜 UI：
  - 排行榜列表
  - 用戶排名顯示
  - 獎章展示

---

## 🎯 階段四：代碼清理

### 目標
- 移除廢棄代碼
- 清理註釋
- 統一代碼風格

### 實施步驟

#### 4.1 檢查廢棄文件
- 確認 `GamePageSSR.js`、`GamePageSimple.js` 等是否仍在使用
- 如果未使用，備份後刪除

#### 4.2 清理路由註釋
- 檢查 `routes/index.js` 中註釋掉的路由
- 確認是否真的不需要，如果不需要則刪除

#### 4.3 清理 TODO/FIXME
- 搜尋所有 `TODO` 和 `FIXME` 註釋
- 評估是否需要處理
- 更新或移除過時的註釋

---

## 📅 建議時間表

### 本週（第 1 週）
- **Day 1-2**: 替換 Footprints.js 和 LocationDetail.js 中的 alert()
- **Day 3-4**: 替換 Components 中的 alert()
- **Day 5**: 替換其他頁面中的 alert()，測試所有功能

### 下週（第 2 週）
- **Day 1-2**: 設計商家驗證流程和數據庫結構
- **Day 3-4**: 實現商家驗證邏輯和 API
- **Day 5**: 整合到 UI，測試驗證流程

### 第三週
- **Day 1-3**: 實現任務系統
- **Day 4-5**: 實現排行榜系統

### 第四週
- **Day 1-2**: 代碼清理
- **Day 3-5**: 測試、優化、文檔更新

---

## 🚀 立即開始

### 第一步：替換 alert() 的具體行動

我建議從以下順序開始：

1. **`src/pages/Footprints.js`** (7個)
   - 這是用戶最常用的頁面
   - 影響範圍最大

2. **`src/pages/LocationDetail.js`** (4個)
   - 地點詳情頁，用戶互動頻繁
   - 需要處理收藏、評分、評論等操作

3. **`src/components/CommentsComponent.js`** (5個)
   - 組件級別，影響多個頁面

4. **`src/components/RatingComponent.js`** (3個)
   - 組件級別，影響多個頁面

---

## 📝 檢查清單

### alert() 替換
- [ ] Footprints.js (7個)
- [ ] LocationDetail.js (4個)
- [ ] Profile.js (2個)
- [ ] CommentsComponent.js (5個)
- [ ] RatingComponent.js (3個)
- [ ] StoryTimeline.js (3個)
- [ ] Favorites.js (2個)
- [ ] AIAdminPage.js (5個)
- [ ] ImageManagement.js (6個)
- [ ] GamePage.js (9個)
- [ ] 測試所有替換的功能

### 商家驗證
- [ ] 設計驗證流程
- [ ] 創建數據庫遷移
- [ ] 實現驗證邏輯
- [ ] 創建 API 端點
- [ ] 整合到 UI
- [ ] 測試驗證流程

### 遊戲功能
- [ ] 設計任務系統
- [ ] 實現任務追蹤
- [ ] 創建任務 UI
- [ ] 設計排行榜系統
- [ ] 實現排行榜 API
- [ ] 實現排行榜 UI

---

## 💡 建議

**立即開始**：從替換 `Footprints.js` 中的 alert() 開始，因為：
1. 這是用戶最常用的頁面
2. 影響範圍最大（7個 alert()）
3. 可以立即看到效果
4. 為後續替換建立模式

準備好開始了嗎？我可以立即開始替換 `Footprints.js` 中的 alert()！

