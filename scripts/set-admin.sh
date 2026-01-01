#!/bin/bash

# 設置管理員腳本
# 使用方法: ./scripts/set-admin.sh your-email@example.com [remote|local]

EMAIL=$1
ENV=${2:-remote}

if [ -z "$EMAIL" ]; then
    echo "錯誤: 請提供 Email 地址"
    echo "使用方法: ./scripts/set-admin.sh your-email@example.com [remote|local]"
    echo ""
    echo "參數說明:"
    echo "  your-email@example.com  - 要設置為管理員的 Email 地址"
    echo "  remote (預設)            - 更新遠程資料庫（生產環境）"
    echo "  local                   - 更新本地資料庫（開發環境）"
    exit 1
fi

if [ "$ENV" = "remote" ]; then
    echo "正在設置遠程資料庫的管理員權限..."
    echo "Email: $EMAIL"
    echo ""
    npx wrangler d1 execute hopenghucc_db --remote --command "UPDATE users SET role = 'admin' WHERE email = '$EMAIL';"
    
    echo ""
    echo "正在驗證設置..."
    npx wrangler d1 execute hopenghucc_db --remote --command "SELECT id, email, name, role FROM users WHERE email = '$EMAIL';"
else
    echo "正在設置本地資料庫的管理員權限..."
    echo "Email: $EMAIL"
    echo ""
    npx wrangler d1 execute hopenghucc_db --command "UPDATE users SET role = 'admin' WHERE email = '$EMAIL';"
    
    echo ""
    echo "正在驗證設置..."
    npx wrangler d1 execute hopenghucc_db --command "SELECT id, email, name, role FROM users WHERE email = '$EMAIL';"
fi

echo ""
echo "✅ 完成！"
echo ""
echo "請確認："
echo "1. 如果您的帳號 role 顯示為 'admin'，設置成功"
echo "2. 登出並重新登入網站"
echo "3. 訪問 https://www.hopenghu.cc/ai-admin 確認可以訪問管理後台"

