/**
 * 設計預覽頁面
 */

import { pageTemplate } from '../components/layout.js';

export async function renderDesignPreviewPage(request, env, session, user, nonce, cssContent) {
    console.log('[DesignPreview.js] renderDesignPreviewPage called');
    
    const content = `
        <div class="min-h-screen bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">設計預覽</h1>
                    <p class="text-gray-600">設計預覽功能開發中...</p>
                </div>
            </div>
        </div>
    `;

    return new Response(pageTemplate({ 
        title: '設計預覽', 
        content, 
        user, 
        nonce,
        cssContent 
    }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}

// 導出一個默認的 React 組件（如果需要）
export default function DesignPreview() {
    return null; // 這個組件不會被使用，因為我們使用 SSR
}
