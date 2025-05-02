import { pageTemplate } from '../components/layout.js';

export async function renderLoginPage(request, env, session, user, nonce, cssContent) {
  
  const googleLoginUrl = `/api/auth/google`;

  const content = `
    <div class="min-h-[70vh] flex items-center justify-center p-4">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 class="text-2xl font-bold mb-6 text-center">登入或註冊</h1>
        
        <a href="${googleLoginUrl}" 
           class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mb-4">
          <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.712,34.495,44,28.756,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          <span>使用 Google 登入</span>
        </a>

        <p class="text-center text-xs text-gray-500">
          登入即表示您同意我們的服務條款和隱私政策。
        </p>
      </div>
    </div>
  `;

  return new Response(pageTemplate({ 
      title: '登入', 
      content, 
      user, 
      nonce,
      cssContent 
    }), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}