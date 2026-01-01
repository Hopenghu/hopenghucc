# 管理員設置指南

## 概述

本系統使用基於角色的訪問控制（RBAC），管理員可以訪問 AI 管理後台、系統管理等功能。

## 設置管理員的方法

### 方法 1：使用 D1 命令（推薦）

如果您已經有帳號，可以使用以下命令將您的帳號設置為管理員：

```bash
# 遠程資料庫（生產環境）
npx wrangler d1 execute hopenghucc_db --remote --command "UPDATE users SET role = 'admin' WHERE email = '您的Email@example.com';"

# 本地資料庫（開發環境）
npx wrangler d1 execute hopenghucc_db --command "UPDATE users SET role = 'admin' WHERE email = '您的Email@example.com';"
```

### 方法 2：使用管理員設置 API（需要特殊權限）

如果您是第一個用戶或系統管理員，可以使用 API 端點：

```bash
# 設置管理員（需要系統管理員權限或特殊令牌）
curl -X POST https://www.hopenghu.cc/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### 方法 3：檢查當前用戶角色

查看您的當前角色：

```bash
# 遠程資料庫
npx wrangler d1 execute hopenghucc_db --remote --command "SELECT id, email, name, role FROM users WHERE email = '您的Email@example.com';"

# 本地資料庫
npx wrangler d1 execute hopenghucc_db --command "SELECT id, email, name, role FROM users WHERE email = '您的Email@example.com';"
```

### 方法 4：查看所有管理員

列出所有管理員帳號：

```bash
# 遠程資料庫
npx wrangler d1 execute hopenghucc_db --remote --command "SELECT id, email, name, role, created_at FROM users WHERE role = 'admin';"

# 本地資料庫
npx wrangler d1 execute hopenghucc_db --command "SELECT id, email, name, role, created_at FROM users WHERE role = 'admin';"
```

## 首次部署設置

如果您是首次部署，建議：

1. **先註冊一個帳號**：訪問網站並使用 Google 登入
2. **設置為管理員**：使用上述方法 1 將您的帳號設置為管理員
3. **驗證權限**：訪問 `https://www.hopenghu.cc/ai-admin` 確認可以訪問

## 安全注意事項

1. **保護管理員帳號**：管理員帳號具有系統完整權限，請妥善保管
2. **定期審查**：定期檢查管理員列表，移除不再需要的管理員
3. **最小權限原則**：只給需要的人管理員權限
4. **記錄變更**：建議記錄管理員設置/移除的操作

## 管理員功能

管理員可以訪問以下功能：

- **AI 管理後台** (`/ai-admin`)：監控 AI 對話、查看統計、管理知識庫
- **系統管理後台** (`/admin`)：系統備份、速率限制、安全審計
- **圖片管理** (`/admin/images`)：管理上傳的圖片
- **其他管理功能**：根據系統配置而定

## 故障排除

### 問題：無法訪問管理後台

**可能原因：**
1. 您的帳號 role 不是 'admin'
2. 未正確登入
3. Session 過期

**解決方法：**
1. 檢查您的 role：使用上述方法 3
2. 重新登入
3. 清除瀏覽器 Cookie 後重新登入

### 問題：設置管理員後仍無法訪問

**可能原因：**
1. 資料庫更新未生效
2. Session 緩存了舊的角色信息

**解決方法：**
1. 確認資料庫更新成功：使用方法 3 檢查
2. 登出並重新登入
3. 清除瀏覽器 Cookie 和 Session

## 相關文件

- `src/api/admin.js` - 管理員 API 端點
- `src/pages/AIAdminPage.js` - AI 管理後台頁面
- `src/pages/AdminDashboard.js` - 系統管理後台頁面
- `migrations/0001_add_users_table_with_role.sql` - 用戶表結構

## 技術細節

- **角色欄位**：`users.role` (TEXT)
- **允許值**：'admin', 'user'
- **預設值**：'user'
- **檢查約束**：`CHECK (role IN ('admin', 'user'))`

