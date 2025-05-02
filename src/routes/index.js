import { renderHomePage } from '../pages/Home.js';
import { renderLoginPage } from '../pages/Login.js';
import { renderNotFoundPage } from '../pages/notFound.js';
import { handleAuthRequest } from '../api/auth.js';
import { handleCspReport } from '../api/csp.js';
import { pageTemplate } from '../components/layout.js';

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
        return Response.redirect(url.origin + '/google-info', 302);
      }
      return await renderLoginPage(request, env, session, user, nonce, cssContent);
    }
    if (pathname === '/google-info') {
      if (!user) {
        return Response.redirect(url.origin + '/login', 302);
      }
      return await renderGoogleInfoPage(request, env, session, user, nonce, cssContent);
    }

    return await renderNotFoundPage(request, env, session, user, nonce, cssContent);
  } catch (error) {
    console.error('Route Error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    });
  }
}

export async function handleApiRequest(request, env, session, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.startsWith('/api/')) {
    const resource = path.split('/')[2];

    try {
      switch (resource) {
        case 'auth':
          return await handleAuthRequest(request, env);
        case 'csp-report':
          return await handleCspReport(request, env);
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