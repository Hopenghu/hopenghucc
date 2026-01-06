#!/bin/bash

# TripPlanner API 測試腳本

echo "🧪 TripPlanner API 測試"
echo "======================="
echo ""

# 檢查 API 端點
echo "📋 步驟 1: 檢查 API 端點..."
echo ""

# 測試行程列表 API（需要登入，所以可能返回 401/403）
echo "測試 /api/trip-planner/list..."
LIST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.hopenghu.cc/api/trip-planner/list" 2>&1)
echo "HTTP 狀態碼: $LIST_RESPONSE"

if [ "$LIST_RESPONSE" = "200" ] || [ "$LIST_RESPONSE" = "401" ] || [ "$LIST_RESPONSE" = "403" ]; then
    echo "✅ API 端點可訪問（$LIST_RESPONSE 表示需要認證，這是正常的）"
else
    echo "⚠️  API 端點返回異常狀態碼: $LIST_RESPONSE"
fi
echo ""

# 測試行程保存 API
echo "測試 /api/trip-planner/save..."
SAVE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://www.hopenghu.cc/api/trip-planner/save" 2>&1)
echo "HTTP 狀態碼: $SAVE_RESPONSE"

if [ "$SAVE_RESPONSE" = "200" ] || [ "$SAVE_RESPONSE" = "400" ] || [ "$SAVE_RESPONSE" = "401" ] || [ "$SAVE_RESPONSE" = "403" ]; then
    echo "✅ API 端點可訪問（$SAVE_RESPONSE 表示需要認證或資料，這是正常的）"
else
    echo "⚠️  API 端點返回異常狀態碼: $SAVE_RESPONSE"
fi
echo ""

# 檢查 Worker 日誌（如果可用）
echo "📋 步驟 2: 檢查 Worker 狀態..."
echo ""
echo "提示: 可以使用以下命令查看 Worker 日誌："
echo "  npx wrangler tail"
echo ""

# 檢查網站可訪問性
echo "📋 步驟 3: 檢查網站可訪問性..."
echo ""
TRIP_PLANNER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.hopenghu.cc/trip-planner" 2>&1)
echo "TripPlanner 頁面 HTTP 狀態碼: $TRIP_PLANNER_STATUS"

if [ "$TRIP_PLANNER_STATUS" = "200" ]; then
    echo "✅ TripPlanner 頁面可訪問"
elif [ "$TRIP_PLANNER_STATUS" = "302" ] || [ "$TRIP_PLANNER_STATUS" = "301" ]; then
    echo "⚠️  頁面重定向（可能需要登入）"
else
    echo "❌ 頁面返回異常狀態碼: $TRIP_PLANNER_STATUS"
fi
echo ""

echo "✅ 基本檢查完成！"
echo ""
echo "📝 下一步："
echo "1. 在瀏覽器中訪問: https://www.hopenghu.cc/trip-planner"
echo "2. 打開開發者工具（F12）→ Console"
echo "3. 執行功能測試（見 FUNCTIONAL_TEST_GUIDE.md）"
echo ""

