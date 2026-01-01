
import { pageTemplate } from '../components/layout.js';

export function renderErrorPage(request, env, session, user, nonce, cssContent, error) {
    const content = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <span class="text-6xl">🤕</span>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            哎呀！出了一點小狀況
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            我們的伺服器遇到了一些預期之外的錯誤。
          </p>
          ${error ? `
            <div class="mt-4 p-4 bg-red-50 rounded-lg text-left overflow-hidden">
               <p class="text-xs text-red-500 font-mono break-all">${error.message || error.toString()}</p>
            </div>
          ` : ''}
        </div>
        <div class="mt-5 sm:mt-8 sm:flex sm:justify-center">
          <div class="rounded-md shadow">
            <a href="/" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg transition duration-150 ease-in-out">
              回首頁
            </a>
          </div>
          <div class="mt-3 sm:mt-0 sm:ml-3">
            <button onclick="window.location.reload()" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg transition duration-150 ease-in-out">
              重試
            </button>
          </div>
        </div>
        <div class="mt-6 text-xs text-gray-400">
          <p>如果是持續性問題，請聯繫管理員。</p>
        </div>
      </div>
    </div>
  `;

    return new Response(pageTemplate({
        title: '500 - 伺服器錯誤',
        content,
        user,
        nonce,
        cssContent,
        useContainer: false // 全螢幕佈局
    }), {
        status: 500,
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}
