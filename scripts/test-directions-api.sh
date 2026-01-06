#!/bin/bash

# Directions API 測試腳本

echo "🧪 Google Directions API 測試"
echo "================================"
echo ""

# 檢查 API Key 是否設置
echo "📋 步驟 1: 檢查 API Key 設置..."
API_KEY=$(npx wrangler secret list 2>&1 | grep -q "GOOGLE_MAPS_API_KEY" && echo "已設置" || echo "未設置")
echo "GOOGLE_MAPS_API_KEY: $API_KEY"
echo ""

# 測試 Directions API 是否可用
echo "📋 步驟 2: 測試 Directions API..."
echo ""

# 使用 curl 測試 Directions API
# 注意：這需要從 secrets 中獲取 API Key，但我們無法直接讀取 secrets
# 所以這裡只是提供測試方法

echo "⚠️  注意：無法直接從命令行測試 Directions API（需要 API Key）"
echo ""
echo "✅ 建議的測試方法："
echo ""
echo "1. 在瀏覽器中訪問: https://www.hopenghu.cc/trip-planner"
echo "2. 打開瀏覽器開發者工具（F12）"
echo "3. 切換到 Console 標籤"
echo "4. 添加至少 2 個地點到行程"
echo "5. 觀察 Console 是否有 Directions API 相關錯誤"
echo ""
echo "預期結果："
echo "  ✅ 如果 API 已啟用：路線會在地圖上顯示"
echo "  ❌ 如果 API 未啟用：會看到 'REQUEST_DENIED' 錯誤"
echo ""

# 檢查 Google Maps JavaScript API 是否包含 directions 庫
echo "📋 步驟 3: 檢查代碼中的 Google Maps API 配置..."
echo ""

if grep -q "libraries=places" src/pages/TripPlanner.js; then
    echo "✅ Google Maps API 已配置 places 庫"
    if grep -q "libraries=places,directions" src/pages/TripPlanner.js || grep -q "libraries=.*directions" src/pages/TripPlanner.js; then
        echo "✅ Google Maps API 已配置 directions 庫"
    else
        echo "⚠️  Google Maps API 可能未明確包含 directions 庫"
        echo "   注意：Directions API 不需要在 libraries 參數中指定"
        echo "   只要 API 已啟用，DirectionsService 就可以使用"
    fi
else
    echo "⚠️  未找到 Google Maps API 配置"
fi
echo ""

echo "📋 步驟 4: 檢查 Directions API 使用情況..."
echo ""

if grep -q "DirectionsService\|DirectionsRenderer" src/pages/TripPlanner.js; then
    echo "✅ 代碼中使用了 DirectionsService 和 DirectionsRenderer"
    echo ""
    echo "使用位置："
    grep -n "DirectionsService\|DirectionsRenderer" src/pages/TripPlanner.js | head -5
else
    echo "❌ 未找到 Directions API 使用"
fi
echo ""

echo "📋 步驟 5: 檢查錯誤處理..."
echo ""

if grep -q "directionsApiDenied\|REQUEST_DENIED\|drawSimpleRoute" src/pages/TripPlanner.js; then
    echo "✅ 代碼中有 Directions API 錯誤處理和降級方案"
else
    echo "⚠️  未找到錯誤處理機制"
fi
echo ""

echo "✅ 檢查完成！"
echo ""
echo "下一步："
echo "1. 在瀏覽器中測試路線規劃功能"
echo "2. 檢查 Console 是否有錯誤"
echo "3. 確認路線是否正確顯示在地圖上"
echo ""

