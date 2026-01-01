/**
 * 簡單測試頁面
 */

import { pageTemplate } from '../components/layout.js';

export async function renderSimpleTestPage(request, env, session, user, nonce, cssContent) {
    const content = `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-lg shadow-md p-8 text-center">
                    <h1 class="text-4xl font-bold text-gray-900 mb-6">🏝️ 澎湖時光島主 - 測試頁面</h1>
                    <p class="text-lg text-gray-700 mb-8">這是一個簡單的測試頁面，用來驗證路由是否正常工作。</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div class="bg-blue-50 rounded-lg p-6">
                            <h2 class="text-xl font-semibold text-blue-900 mb-3">🎮 遊戲功能測試</h2>
                            <div class="space-y-2">
                                <button onclick="testFunction('創建記憶膠囊')" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                    📦 測試創建記憶膠囊
                                </button>
                                <button onclick="testFunction('探索地點')" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                    🗺️ 測試探索地點
                                </button>
                                <button onclick="testFunction('完成任務')" class="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                                    🎯 測試完成任務
                                </button>
                                <button onclick="testFunction('獲得勳章')" class="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
                                    🏆 測試獲得勳章
                                </button>
                            </div>
                        </div>
                        
                        <div class="bg-green-50 rounded-lg p-6">
                            <h2 class="text-xl font-semibold text-green-900 mb-3">📊 測試結果</h2>
                            <div id="test-results" class="space-y-2 text-sm">
                                <div class="text-gray-600">等待測試操作...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 rounded-lg p-6">
                        <h2 class="text-xl font-semibold text-yellow-900 mb-3">✅ 測試狀態</h2>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600" id="test-points">0</div>
                                <div class="text-sm text-gray-500">點數</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600" id="test-level">1</div>
                                <div class="text-sm text-gray-500">等級</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600" id="test-memories">0</div>
                                <div class="text-sm text-gray-500">記憶膠囊</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-orange-600" id="test-visits">0</div>
                                <div class="text-sm text-gray-500">訪問次數</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">
            let testStats = {
                points: 0,
                level: 1,
                memories: 0,
                visits: 0
            };

            function testFunction(action) {
                // 更新統計
                testStats.points += 10;
                testStats.memories += 1;
                testStats.visits += 1;
                
                // 檢查升級
                if (testStats.points >= 100) {
                    testStats.level += 1;
                    testStats.points = 0;
                }
                
                // 更新顯示
                updateStats();
                
                // 添加測試結果
                addTestResult(\`✅ \${action} 測試成功！獲得 10 點數\`);
                
                // 顯示成功提示
                showSuccess(\`\${action} 測試成功！\`);
            }

            function updateStats() {
                document.getElementById('test-points').textContent = testStats.points;
                document.getElementById('test-level').textContent = testStats.level;
                document.getElementById('test-memories').textContent = testStats.memories;
                document.getElementById('test-visits').textContent = testStats.visits;
            }

            function addTestResult(message) {
                const results = document.getElementById('test-results');
                const result = document.createElement('div');
                result.className = 'text-green-600';
                result.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
                results.insertBefore(result, results.firstChild);
                
                // 限制結果數量
                while (results.children.length > 5) {
                    results.removeChild(results.lastChild);
                }
            }

            function showSuccess(message) {
                // 創建成功提示
                const success = document.createElement('div');
                success.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                success.textContent = message;
                document.body.appendChild(success);
                
                // 3秒後移除
                setTimeout(() => {
                    document.body.removeChild(success);
                }, 3000);
            }

            // 頁面載入完成
            document.addEventListener('DOMContentLoaded', function() {
                console.log('簡單測試頁面已載入！');
                addTestResult('測試頁面載入完成');
            });
        </script>
    `;

    return new Response(pageTemplate({
        title: '澎湖時光島主 - 簡單測試',
        content,
        user: null,
        nonce,
        cssContent
    }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}
