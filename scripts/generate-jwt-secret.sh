#!/bin/bash

# 生成 JWT Secret 腳本

echo "🔒 生成 JWT Secret"
echo "=================="
echo ""

# 嘗試使用 openssl
if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✅ 使用 openssl 生成"
elif command -v node &> /dev/null; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    echo "✅ 使用 Node.js 生成"
else
    echo "❌ 無法生成隨機字串（需要 openssl 或 node）"
    exit 1
fi

echo ""
echo "生成的 JWT Secret:"
echo "=================="
echo "$JWT_SECRET"
echo ""
echo "📋 使用方式:"
echo "1. 複製上面的 JWT Secret"
echo "2. 執行: npx wrangler secret put JWT_SECRET"
echo "3. 貼上 JWT Secret 後按 Enter"
echo ""
echo "⚠️  重要: 請保存這個 JWT Secret，不要遺失！"
echo ""

