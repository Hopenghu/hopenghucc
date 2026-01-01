import { pageTemplate } from '../components/layout.js';

const Home = () => { 
  return <div>Placeholder for potential future client-side Home content</div>;
};

export async function renderHomePage(request, env, session, user, nonce, cssContent) { 
  // 首页不再需要登录，无论是否登录都显示相同内容
  const content = `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="text-center py-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">好澎湖 HOPENGHU</h1>
        <p class="text-xl md:text-2xl text-gray-700 mb-2">喜歡澎湖，因為澎湖是希望之島</p>
        <p class="text-lg text-gray-600 mb-8">HOPE PENGHU</p>
        
        <!-- AI 助手入口 -->
        <div class="mt-8">
          <a href="/ai-chat" class="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
            </svg>
            <span class="font-semibold">開啟澎湖 AI 助手</span>
          </a>
        </div>
      </div>
    </div>
  `;

  const url = new URL(request.url);
  return new Response(pageTemplate({ 
    title: 'HOPENGHU - 首頁', 
    content, 
    user, 
    nonce,
    cssContent,
    currentPath: url.pathname
  }), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}

export default Home;
