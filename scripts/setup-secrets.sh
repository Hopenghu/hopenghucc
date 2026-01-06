#!/bin/bash

# Cloudflare Workers Secrets 設置腳本
# 此腳本會引導你設置所有必需的 secrets

set -e

echo "🔐 Cloudflare Workers Secrets 設置腳本"
echo "========================================"
echo ""

# 檢查是否已登入
echo "📋 步驟 1: 檢查 Cloudflare 登入狀態..."
if ! npx wrangler whoami > /dev/null 2>&1; then
    echo "❌ 未登入 Cloudflare"
    echo "請先執行: npx wrangler login"
    exit 1
fi

echo "✅ 已登入 Cloudflare"
echo ""

# 檢查當前 secrets
echo "📋 步驟 2: 檢查當前設置的 secrets..."
echo ""
npx wrangler secret list
echo ""

# 設置必需的 secrets
echo "📋 步驟 3: 設置必需的 Secrets"
echo "========================================"
echo ""

# Google Maps API Key
echo "🗺️  設置 GOOGLE_MAPS_API_KEY"
echo "提示: 從 Google Cloud Console 獲取你的 Google Maps API Key"
read -p "請輸入 GOOGLE_MAPS_API_KEY (或按 Enter 跳過): " GOOGLE_MAPS_API_KEY
if [ ! -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo "$GOOGLE_MAPS_API_KEY" | npx wrangler secret put GOOGLE_MAPS_API_KEY
    echo "✅ GOOGLE_MAPS_API_KEY 設置完成"
else
    echo "⏭️  跳過 GOOGLE_MAPS_API_KEY"
fi
echo ""

# Google OAuth Client ID
echo "🔑 設置 GOOGLE_CLIENT_ID"
echo "提示: 從 Google Cloud Console 獲取你的 OAuth Client ID"
read -p "請輸入 GOOGLE_CLIENT_ID (或按 Enter 跳過): " GOOGLE_CLIENT_ID
if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    echo "$GOOGLE_CLIENT_ID" | npx wrangler secret put GOOGLE_CLIENT_ID
    echo "✅ GOOGLE_CLIENT_ID 設置完成"
else
    echo "⏭️  跳過 GOOGLE_CLIENT_ID"
fi
echo ""

# Google OAuth Client Secret
echo "🔐 設置 GOOGLE_CLIENT_SECRET"
echo "提示: 從 Google Cloud Console 獲取你的 OAuth Client Secret"
read -p "請輸入 GOOGLE_CLIENT_SECRET (或按 Enter 跳過): " GOOGLE_CLIENT_SECRET
if [ ! -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "$GOOGLE_CLIENT_SECRET" | npx wrangler secret put GOOGLE_CLIENT_SECRET
    echo "✅ GOOGLE_CLIENT_SECRET 設置完成"
else
    echo "⏭️  跳過 GOOGLE_CLIENT_SECRET"
fi
echo ""

# JWT Secret
echo "🔒 設置 JWT_SECRET"
echo "提示: 這是一個用於簽名 JWT token 的密鑰，建議使用強隨機字串"
read -p "是否自動生成 JWT_SECRET? (y/n): " GENERATE_JWT
if [ "$GENERATE_JWT" = "y" ] || [ "$GENERATE_JWT" = "Y" ]; then
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo "✅ 已生成 JWT_SECRET: ${JWT_SECRET:0:20}..."
    elif command -v node &> /dev/null; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        echo "✅ 已生成 JWT_SECRET: ${JWT_SECRET:0:20}..."
    else
        echo "❌ 無法生成隨機字串，請手動輸入"
        read -p "請輸入 JWT_SECRET: " JWT_SECRET
    fi
    if [ ! -z "$JWT_SECRET" ]; then
        echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
        echo "✅ JWT_SECRET 設置完成"
    fi
else
    read -p "請輸入 JWT_SECRET (或按 Enter 跳過): " JWT_SECRET
    if [ ! -z "$JWT_SECRET" ]; then
        echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
        echo "✅ JWT_SECRET 設置完成"
    else
        echo "⏭️  跳過 JWT_SECRET"
    fi
fi
echo ""

# 可選的 secrets
echo "📋 步驟 4: 設置可選的 Secrets (AI 功能)"
echo "========================================"
echo ""

# OpenAI API Key
read -p "是否設置 OPENAI_API_KEY? (y/n): " SET_OPENAI
if [ "$SET_OPENAI" = "y" ] || [ "$SET_OPENAI" = "Y" ]; then
    read -p "請輸入 OPENAI_API_KEY: " OPENAI_API_KEY
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "$OPENAI_API_KEY" | npx wrangler secret put OPENAI_API_KEY
        echo "✅ OPENAI_API_KEY 設置完成"
    fi
fi
echo ""

# Gemini API Key
read -p "是否設置 GEMINI_API_KEY? (y/n): " SET_GEMINI
if [ "$SET_GEMINI" = "y" ] || [ "$SET_GEMINI" = "Y" ]; then
    read -p "請輸入 GEMINI_API_KEY: " GEMINI_API_KEY
    if [ ! -z "$GEMINI_API_KEY" ]; then
        echo "$GEMINI_API_KEY" | npx wrangler secret put GEMINI_API_KEY
        echo "✅ GEMINI_API_KEY 設置完成"
    fi
fi
echo ""

# 驗證設置
echo "📋 步驟 5: 驗證設置"
echo "========================================"
echo ""
echo "當前設置的 secrets:"
npx wrangler secret list
echo ""

# 詢問是否重新部署
read -p "是否立即重新部署 Worker? (y/n): " REDEPLOY
if [ "$REDEPLOY" = "y" ] || [ "$REDEPLOY" = "Y" ]; then
    echo ""
    echo "🔨 重新構建 Worker..."
    npm run build
    echo ""
    echo "🚀 部署 Worker..."
    npx wrangler deploy
    echo ""
    echo "✅ 部署完成！"
    echo ""
    echo "⏳ 等待 30 秒讓部署生效..."
    sleep 30
    echo ""
    echo "🧪 測試網站..."
    curl -I https://www.hopenghu.cc 2>&1 | head -5
fi

echo ""
echo "✅ Secrets 設置完成！"
echo ""
echo "📚 下一步:"
echo "1. 如果尚未重新部署，請執行: npm run build && npx wrangler deploy"
echo "2. 等待 1-2 分鐘後測試網站: curl -I https://www.hopenghu.cc"
echo "3. 檢查 Worker 日誌: npx wrangler tail"
echo ""

