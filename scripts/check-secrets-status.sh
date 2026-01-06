#!/bin/bash

# 檢查 Secrets 設置狀態腳本

echo "🔍 Cloudflare Workers Secrets 狀態檢查"
echo "========================================"
echo ""

# 檢查登入狀態
echo "📋 步驟 1: 檢查 Cloudflare 登入狀態..."
if npx wrangler whoami > /dev/null 2>&1; then
    echo "✅ 已登入 Cloudflare"
    npx wrangler whoami | head -3
else
    echo "❌ 未登入 Cloudflare"
    echo "請先執行: npx wrangler login"
    exit 1
fi
echo ""

# 檢查當前 secrets
echo "📋 步驟 2: 檢查當前設置的 Secrets..."
echo ""
SECRETS=$(npx wrangler secret list 2>&1)

if [ "$SECRETS" = "[]" ] || [ -z "$SECRETS" ]; then
    echo "❌ 尚未設置任何 secrets"
    echo ""
    echo "需要設置的 secrets:"
    echo "  - GOOGLE_MAPS_API_KEY (必需)"
    echo "  - GOOGLE_CLIENT_ID (必需)"
    echo "  - GOOGLE_CLIENT_SECRET (必需)"
    echo "  - JWT_SECRET (必需)"
    echo "  - OPENAI_API_KEY (可選)"
    echo "  - GEMINI_API_KEY (可選)"
else
    echo "✅ 已設置的 secrets:"
    echo "$SECRETS" | jq -r '.[] | "  - \(.name)"' 2>/dev/null || echo "$SECRETS"
fi
echo ""

# 檢查必需的 secrets
echo "📋 步驟 3: 檢查必需的 Secrets..."
echo ""
REQUIRED_SECRETS=("GOOGLE_MAPS_API_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "JWT_SECRET")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS" | grep -q "$secret" 2>/dev/null; then
        echo "✅ $secret - 已設置"
    else
        echo "❌ $secret - 未設置"
        MISSING_SECRETS+=("$secret")
    fi
done
echo ""

# 總結
if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    echo "✅ 所有必需的 secrets 已設置！"
    echo ""
    echo "下一步:"
    echo "1. 重新部署: npm run build && npx wrangler deploy"
    echo "2. 等待 1-2 分鐘後測試: curl -I https://www.hopenghu.cc"
else
    echo "⚠️  缺少 ${#MISSING_SECRETS[@]} 個必需的 secrets"
    echo ""
    echo "需要設置的 secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  - $secret"
    done
    echo ""
    echo "設置方式:"
    echo "1. 使用自動化腳本: ./scripts/setup-secrets.sh"
    echo "2. 手動設置: npx wrangler secret put <SECRET_NAME>"
    echo "3. 查看指南: cat QUICK_SECRETS_SETUP.md"
fi
echo ""

