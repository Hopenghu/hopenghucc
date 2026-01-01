/**
 * 最簡單的測試頁面
 */

import { pageTemplate } from '../components/layout.js';

export async function renderTestPage(request, env, session, user, nonce, cssContent) {
    const content = `
        <div class="min-h-screen bg-blue-50 p-8">
            <div class="max-w-2xl mx-auto">
                <div class="bg-white rounded-lg shadow-md p-8 text-center">
                    <h1 class="text-4xl font-bold text-gray-900 mb-6">🏝️ 澎湖時光島主 - 測試頁面</h1>
                    <p class="text-lg text-gray-700 mb-8">這是一個簡單的測試頁面，用來驗證路由是否正常工作。</p>
                    
                    <div class="space-y-4">
                        <button onclick="testFunction()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            🎮 測試按鈕
                        </button>
                        
                        <div id="test-result" class="text-gray-600">
                            等待測試...
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">
            function testFunction() {
                document.getElementById('test-result').innerHTML = '✅ 測試成功！功能正常運作！';
                document.getElementById('test-result').className = 'text-green-600 font-semibold';
            }
        </script>
    `;

    return new Response(pageTemplate({
        title: '澎湖時光島主 - 測試',
        content,
        user: null,
        nonce,
        cssContent
    }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}
