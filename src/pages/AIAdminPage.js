import { pageTemplate } from '../components/layout.js';
import { requireAdmin } from '../middleware/auth.js';
import { ErrorResponseBuilder, ServiceHealthChecker } from '../utils/errorHandler.js';
import {
  renderPageHeader,
  renderStatisticsCards,
  renderTabNavigation,
  renderConversationsPanel,
  renderKnowledgePanel,
  renderFeedbackPanel,
  renderAnalyticsPanel,
  renderQuestionLearningPanel,
  renderAddKnowledgeModal
} from '../templates/aiAdminPage.js';

export async function renderAIAdminPage(request, env, session, user, nonce, cssContent) {
  // 使用權限檢查中間件
  const authCheck = requireAdmin(user, request);
  if (authCheck) return authCheck;

  // 檢查數據庫連接
  const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
  if (!dbHealth.healthy) {
    console.error('[AIAdminPage] Database not available:', dbHealth.error);
    return ErrorResponseBuilder.buildDatabaseErrorPage({
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }

  const content = `
    <div class="max-w-7xl mx-auto px-4 py-8">
      ${renderPageHeader()}
      ${renderStatisticsCards()}
      ${renderTabNavigation()}
        ${renderConversationsPanel()}
        ${renderKnowledgePanel()}
        ${renderFeedbackPanel()}
        ${renderAnalyticsPanel()}
        ${renderQuestionLearningPanel()}
      </div>
    </div>
    ${renderAddKnowledgeModal()}

    <script nonce="${nonce}">
      let currentTab = 'conversations';
      let currentPage = 1;
      const pageSize = 20;

      // 載入統計資料
      async function loadStatistics() {
        try {
          console.log('[AI Admin] Loading statistics...');
          const response = await fetch('/api/ai/admin/statistics');
          console.log('[AI Admin] Statistics response status:', response.status);
          
          if (!response.ok) {
            console.error('[AI Admin] Statistics response not OK:', response.status, response.statusText);
            return;
          }
          
          const data = await response.json();
          console.log('[AI Admin] Statistics data:', data);
          
          if (data.success) {
            document.getElementById('total-conversations').textContent = data.totalConversations || 0;
            document.getElementById('today-conversations').textContent = data.todayConversations || 0;
            document.getElementById('knowledge-base-count').textContent = data.knowledgeBaseCount || 0;
            document.getElementById('feedback-count').textContent = data.feedbackCount || 0;
          } else {
            console.error('[AI Admin] Statistics API returned success=false:', data);
          }
        } catch (error) {
          console.error('[AI Admin] Error loading statistics:', error);
        }
      }

      // 標籤頁切換
      function showTab(tabName) {
        currentTab = tabName;
        
        // 更新按鈕狀態
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
          btn.classList.add('text-gray-500');
        });
        document.getElementById('tab-' + tabName).classList.add('active', 'text-blue-600', 'border-blue-600');
        document.getElementById('tab-' + tabName).classList.remove('text-gray-500');
        
        // 更新面板顯示
        document.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.add('hidden');
        });
        document.getElementById('panel-' + tabName).classList.remove('hidden');
        
        // 載入對應資料
        if (tabName === 'conversations') {
          loadConversations();
        } else if (tabName === 'knowledge') {
          loadKnowledgeBase();
        } else if (tabName === 'feedback') {
          loadFeedback();
        } else if (tabName === 'analytics') {
          loadAnalytics();
        } else if (tabName === 'question-learning') {
          showQuestionLearningTab('learning');
        }
      }

      // 載入對話記錄
      async function loadConversations() {
        const search = document.getElementById('search-conversations')?.value || '';
        const filter = document.getElementById('filter-user')?.value || '';
        
        console.log('[AI Admin] Loading conversations:', { page: currentPage, pageSize, search, filter });
        
        try {
          const url = '/api/ai/admin/conversations?page=' + currentPage + '&pageSize=' + pageSize + '&search=' + encodeURIComponent(search) + '&filter=' + filter;
          console.log('[AI Admin] Fetching:', url);
          
          const response = await fetch(url);
          console.log('[AI Admin] Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Admin] Response error:', errorText);
            document.getElementById('conversations-list').innerHTML = '<div class="text-center text-red-500 py-8">載入失敗：' + response.status + ' ' + response.statusText + '</div>';
            return;
          }
          
          const data = await response.json();
          console.log('[AI Admin] Response data:', {
            success: data.success,
            conversationsCount: data.conversations?.length || 0,
            totalPages: data.totalPages,
            currentPage: data.currentPage
          });
          
          if (data.success) {
            renderConversations(data.conversations || []);
            renderPagination(data.totalPages || 1);
          } else {
            console.error('[AI Admin] API returned success=false:', data);
            document.getElementById('conversations-list').innerHTML = '<div class="text-center text-red-500 py-8">載入失敗：' + (data.error || '未知錯誤') + '</div>';
          }
        } catch (error) {
          console.error('[AI Admin] Error loading conversations:', error);
          document.getElementById('conversations-list').innerHTML = '<div class="text-center text-red-500 py-8">載入失敗：' + error.message + '</div>';
        }
      }

      // 渲染對話記錄
      function renderConversations(conversations) {
        const container = document.getElementById('conversations-list');
        
        if (conversations.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-500 py-8">沒有對話記錄</div>';
          return;
        }
        
        container.innerHTML = conversations.map(conv => \`
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-sm font-medium text-gray-900">\${conv.message_type === 'user' ? '使用者' : 'AI'}</span>
                <span class="text-xs text-gray-500 ml-2">\${new Date(conv.created_at).toLocaleString('zh-TW')}</span>
              </div>
              \${conv.user_id ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">已登入</span>' : '<span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">未登入</span>'}
            </div>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">\${escapeHtml(conv.message_content)}</p>
          </div>
        \`).join('');
      }

      // 載入知識庫
      async function loadKnowledgeBase() {
        try {
          const response = await fetch('/api/ai/admin/knowledge');
          const data = await response.json();
          
          if (data.success) {
            renderKnowledgeBase(data.knowledge || []);
          }
        } catch (error) {
          console.error('Error loading knowledge base:', error);
        }
      }

      // 渲染知識庫
      function renderKnowledgeBase(knowledge) {
        const container = document.getElementById('knowledge-list');
        
        if (knowledge.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-500 py-8">知識庫為空</div>';
          return;
        }
        
        container.innerHTML = knowledge.map(kb => \`
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-medium text-gray-900">\${escapeHtml(kb.question)}</h3>
              <div class="flex space-x-2">
                <span class="text-xs text-gray-500">使用 \${kb.usage_count || 0} 次</span>
                <button onclick="deleteKnowledge('\${kb.id}')" class="text-red-600 hover:text-red-700 text-sm">刪除</button>
              </div>
            </div>
            <p class="text-sm text-gray-700">\${escapeHtml(kb.answer)}</p>
          </div>
        \`).join('');
      }

      // 載入反饋
      async function loadFeedback() {
        try {
          const response = await fetch('/api/ai/admin/feedback');
          const data = await response.json();
          
          if (data.success) {
            renderFeedback(data.feedback || []);
          }
        } catch (error) {
          console.error('Error loading feedback:', error);
        }
      }

      // 渲染反饋
      function renderFeedback(feedback) {
        const container = document.getElementById('feedback-list');
        
        if (feedback.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-500 py-8">沒有反饋</div>';
          return;
        }
        
        container.innerHTML = feedback.map(fb => \`
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium \${fb.feedback_type === 'helpful' ? 'text-green-600' : fb.feedback_type === 'not_helpful' ? 'text-red-600' : 'text-yellow-600'}">
                \${fb.feedback_type === 'helpful' ? '有幫助' : fb.feedback_type === 'not_helpful' ? '沒幫助' : fb.feedback_type === 'incorrect' ? '錯誤' : '建議'}
              </span>
              <span class="text-xs text-gray-500">\${new Date(fb.created_at).toLocaleString('zh-TW')}</span>
            </div>
            \${fb.feedback_content ? '<p class="text-sm text-gray-700">' + escapeHtml(fb.feedback_content) + '</p>' : ''}
          </div>
        \`).join('');
      }

      // 載入分析
      async function loadAnalytics() {
        try {
          const response = await fetch('/api/ai/admin/analytics');
          const data = await response.json();
          
          if (data.success) {
            renderAnalytics(data);
          }
        } catch (error) {
          console.error('Error loading analytics:', error);
        }
      }

      // 渲染分析
      function renderAnalytics(data) {
        // 熱門問題
        const popularQuestions = document.getElementById('popular-questions');
        if (data.popularQuestions && data.popularQuestions.length > 0) {
          popularQuestions.innerHTML = data.popularQuestions.map((q, i) => \`
            <div class="flex justify-between text-sm">
              <span>\${i + 1}. \${escapeHtml(q.question)}</span>
              <span class="text-gray-500">\${q.count} 次</span>
            </div>
          \`).join('');
        } else {
          popularQuestions.innerHTML = '<div class="text-center text-gray-500 py-4">沒有資料</div>';
        }
      }

      // 新增知識
      async function addKnowledge(event) {
        event.preventDefault();
        const question = document.getElementById('knowledge-question').value;
        const answer = document.getElementById('knowledge-answer').value;
        
        try {
          const response = await fetch('/api/ai/admin/knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
          });
          
          const data = await response.json();
          if (data.success) {
            closeAddKnowledgeModal();
            if (window.showToast) {
              window.showToast('知識庫項目已新增', 'success');
            }
            loadKnowledgeBase();
          } else {
            if (window.showToast) {
              window.showToast('新增失敗：' + (data.error || '未知錯誤'), 'error');
            } else {
              alert('新增失敗：' + (data.error || '未知錯誤'));
            }
          }
        } catch (error) {
          console.error('Error adding knowledge:', error);
          if (window.showToast) {
            window.showToast('新增失敗', 'error');
          } else {
            alert('新增失敗');
          }
        }
      }

      function showAddKnowledgeModal() {
        document.getElementById('add-knowledge-modal').classList.remove('hidden');
      }

      function closeAddKnowledgeModal() {
        document.getElementById('add-knowledge-modal').classList.add('hidden');
        document.getElementById('add-knowledge-form').reset();
      }

      function deleteKnowledge(id) {
        if (!confirm('確定要刪除這個知識庫項目嗎？')) return;
        
        fetch(\`/api/ai/admin/knowledge/\${id}\`, {
          method: 'DELETE'
        }).then(() => {
          loadKnowledgeBase();
        });
      }

      function renderPagination(totalPages) {
        const container = document.getElementById('conversations-pagination');
        if (totalPages <= 1) {
          container.innerHTML = '';
          return;
        }
        
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
          html += \`<button onclick="currentPage = \${i}; loadConversations();" class="px-3 py-1 border rounded \${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white'}">\${i}</button>\`;
        }
        container.innerHTML = html;
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // 問題學習相關變數
      let currentQuestionLearningPage = 1;
      let currentImprovementsPage = 1;
      let currentQuestionLearningTab = 'learning';

      // 問題學習子標籤頁切換
      function showQuestionLearningTab(tabName) {
        currentQuestionLearningTab = tabName;
        
        // 更新按鈕狀態
        document.querySelectorAll('.qltab-button').forEach(btn => {
          btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
          btn.classList.add('text-gray-500');
        });
        document.getElementById('qltab-' + tabName).classList.add('active', 'text-blue-600', 'border-blue-600');
        document.getElementById('qltab-' + tabName).classList.remove('text-gray-500');
        
        // 更新面板顯示
        document.querySelectorAll('.qlpanel').forEach(panel => {
          panel.classList.add('hidden');
        });
        document.getElementById('qlpanel-' + tabName).classList.remove('hidden');
        
        // 載入對應資料
        if (tabName === 'learning') {
          loadQuestionLearning();
        } else if (tabName === 'templates') {
          loadQuestionTemplates();
        } else if (tabName === 'improvements') {
          loadQuestionImprovements();
        }
      }

      // 載入問題學習記錄
      async function loadQuestionLearning() {
        const category = document.getElementById('filter-category')?.value || '';
        const questionType = document.getElementById('filter-question-type')?.value || '';
        
        try {
          const params = new URLSearchParams({
            page: currentQuestionLearningPage,
            pageSize: pageSize
          });
          if (category) params.append('category', category);
          if (questionType) params.append('questionType', questionType);
          
          const response = await fetch(\`/api/ai/admin/question-learning?\${params}\`);
          const data = await response.json();
          
          if (data.success) {
            renderQuestionLearning(data.learning || []);
            renderQuestionLearningPagination(data.totalPages || 1);
          }
        } catch (error) {
          console.error('Error loading question learning:', error);
          document.getElementById('question-learning-list').innerHTML = '<div class="text-center text-red-500 py-8">載入失敗</div>';
        }
      }

      // 渲染問題學習記錄
      function renderQuestionLearning(learning) {
        const container = document.getElementById('question-learning-list');
        
        if (learning.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-500 py-8">沒有學習記錄</div>';
          return;
        }
        
        container.innerHTML = learning.map(item => {
          const qualityScore = (item.question_quality_score * 100).toFixed(1);
          const clarityScore = (item.clarity_score * 100).toFixed(1);
          const specificityScore = (item.specificity_score * 100).toFixed(1);
          const successBadge = item.led_to_successful_answer 
            ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">成功</span>'
            : '<span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">未成功</span>';
          
          return \`
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-sm font-medium text-gray-900">\${item.question_type === 'user_query' ? '用戶問題' : 'AI問題'}</span>
                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">\${item.question_category || 'general'}</span>
                    \${successBadge}
                  </div>
                  <p class="text-sm text-gray-700 mb-2">\${escapeHtml(item.original_question)}</p>
                  <div class="flex space-x-4 text-xs text-gray-500">
                    <span>品質: \${qualityScore}%</span>
                    <span>清晰度: \${clarityScore}%</span>
                    <span>具體性: \${specificityScore}%</span>
                    \${item.answer_quality_score ? '<span>答案品質: ' + (item.answer_quality_score * 100).toFixed(1) + '%</span>' : ''}
                  </div>
                </div>
                <span class="text-xs text-gray-500 ml-4">\${new Date(item.created_at).toLocaleString('zh-TW')}</span>
              </div>
            </div>
          \`;
        }).join('');
      }

      // 載入問題模板
      async function loadQuestionTemplates() {
        const templateType = document.getElementById('filter-template-type')?.value || '';
        
        try {
          const params = new URLSearchParams();
          if (templateType) params.append('templateType', templateType);
          
          const response = await fetch(\`/api/ai/admin/question-templates?\${params}\`);
          const data = await response.json();
          
          if (data.success) {
            renderQuestionTemplates(data.templates || []);
          }
        } catch (error) {
          console.error('Error loading question templates:', error);
          document.getElementById('question-templates-list').innerHTML = '<div class="text-center text-red-500 py-8">載入失敗</div>';
        }
      }

      // 渲染問題模板
      function renderQuestionTemplates(templates) {
        const container = document.getElementById('question-templates-list');
        
        if (templates.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-500 py-8">沒有問題模板</div>';
          return;
        }
        
        container.innerHTML = templates.map(template => {
          const successRate = (template.success_rate * 100).toFixed(1);
          const avgQuality = (template.average_question_quality * 100).toFixed(1);
          
          return \`
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-sm font-medium text-gray-900">\${template.template_type || 'general'}</span>
                    \${template.context_type ? '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">' + template.context_type + '</span>' : ''}
                    \${template.is_active ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">啟用</span>' : '<span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">停用</span>'}
                  </div>
                  <p class="text-sm text-gray-700 mb-2">\${escapeHtml(template.template_text)}</p>
                  <div class="flex space-x-4 text-xs text-gray-500">
                    <span>成功率: \${successRate}%</span>
                    <span>平均品質: \${avgQuality}%</span>
                    <span>使用次數: \${template.usage_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      }

      // 載入問題改進記錄
      async function loadQuestionImprovements() {
        try {
          const response = await fetch(\`/api/ai/admin/question-improvements?page=\${currentImprovementsPage}&pageSize=\${pageSize}\`);
          const data = await response.json();
          
          if (data.success) {
            renderQuestionImprovements(data.improvements || []);
            renderQuestionImprovementsPagination(data.totalPages || 1);
          }
        } catch (error) {
          console.error('Error loading question improvements:', error);
          document.getElementById('question-improvements-list').innerHTML = '<div class="text-center text-red-500 py-8">載入失敗</div>';
        }
      }

      // 渲染問題改進記錄
      function renderQuestionImprovements(improvements) {
        const container = document.getElementById('question-improvements-list');
        
        if (improvements.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-500 py-8">沒有改進記錄</div>';
          return;
        }
        
        container.innerHTML = improvements.map(item => {
          const beforeScore = (item.before_score * 100).toFixed(1);
          const afterScore = (item.after_score * 100).toFixed(1);
          const improvement = ((item.after_score - item.before_score) * 100).toFixed(1);
          
          return \`
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="mb-2">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">\${item.improvement_type || 'structure'}</span>
                  \${item.was_effective ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">有效</span>' : ''}
                </div>
                <p class="text-sm text-gray-600 mb-1"><strong>原始問題：</strong>\${escapeHtml(item.original_question_id ? '問題ID: ' + item.original_question_id : 'N/A')}</p>
                <p class="text-sm text-gray-700 mb-2"><strong>改進後：</strong>\${escapeHtml(item.improved_question)}</p>
                <div class="flex space-x-4 text-xs text-gray-500">
                  <span>改進前: \${beforeScore}%</span>
                  <span>改進後: \${afterScore}%</span>
                  <span class="text-green-600">提升: +\${improvement}%</span>
                </div>
                \${item.improvement_reason ? '<p class="text-xs text-gray-500 mt-1">原因: ' + escapeHtml(item.improvement_reason) + '</p>' : ''}
              </div>
              <span class="text-xs text-gray-500">\${new Date(item.created_at).toLocaleString('zh-TW')}</span>
            </div>
          \`;
        }).join('');
      }

      // 提取問題模板
      async function extractTemplates() {
        if (!confirm('確定要提取問題模板嗎？這將從成功的問題中學習並建立模板。')) return;
        
        try {
          const response = await fetch('/api/ai/admin/question-templates/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              minSuccessRate: 0.7,
              minQualityScore: 0.7
            })
          });
          
          const data = await response.json();
          if (data.success) {
            if (window.showToast) {
              window.showToast('成功提取 ' + (data.count || 0) + ' 個問題模板！', 'success');
            } else {
              alert(\`成功提取 \${data.count || 0} 個問題模板！\`);
            }
            if (currentQuestionLearningTab === 'templates') {
              loadQuestionTemplates();
            }
          } else {
            if (window.showToast) {
              window.showToast('提取失敗：' + (data.error || '未知錯誤'), 'error');
            } else {
              alert('提取失敗：' + (data.error || '未知錯誤'));
            }
          }
        } catch (error) {
          console.error('Error extracting templates:', error);
          if (window.showToast) {
            window.showToast('提取失敗', 'error');
          } else {
            alert('提取失敗');
          }
        }
      }

      // 問題學習分頁
      function renderQuestionLearningPagination(totalPages) {
        const container = document.getElementById('question-learning-pagination');
        if (totalPages <= 1) {
          container.innerHTML = '';
          return;
        }
        
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
          html += \`<button onclick="currentQuestionLearningPage = \${i}; loadQuestionLearning();" class="px-3 py-1 border rounded \${i === currentQuestionLearningPage ? 'bg-blue-600 text-white' : 'bg-white'}">\${i}</button>\`;
        }
        container.innerHTML = html;
      }

      // 改進記錄分頁
      function renderQuestionImprovementsPagination(totalPages) {
        const container = document.getElementById('question-improvements-pagination');
        if (totalPages <= 1) {
          container.innerHTML = '';
          return;
        }
        
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
          html += \`<button onclick="currentImprovementsPage = \${i}; loadQuestionImprovements();" class="px-3 py-1 border rounded \${i === currentImprovementsPage ? 'bg-blue-600 text-white' : 'bg-white'}">\${i}</button>\`;
        }
        container.innerHTML = html;
      }

      // 初始化
      document.addEventListener('DOMContentLoaded', function() {
        loadStatistics();
        loadConversations();
      });
    </script>
  `;

  return new Response(pageTemplate({ 
    title: 'AI 管理後台 - HOPENGHU', 
    content, 
    user, 
    nonce,
    cssContent 
  }), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}
