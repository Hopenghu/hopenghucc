/**
 * Itinerary Planner Page - 行程規劃頁面
 * 整合 ai-smart-itinerary-planner 功能
 */

import { pageTemplate } from '../components/layout.js';
import { ItineraryService } from '../services/ItineraryService.js';

export async function renderItineraryPlannerPage(request, env, session, user, nonce, cssContent) {
  // 需要登入才能使用行程規劃功能
  if (!user) {
    return Response.redirect(new URL(request.url).origin + '/login', 302);
  }

  const url = new URL(request.url);
  const itineraryId = url.searchParams.get('id');

  let itinerary = null;
  let userItineraries = [];

  try {
    const locationService = new (await import('../services/locationService.js')).LocationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );
    const aiService = new (await import('../services/AIService.js')).AIService(
      env.DB,
      env.OPENAI_API_KEY,
      env.GEMINI_API_KEY,
      locationService,
      env.GOOGLE_MAPS_API_KEY
    );
    const itineraryService = new ItineraryService(env.DB, locationService, aiService);

    // 如果提供了行程 ID，載入該行程
    if (itineraryId) {
      itinerary = await itineraryService.getItinerary(user.id, itineraryId);
    }

    // 獲取用戶的所有行程列表
    userItineraries = await itineraryService.getUserItineraries(user.id);
  } catch (error) {
    console.error('[ItineraryPlannerPage] Error loading data:', error);
    // 即使載入失敗，仍然渲染頁面（允許用戶創建新行程）
  }

  // 將行程資料轉換為 JSON 字串供前端使用（已進行 XSS 防護）
  const itineraryJson = itinerary ? JSON.stringify(itinerary).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') : 'null';
  const userItinerariesJson = JSON.stringify(userItineraries).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  // Import map 必須在 head 中，在 module script 之前
  const importMapScript = `
    <script type="importmap" nonce="${nonce}">
    {
      "imports": {
        "react": "https://esm.sh/react@^19.2.3",
        "react/": "https://esm.sh/react@^19.2.3/",
        "react-dom": "https://esm.sh/react-dom@^19.2.3",
        "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
        "framer-motion": "https://esm.sh/framer-motion@^12.23.26",
        "@dnd-kit/utilities": "https://esm.sh/@dnd-kit/utilities@^3.2.2",
        "@dnd-kit/core": "https://esm.sh/@dnd-kit/core@^6.3.1",
        "@dnd-kit/sortable": "https://esm.sh/@dnd-kit/sortable@^10.0.0",
        "@google/genai": "https://esm.sh/@google/genai@^1.34.0"
      }
    }
    </script>
  `;

  // 準備要注入的腳本（module script）
  const scripts = `
    <script type="module" nonce="${nonce}">
      // 定義 process 物件供瀏覽器環境使用（不包含 API Key）
      if (typeof process === 'undefined') {
        window.process = { 
          env: { 
            NODE_ENV: 'production'
          } 
        };
        globalThis.process = window.process;
      }
      
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      
      // 動態載入行程規劃器應用
      async function loadItineraryPlanner() {
        try {
          const modulePath = '/ai-smart-itinerary-planner/App.js';
          
          let module;
          try {
            module = await import(modulePath);
          } catch (importError) {
            console.error('[ItineraryPlanner] 載入模組失敗:', importError);
            throw new Error('無法載入行程規劃器模組。');
          }
           
          // Handle default export vs named export
          let App = module.default;
          if (!App || typeof App !== 'function') {
            App = module.App;
          }
          
          if (!App || typeof App !== 'function') {
            throw new Error('無法載入有效的 App 組件。');
          }
          
          const root = createRoot(document.getElementById('itinerary-planner-root'));
          
          // 初始化資料（用戶資料已進行 HTML 轉義）
          const initialItinerary = ${itineraryJson};
          const userItineraries = ${userItinerariesJson};
          const currentUser = {
            id: ${JSON.stringify(user.id)},
            email: ${JSON.stringify(user.email || '')},
            name: ${JSON.stringify(user.name || '')},
            avatarUrl: ${JSON.stringify(user.avatar_url || '')}
          };
          
          // Toast 通知系統
          window.showToast = function(message, type = 'info') {
             // 簡單的 Toast 實作
            const toast = document.createElement('div');
            const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
            toast.className = \`fixed top-20 right-4 z-50 \${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full\`;
            toast.innerHTML = \`
              <div class="flex items-center gap-3">
                <i class="fas \${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>\${message}</span>
              </div>
            \`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
              toast.classList.remove('translate-x-full');
            }, 10);
            
            setTimeout(() => {
              toast.classList.add('translate-x-full');
              setTimeout(() => toast.remove(), 300);
            }, 3000);
          };
          
          // 儲存函數
          const handleSave = async (itineraryData) => {
            try {
              const method = initialItinerary ? 'PUT' : 'POST';
              const url = initialItinerary 
                ? \`/api/itinerary/\${initialItinerary.id}\`
                : '/api/itinerary';
              
              const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(itineraryData)
              });
              
              const result = await response.json();
              if (result.success) {
                window.showToast('行程已自動儲存！', 'success');
                return result.data;
              } else {
                throw new Error(result.error || '儲存失敗');
              }
            } catch (error) {
              console.error('儲存失敗:', error);
              window.showToast('儲存失敗：' + (error.message || '請稍後再試'), 'error');
              throw error;
            }
          };
          
          const appElement = React.createElement(App, {
            initialItinerary,
            userItineraries,
            currentUser,
            onSave: handleSave
          });
          
          root.render(appElement);
        } catch (error) {
          console.error('載入行程規劃器失敗:', error);
          const rootEl = document.getElementById('itinerary-planner-root');
          if (rootEl) {
             rootEl.innerHTML = '<div class="flex items-center justify-center h-full p-8"><div class="text-center"><h2 class="text-xl font-bold text-red-600 mb-2">載入失敗</h2><p class="text-gray-600">' + error.message + '</p></div></div>';
          }
        }
      }
      
      loadItineraryPlanner();
    </script>
  `;

  const content = `
    <!-- 行程規劃器樣式 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" nonce="${nonce}">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" crossorigin="anonymous" nonce="${nonce}">
    <link rel="stylesheet" href="/ai-smart-itinerary-planner/styles/design-tokens.css" nonce="${nonce}">
    <link rel="stylesheet" href="/ai-smart-itinerary-planner/styles/responsive.css" nonce="${nonce}">
    <style nonce="${nonce}">
        /* 修正與主樣式的衝突 */
        #itinerary-planner-root {
           min-height: calc(100vh - 200px); /* 預留 header/footer 空間 */
           width: 100%;
        }
    </style>

    <div id="itinerary-planner-root" class="w-full">
        <!-- React 應用將掛載於此 -->
        <div class="flex items-center justify-center p-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    </div>
    
    ${scripts}
  `;

  return new Response(pageTemplate({
    title: '行程規劃 - 好澎湖',
    content,
    user,
    nonce,
    cssContent: cssContent + `
      /* 額外的頁面特定樣式 */
      body { overflow-x: hidden; }
    `,
    currentPath: url.pathname,
    headScripts: importMapScript
  }), {
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Security-Policy': `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://esm.sh https://cdnjs.cloudflare.com https://maps.googleapis.com https://static.cloudflareinsights.com 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.tailwindcss.com 'unsafe-inline'; style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.tailwindcss.com 'unsafe-inline'; style-src-attr 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://esm.sh https://*.esm.sh https://maps.googleapis.com https://generativelanguage.googleapis.com https://*.googleapis.com https://static.cloudflareinsights.com wss: ws:; frame-src 'self' https://www.google.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:;`
    }
  });
}
