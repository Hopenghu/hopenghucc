/**
 * 數位卡牌頁面
 * 展示卡牌包購買、卡牌管理、激活等功能
 */

import { pageTemplate } from '../components/layout.js';

export async function renderDigitalCardPage(request, env, session, user, nonce, cssContent) {
    console.log('[DigitalCardPage.js] renderDigitalCardPage called with user:', user ? user.email : 'null');

    if (!user) {
        console.log('[DigitalCardPage.js] No user, redirecting to login');
        return Response.redirect(new URL(request.url).origin + '/login', 302);
    }

    const content = `
        <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="bg-white rounded-lg shadow-md p-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4">🃏 澎湖數位卡牌</h1>
                    <p class="text-gray-600 mb-6">收集記憶，分享故事，成為澎湖的時光島主</p>
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>成功！</strong> 卡牌頁面載入成功。
                    </div>
                    <div class="mt-6">
                        <h2 class="text-xl font-semibold text-gray-800 mb-4">功能預覽</h2>
                        <ul class="list-disc list-inside text-gray-600 space-y-2">
                            <li>99元用戶卡包：1張主卡 + 5張贈送卡</li>
                            <li>299元店家卡包：10張主卡 + 50張贈送卡</li>
                            <li>卡牌激活：上傳照片驗證</li>
                            <li>卡牌轉讓：分享給朋友</li>
                            <li>優惠券系統：兌換店家優惠</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    return new Response(pageTemplate({
        title: '澎湖數位卡牌 - 遊戲',
        content,
        user,
        nonce,
        cssContent
    }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}