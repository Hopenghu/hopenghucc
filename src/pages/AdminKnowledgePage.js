
import { pageTemplate } from '../components/layout.js';
import { requireAdmin } from '../middleware/auth.js';

export async function renderAdminKnowledgePage(request, env, session, user, nonce, cssContent) {
    // 1. Admin Authentication Check
    const authCheck = requireAdmin(user, request);
    if (authCheck) return authCheck;

    // 2. Fetch Pending Contributions (Client-side fetch or server-side pre-fetch? Let's use client-side for dynamic interactions)
    // We will render basic structure and let JS fetch data

    const content = `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">澎湖知識庫審核</h1>
            <p class="mt-2 text-sm text-gray-600">審核使用者貢獻的私房景點與故事，豐富 AI 的長期記憶。</p>
          </div>
          <div class="flex space-x-3">
             <a href="/admin/verifications" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
               返回商家驗證
             </a>
          </div>
        </div>

        <!-- Stats Card -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">待審核項目</dt>
            <dd class="mt-1 text-3xl font-semibold text-indigo-600" id="pending-count">-</dd>
          </div>
        </div>

        <!-- Pending List -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <ul id="knowledge-list" class="divide-y divide-gray-200">
            <li class="p-6 text-center text-gray-500">載入中...</li>
          </ul>
        </div>
        
        <!-- Pagination -->
        <div class="mt-4 flex justify-between items-center" id="pagination-controls">
           <!-- Added dynamically -->
        </div>

      </div>
    </div>

    <script nonce="${nonce}">
      let currentOffset = 0;
      const limit = 20;

      async function fetchPendingKnowledge() {
        try {
          const response = await fetch(\`/api/admin/knowledge/pending?limit=\${limit}&offset=\${currentOffset}\`);
          const data = await response.json();
          
          if (data.success) {
            renderList(data.contributions);
            document.getElementById('pending-count').textContent = data.total;
          } else {
             document.getElementById('knowledge-list').innerHTML = '<li class="p-6 text-center text-red-500">載入失敗: ' + data.error + '</li>';
          }
        } catch (e) {
          console.error('Error:', e);
          document.getElementById('knowledge-list').innerHTML = '<li class="p-6 text-center text-red-500">發生錯誤</li>';
        }
      }

      function renderList(items) {
        const listEl = document.getElementById('knowledge-list');
        if (!items || items.length === 0) {
          listEl.innerHTML = '<li class="p-6 text-center text-gray-500">目前沒有待審核的項目。</li>';
          return;
        }

        listEl.innerHTML = items.map(item => \`
          <li>
            <div class="block hover:bg-gray-50">
              <div class="px-4 py-4 sm:px-6">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-indigo-600 truncate">
                    \${item.category === 'food' ? '🍜 美食' : item.category === 'spot' ? '🏞️ 景點' : '📖 故事'}
                  </p>
                  <div class="ml-2 flex-shrink-0 flex">
                    <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      待審核
                    </p>
                  </div>
                </div>
                <div class="mt-2 sm:flex sm:justify-between">
                  <div class="sm:flex">
                    <p class="flex items-center text-sm text-gray-500">
                      來源: \${item.user_id ? '會員' : '訪客'}
                    </p>
                  </div>
                  <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      提交於 \${new Date(item.created_at).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
                <div class="mt-4">
                  <p class="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    \${item.content}
                  </p>
                  <p class="mt-2 text-xs text-gray-400">
                     提取資料: \${item.extracted_data || '無'}
                  </p>
                </div>
                <div class="mt-4 flex justify-end space-x-3">
                  <button onclick="handleReject(\${item.id})" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    拒絕
                  </button>
                  <button onclick="handleApprove(\${item.id})" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    批准並加入資料庫
                  </button>
                </div>
              </div>
            </div>
          </li>
        \`).join('');
      }

      async function handleApprove(id) {
        if(!confirm('確定要批准這條情報嗎？')) return;
        try {
          const res = await fetch(\`/api/admin/knowledge/\${id}/approve\`, { method: 'POST' });
          const data = await res.json();
          if(data.success) {
            alert('已批准！');
            fetchPendingKnowledge(); // Refresh
          } else {
            alert('失敗: ' + data.message);
          }
        } catch(e) {
          alert('Error executing request');
        }
      }

      async function handleReject(id) {
        if(!confirm('確定要拒絕這條情報嗎？')) return;
        try {
          const res = await fetch(\`/api/admin/knowledge/\${id}/reject\`, { method: 'POST' });
          const data = await res.json();
          if(data.success) {
            alert('已拒絕。');
            fetchPendingKnowledge(); // Refresh
          } else {
            alert('失敗: ' + data.message);
          }
        } catch(e) {
           alert('Error executing request');
        }
      }

      // Initial Load
      fetchPendingKnowledge();
    </script>
  `;

    return pageTemplate({
        user,
        nonce,
        cssContent,
        content,
        title: '知識庫審核 | 澎湖好朋友 Admin'
    });
}
