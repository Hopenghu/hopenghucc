import { renderHomePage } from '../pages/Home.js';
import { renderLoginPage } from '../pages/Login.js';
import { renderNotFoundPage } from '../pages/notFound.js';
import { renderAIChatPage } from '../pages/AIChatPage.js';
import { renderImageManagementPage } from '../pages/ImageManagement.js';
import { renderAdminDashboardPage } from '../pages/AdminDashboard.js';
import { renderAIAdminPage } from '../pages/AIAdminPage.js';
import { renderBusinessVerificationAdminPage } from '../pages/BusinessVerificationAdmin.js';
import { renderProfilePage } from '../pages/Profile.js';
import { renderDesignPreviewPage } from '../pages/DesignPreview.js';
// Game Pages
import { renderPenghuGamePage as renderGamePage } from '../pages/GamePage.js';
import { renderSimpleTestPage } from '../pages/SimpleTestPage.js';
import { renderTestPage } from '../pages/TestPage.js';
import { renderFootprintsPage } from '../pages/Footprints.js';
import { renderStoryTimelinePage } from '../pages/StoryTimeline.js';
import { renderRecommendationsPage } from '../pages/Recommendations.js';
import { renderSearchPage } from '../pages/Search.js';
import { renderFavoritesPage } from '../pages/Favorites.js';
import { renderLocationDetailPage } from '../pages/LocationDetail.js';
import { renderItineraryPlannerPage } from '../pages/ItineraryPlanner.js';
import { handleAuthRequest } from '../api/auth.js';
import { handleCspReport } from '../api/csp.js';
import { handleImageRequest } from '../api/image.js';
import { handleAdminRequest } from '../api/admin.js';
import { handleLocationRequest } from '../api/location.js';
import { handleAIRequest } from '../api/ai.js';
import { createGameRoutes } from '../api/game.js';
import { createPenghuGameRoutes } from '../api/penghu-game.js';
import { createSimpleGameRoutes } from '../api/simple-game.js';
import { pageTemplate } from '../components/layout.js';
import { renderErrorPage } from '../pages/ErrorPage.js';

async function renderGoogleInfoPage(request, env, session, user, nonce, cssContent) {
  if (!user) {
    return Response.redirect(new URL(request.url).origin + '/login', 302);
  }
  const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  const userName = escapeHtml(user.name);
  const userEmail = escapeHtml(user.email);
  const userAvatar = user.avatar_url ? escapeHtml(user.avatar_url) : null;
  const content = `
    <div class="p-6 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-6">我的 Google 帳號資訊</h1>
      <div class="flex items-center space-x-4 mb-6">
        ${userAvatar ?
      `<img src="${userAvatar}" alt="User Avatar" class="w-16 h-16 rounded-full object-cover">` :
      `<span class="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-semibold text-white">${userName ? userName.charAt(0).toUpperCase() : '?'}</span>`
    }
        <div>
          <h2 class="text-xl font-semibold">${userName || '使用者名稱未提供'}</h2>
          <p class="text-gray-600">${userEmail || '電子郵件未提供'}</p>
        </div>
      </div>
      <h3 class="text-lg font-semibold mb-2 border-t pt-4">帳號詳情</h3>
      <pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm"><code>${JSON.stringify(user, null, 2)}</code></pre>
      <p class="mt-6 text-sm text-gray-500">這是從您的 Google 帳號和我們的資料庫中讀取的資訊。</p>
    </div>
  `;
  return new Response(pageTemplate({
    title: 'Google 帳號資訊',
    content,
    user,
    nonce,
    cssContent
  }), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}

export async function routePageRequest(request, env, session, user, nonce, cssContent) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    if (pathname === '/' || pathname === '/index.html') {
      return await renderHomePage(request, env, session, user, nonce, cssContent);
    }
    if (pathname === '/login') {
      if (user) {
        // 如果用户已登录，重定向到首页（显示时光机 UI）
        return Response.redirect(url.origin + '/', 302);
      }
      return await renderLoginPage(request, env, session, user, nonce, cssContent);
    }
    if (pathname === '/google-info') {
      if (!user) {
        return Response.redirect(url.origin + '/login', 302);
      }
      return await renderGoogleInfoPage(request, env, session, user, nonce, cssContent);
    }

    // Admin routes
    if (pathname === '/admin' || pathname === '/admin/') {
      // Redirect /admin to /admin/dashboard
      return Response.redirect(url.origin + '/admin/dashboard', 302);
    }

    if (pathname === '/admin/images') {
      return await renderImageManagementPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/admin/dashboard') {
      return await renderAdminDashboardPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/admin/ai' || pathname === '/ai-admin') {
      return await renderAIAdminPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/admin/verifications' || pathname === '/admin/business-verification') {
      return await renderBusinessVerificationAdminPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/profile') {
      return await renderProfilePage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/footprints') {
      return await renderFootprintsPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/ai-chat') {
      return await renderAIChatPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/story-timeline' || pathname === '/timeline') {
      return await renderStoryTimelinePage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/recommendations' || pathname === '/recommend') {
      return await renderRecommendationsPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/search') {
      return await renderSearchPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/favorites') {
      return await renderFavoritesPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/itinerary' || pathname === '/itinerary-planner') {
      return await renderItineraryPlannerPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname.startsWith('/location/')) {
      const locationId = pathname.split('/').pop();
      if (locationId && locationId !== 'location') {
        return await renderLocationDetailPage(request, env, session, user, nonce, cssContent);
      }
    }

    if (pathname === '/design-preview') {
      return await renderDesignPreviewPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/game') {
      if (!user) {
        return Response.redirect(url.origin + '/login', 302);
      }
      return await renderGamePage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/cards') {
      return new Response('Cards route working!', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (pathname === '/game-test') {
      // 測試預覽頁面，不需要登入
      return new Response('Game test route working!', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (pathname === '/test') {
      // 簡單測試頁面，不需要登入
      return await renderSimpleTestPage(request, env, session, user, nonce, cssContent);
    }

    if (pathname === '/test-simple') {
      // 最簡單測試頁面，不需要登入
      return await renderTestPage(request, env, session, user, nonce, cssContent);
    }

    return await renderNotFoundPage(request, env, session, user, nonce, cssContent);
  } catch (error) {
    console.error('Route Error:', error);
    return renderErrorPage(request, env, session, user, nonce, cssContent, error);
  }
}

export async function handleApiRequest(request, env, session, user, ctx = null) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Story API Routes
  if (path.startsWith('/api/story/')) {
    const { handleStoryRequest } = await import('../api/story.js');
    return await handleStoryRequest(request, env, user);
  }

  if (path.startsWith('/api/')) {
    const resource = path.split('/')[2];

    try {
      switch (resource) {
        case 'auth':
          return await handleAuthRequest(request, env);
        case 'csp-report':
          return await handleCspReport(request, env);
        case 'image':
          return await handleImageRequest(request, env, ctx);
        case 'admin':
          return await handleAdminRequest(request, env, user);
        case 'location':
        case 'locations':  // 支持复数形式
          return await handleLocationRequest(request, env, user);
        case 'story':
          const { handleStoryRequest } = await import('../api/story.js');
          return await handleStoryRequest(request, env, user);
        case 'recommendation':
          const { handleRecommendationRequest } = await import('../api/recommendation.js');
          return await handleRecommendationRequest(request, env, user);
        case 'search':
          const { handleSearchRequest } = await import('../api/search.js');
          return await handleSearchRequest(request, env, user);
        case 'favorites':
          const { handleFavoritesRequest } = await import('../api/favorites.js');
          return await handleFavoritesRequest(request, env, user);
        case 'itinerary':
          const { handleItineraryRequest } = await import('../api/itinerary.js');
          return await handleItineraryRequest(request, env, user);
        case 'business':
          // 檢查是否為驗證相關 API
          if (path.startsWith('/api/business/verify/')) {
            const { handleBusinessVerificationRequest } = await import('../api/business-verification.js');
            return await handleBusinessVerificationRequest(request, env, user);
          }
          return new Response('API resource not Found', { status: 404 });
        case 'ai':
          // 檢查是否為管理後台 API
          if (path.startsWith('/api/ai/admin/')) {
            const { handleAIAdminRequest } = await import('../api/ai-admin.js');
            return await handleAIAdminRequest(request, env, user);
          }
          return await handleAIRequest(request, env, user);
        case 'game':
          // 創建臨時的 Hono app 來處理遊戲 API
          const { Hono } = await import('hono');
          const app = new Hono();
          createGameRoutes(app, env.DB);
          return await app.fetch(request);
        case 'penghu-game':
          // 創建臨時的 Hono app 來處理澎湖遊戲 API
          const { Hono: PenghuHono } = await import('hono');
          const penghuApp = new PenghuHono();
          createPenghuGameRoutes(penghuApp, env.DB);
          return await penghuApp.fetch(request);
        case 'simple-game':
          // 創建臨時的 Hono app 來處理簡化遊戲 API
          const { Hono: SimpleHono } = await import('hono');
          const simpleApp = new SimpleHono();
          createSimpleGameRoutes(simpleApp, env.DB);
          return await simpleApp.fetch(request);
        case 'digital-cards':
          // 暫時禁用數位卡牌 API
          return new Response('API temporarily disabled', { status: 503 });
        default:
          return new Response('API resource not Found', { status: 404 });
      }
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  console.warn('Request reached end of handleApiRequest without matching API route:', path);
  return new Response('API route not Found', { status: 404 });
} 