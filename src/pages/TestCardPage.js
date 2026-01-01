/**
 * 測試卡牌頁面 - 最簡版本
 */

export async function renderTestCardPage(request, env, session, user, nonce, cssContent) {
    console.log('[TestCardPage.js] renderTestCardPage called');

    const html = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>測試卡牌頁面</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100">
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-white p-8 rounded-lg shadow-md">
                    <h1 class="text-3xl font-bold text-gray-900 mb-4">🃏 測試卡牌頁面</h1>
                    <p class="text-gray-600 mb-6">這是一個簡化的測試頁面，用於驗證路由是否正常工作。</p>
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>成功！</strong> 卡牌頁面路由正常工作。
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}