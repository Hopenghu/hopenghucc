/**
 * AI Admin Page Templates
 * AI 管理頁面模板
 * 
 * 將 HTML 模板從 AIAdminPage.js 中分離出來，提高可維護性
 */

/**
 * 安全地轉義 HTML
 */
function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 渲染頁面標題區域
 */
export function renderPageHeader() {
  return `
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">AI 管理後台</h1>
      <p class="text-gray-600">監控使用、收集反饋、優化回答品質</p>
    </div>
  `;
}

/**
 * 渲染統計卡片
 */
export function renderStatisticsCards() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">總對話數</div>
        <div id="total-conversations" class="text-2xl font-bold text-gray-900">-</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">今日對話</div>
        <div id="today-conversations" class="text-2xl font-bold text-blue-600">-</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">知識庫項目</div>
        <div id="knowledge-base-count" class="text-2xl font-bold text-green-600">-</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600 mb-1">使用者反饋</div>
        <div id="feedback-count" class="text-2xl font-bold text-purple-600">-</div>
      </div>
    </div>
  `;
}

/**
 * 渲染標籤頁導航
 */
export function renderTabNavigation() {
  return `
    <div class="bg-white rounded-lg shadow mb-6">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button onclick="showTab('conversations')" id="tab-conversations" class="tab-button active px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            對話記錄
          </button>
          <button onclick="showTab('knowledge')" id="tab-knowledge" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            知識庫
          </button>
          <button onclick="showTab('feedback')" id="tab-feedback" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            使用者反饋
          </button>
          <button onclick="showTab('analytics')" id="tab-analytics" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            使用分析
          </button>
          <button onclick="showTab('question-learning')" id="tab-question-learning" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            問題學習
          </button>
        </nav>
      </div>
  `;
}

/**
 * 渲染對話記錄面板
 */
export function renderConversationsPanel() {
  return `
    <div id="panel-conversations" class="tab-panel p-6">
      <div class="mb-4 flex justify-between items-center">
        <h2 class="text-xl font-semibold">對話記錄</h2>
        <div class="flex space-x-2">
          <input type="text" id="search-conversations" placeholder="搜尋對話..." class="border border-gray-300 rounded px-3 py-1 text-sm" onkeyup="searchConversations()">
          <select id="filter-user" class="border border-gray-300 rounded px-3 py-1 text-sm" onchange="loadConversations()">
            <option value="">所有使用者</option>
            <option value="logged-in">已登入</option>
            <option value="anonymous">未登入</option>
          </select>
        </div>
      </div>
      <div id="conversations-list" class="space-y-4">
        <div class="text-center text-gray-500 py-8">載入中...</div>
      </div>
      <div id="conversations-pagination" class="mt-4 flex justify-center space-x-2"></div>
    </div>
  `;
}

/**
 * 渲染知識庫面板
 */
export function renderKnowledgePanel() {
  return `
    <div id="panel-knowledge" class="tab-panel hidden p-6">
      <div class="mb-4 flex justify-between items-center">
        <h2 class="text-xl font-semibold">知識庫管理</h2>
        <button onclick="showAddKnowledgeModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          新增知識
        </button>
      </div>
      <div id="knowledge-list" class="space-y-4">
        <div class="text-center text-gray-500 py-8">載入中...</div>
      </div>
    </div>
  `;
}

/**
 * 渲染使用者反饋面板
 */
export function renderFeedbackPanel() {
  return `
    <div id="panel-feedback" class="tab-panel hidden p-6">
      <div class="mb-4">
        <h2 class="text-xl font-semibold">使用者反饋</h2>
      </div>
      <div id="feedback-list" class="space-y-4">
        <div class="text-center text-gray-500 py-8">載入中...</div>
      </div>
    </div>
  `;
}

/**
 * 渲染使用分析面板
 */
export function renderAnalyticsPanel() {
  return `
    <div id="panel-analytics" class="tab-panel hidden p-6">
      <div class="mb-4">
        <h2 class="text-xl font-semibold">使用分析</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold mb-2">熱門問題</h3>
          <div id="popular-questions" class="space-y-2">
            <div class="text-center text-gray-500 py-4">載入中...</div>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold mb-2">使用時段</h3>
          <div id="usage-hours" class="space-y-2">
            <div class="text-center text-gray-500 py-4">載入中...</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染問題學習面板
 */
export function renderQuestionLearningPanel() {
  return `
    <div id="panel-question-learning" class="tab-panel hidden p-6">
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">問題學習系統</h2>
          <button onclick="extractTemplates()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            提取問題模板
          </button>
        </div>
        
        <!-- 子標籤頁 -->
        <div class="border-b border-gray-200 mb-4">
          <nav class="flex -mb-px">
            <button onclick="showQuestionLearningTab('learning')" id="qltab-learning" class="qltab-button active px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              學習記錄
            </button>
            <button onclick="showQuestionLearningTab('templates')" id="qltab-templates" class="qltab-button px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              問題模板
            </button>
            <button onclick="showQuestionLearningTab('improvements')" id="qltab-improvements" class="qltab-button px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              改進記錄
            </button>
          </nav>
        </div>
      </div>

      <!-- 學習記錄面板 -->
      <div id="qlpanel-learning" class="qlpanel">
        <div class="mb-4 flex space-x-2">
          <select id="filter-category" class="border border-gray-300 rounded px-3 py-1 text-sm" onchange="loadQuestionLearning()">
            <option value="">所有類別</option>
            <option value="location">地點</option>
            <option value="price">價格</option>
            <option value="time">時間</option>
            <option value="distance">距離</option>
            <option value="memory">回憶</option>
            <option value="identity">身份</option>
            <option value="general">一般</option>
          </select>
          <select id="filter-question-type" class="border border-gray-300 rounded px-3 py-1 text-sm" onchange="loadQuestionLearning()">
            <option value="">所有類型</option>
            <option value="user_query">用戶問題</option>
            <option value="ai_question">AI問題</option>
          </select>
        </div>
        <div id="question-learning-list" class="space-y-4">
          <div class="text-center text-gray-500 py-8">載入中...</div>
        </div>
        <div id="question-learning-pagination" class="mt-4 flex justify-center space-x-2"></div>
      </div>

      <!-- 問題模板面板 -->
      <div id="qlpanel-templates" class="qlpanel hidden">
        <div class="mb-4 flex space-x-2">
          <select id="filter-template-type" class="border border-gray-300 rounded px-3 py-1 text-sm" onchange="loadQuestionTemplates()">
            <option value="">所有類型</option>
            <option value="location">地點</option>
            <option value="price">價格</option>
            <option value="time">時間</option>
            <option value="distance">距離</option>
            <option value="memory">回憶</option>
            <option value="identity">身份</option>
            <option value="general">一般</option>
          </select>
        </div>
        <div id="question-templates-list" class="space-y-4">
          <div class="text-center text-gray-500 py-8">載入中...</div>
        </div>
      </div>

      <!-- 改進記錄面板 -->
      <div id="qlpanel-improvements" class="qlpanel hidden">
        <div id="question-improvements-list" class="space-y-4">
          <div class="text-center text-gray-500 py-8">載入中...</div>
        </div>
        <div id="question-improvements-pagination" class="mt-4 flex justify-center space-x-2"></div>
      </div>
    </div>
  `;
}

/**
 * 渲染新增知識模態框
 */
export function renderAddKnowledgeModal() {
  return `
    <div id="add-knowledge-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 class="text-xl font-semibold mb-4">新增知識庫項目</h3>
        <form id="add-knowledge-form" onsubmit="addKnowledge(event)">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">問題</label>
            <input type="text" id="knowledge-question" required class="w-full border border-gray-300 rounded px-3 py-2" placeholder="例如：澎湖哪裡可以看夕陽？">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">答案</label>
            <textarea id="knowledge-answer" required rows="5" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="詳細答案..."></textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" onclick="closeAddKnowledgeModal()" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              取消
            </button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              新增
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

