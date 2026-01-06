/**
 * EcosystemDashboard - 生態系統監控頁面
 * 顯示用戶福祉、資源使用、社區健康等指標
 * 符合「服務生命，讓世界更好更平衡」的理念
 */

import { pageTemplate } from '../components/layout.js';
import { requireAdmin } from '../middleware/auth.js';
import { ErrorResponseBuilder, ServiceHealthChecker } from '../utils/errorHandler.js';
import { ServiceFactory } from '../services/ServiceFactory.js';

export async function renderEcosystemDashboardPage(request, env, session, user, nonce, cssContent) {
  // 使用權限檢查中間件
  const authCheck = requireAdmin(user, request);
  if (authCheck) return authCheck;

  // 檢查數據庫連接
  const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
  if (!dbHealth.healthy) {
    console.error('[EcosystemDashboard] Database not available:', dbHealth.error);
    return ErrorResponseBuilder.buildDatabaseErrorPage({
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }

  // 初始化服務
  const serviceFactory = new ServiceFactory(env);
  const ecosystemService = serviceFactory.getService('ecosystemService');
  const aiAgentFactory = serviceFactory.getService('aiAgentFactory');

  // 獲取生態系統報告
  let ecosystemReport = null;
  let agentStats = null;
  try {
    ecosystemReport = await ecosystemService.getEcosystemReport({ days: 7 });
    agentStats = aiAgentFactory.getStats();
  } catch (error) {
    console.error('[EcosystemDashboard] Error fetching ecosystem data:', error);
    // 繼續渲染頁面，即使數據獲取失敗
  }

  const content = `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- 頁面標題 -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">生態系統監控</h1>
          <p class="mt-2 text-sm text-gray-600">
            監控網站生態健康狀況，確保「服務生命，讓世界更好更平衡」
          </p>
        </div>

        <!-- 總體分數卡片 -->
        <div class="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">生態系統總體分數</h2>
                <p class="mt-1 text-sm text-gray-500">基於用戶福祉、資源使用、社區健康的綜合評估</p>
              </div>
              <div class="text-right">
                <div class="text-5xl font-bold" id="overall-score" style="color: #10b981;">
                  ${ecosystemReport?.overallScore || '--'}
                </div>
                <div class="text-sm text-gray-500 mt-1">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 三個主要指標 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- 用戶福祉 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-medium text-gray-900">用戶福祉</h3>
                  <p class="text-sm text-gray-500">User Wellbeing</p>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-2xl font-semibold text-gray-900" id="wellbeing-score">
                  ${ecosystemReport?.wellbeing?.averageSatisfaction ? Math.round(ecosystemReport.wellbeing.averageSatisfaction) : '--'}
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  平均滿意度 (${ecosystemReport?.wellbeing?.period || 'N/A'})
                </div>
              </div>
            </div>
          </div>

          <!-- 資源使用 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-green-500 rounded-md flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-medium text-gray-900">資源使用</h3>
                  <p class="text-sm text-gray-500">Resource Usage</p>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-2xl font-semibold text-gray-900" id="resource-cost">
                  $${ecosystemReport?.resourceUsage?.totalCost?.toFixed(2) || '0.00'}
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  總成本 (${ecosystemReport?.resourceUsage?.period || 'N/A'})
                </div>
              </div>
            </div>
          </div>

          <!-- 社區健康 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 01 6 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-medium text-gray-900">社區健康</h3>
                  <p class="text-sm text-gray-500">Community Health</p>
                </div>
              </div>
              <div class="mt-4">
                <div class="text-2xl font-semibold text-gray-900" id="community-health-score">
                  ${ecosystemReport?.communityHealth?.healthScore || '--'}
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  健康分數 (${ecosystemReport?.communityHealth?.period || 'N/A'})
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 詳細數據 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- 用戶福祉詳情 -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">用戶福祉詳情</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均滿意度</span>
                  <span class="text-sm font-medium" id="avg-satisfaction">
                    ${ecosystemReport?.wellbeing?.averageSatisfaction?.toFixed(1) || '--'} / 100
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均參與度</span>
                  <span class="text-sm font-medium" id="avg-engagement">
                    ${ecosystemReport?.wellbeing?.averageEngagement?.toFixed(1) || '--'} / 100
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均體驗分數</span>
                  <span class="text-sm font-medium" id="avg-experience">
                    ${ecosystemReport?.wellbeing?.averageExperience?.toFixed(1) || '--'} / 100
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">追蹤次數</span>
                  <span class="text-sm font-medium" id="tracking-count">
                    ${ecosystemReport?.wellbeing?.trackingCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 資源使用詳情 -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">資源使用詳情</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">API 調用</span>
                  <span class="text-sm font-medium" id="api-calls">
                    ${ecosystemReport?.resourceUsage?.totalApiCalls?.toLocaleString() || '0'}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">AI 調用</span>
                  <span class="text-sm font-medium" id="ai-calls">
                    ${ecosystemReport?.resourceUsage?.totalAiCalls?.toLocaleString() || '0'}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均存儲</span>
                  <span class="text-sm font-medium" id="avg-storage">
                    ${ecosystemReport?.resourceUsage?.averageStorage?.toFixed(2) || '0'} MB
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">總帶寬</span>
                  <span class="text-sm font-medium" id="total-bandwidth">
                    ${ecosystemReport?.resourceUsage?.totalBandwidth?.toFixed(2) || '0'} MB
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">總成本</span>
                  <span class="text-sm font-medium text-red-600" id="total-cost">
                    $${ecosystemReport?.resourceUsage?.totalCost?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 社區健康詳情 -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">社區健康詳情</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均活躍用戶</span>
                  <span class="text-sm font-medium" id="avg-active-users">
                    ${ecosystemReport?.communityHealth?.averageActiveUsers?.toFixed(0) || '0'}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">總互動次數</span>
                  <span class="text-sm font-medium" id="total-interactions">
                    ${ecosystemReport?.communityHealth?.totalInteractions?.toLocaleString() || '0'}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均多樣性</span>
                  <span class="text-sm font-medium" id="avg-diversity">
                    ${ecosystemReport?.communityHealth?.averageDiversity?.toFixed(1) || '0'} / 100
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">平均參與率</span>
                  <span class="text-sm font-medium" id="avg-engagement-rate">
                    ${ecosystemReport?.communityHealth?.averageEngagementRate?.toFixed(1) || '0'}%
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">健康分數</span>
                  <span class="text-sm font-medium text-green-600" id="health-score">
                    ${ecosystemReport?.communityHealth?.healthScore || '0'} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Agent 統計 -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">AI Agent 統計</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">總 Agent 數</span>
                  <span class="text-sm font-medium" id="total-agents">
                    ${agentStats?.totalAgents || 0}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">總使用次數</span>
                  <span class="text-sm font-medium" id="total-usage">
                    ${agentStats?.totalUsage?.toLocaleString() || '0'}
                  </span>
                </div>
                <div class="mt-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-2">按類型統計</h4>
                  <div class="space-y-2" id="agents-by-type">
                    ${agentStats?.agentsByType ? Object.entries(agentStats.agentsByType).map(([type, data]) => `
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-500">${type}</span>
                        <span class="font-medium">${data.count} 個, ${data.totalUsage} 次使用</span>
                      </div>
                    `).join('') : '<div class="text-sm text-gray-500">暫無數據</div>'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 改進建議 -->
        <div class="bg-white shadow rounded-lg mb-8">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">改進建議</h3>
            <div class="space-y-3" id="recommendations">
              ${ecosystemReport?.recommendations?.length > 0 
                ? ecosystemReport.recommendations.map(rec => `
                  <div class="flex items-start p-3 rounded-md ${
                    rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }">
                    <div class="flex-shrink-0">
                      <span class="text-sm font-medium ${
                        rec.priority === 'high' ? 'text-red-800' :
                        rec.priority === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }">
                        ${rec.priority === 'high' ? '🔴 高' : rec.priority === 'medium' ? '🟡 中' : '🔵 低'}
                      </span>
                    </div>
                    <div class="ml-3 flex-1">
                      <p class="text-sm ${rec.priority === 'high' ? 'text-red-700' : rec.priority === 'medium' ? 'text-yellow-700' : 'text-blue-700'}">
                        ${rec.message}
                      </p>
                      <p class="text-xs ${rec.priority === 'high' ? 'text-red-600' : rec.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'} mt-1">
                        建議操作: ${rec.action}
                      </p>
                    </div>
                  </div>
                `).join('')
                : '<div class="text-sm text-gray-500">暫無建議</div>'
              }
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex space-x-4 mb-8">
          <button onclick="refreshEcosystemReport()" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            刷新報告
          </button>
          <a href="/admin/dashboard" class="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 text-center">
            返回管理後台
          </a>
        </div>
      </div>
    </div>

    <script nonce="${nonce}">
      // API 調用函數
      async function apiCall(url, method = 'GET', body = null) {
        try {
          const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          };
          if (body) {
            options.body = JSON.stringify(body);
          }
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }
          return await response.json();
        } catch (error) {
          console.error('API call failed:', error);
          throw error;
        }
      }

      // 刷新生態系統報告
      async function refreshEcosystemReport() {
        try {
          const report = await apiCall('/api/admin/ecosystem/report?days=7');
          
          // 更新總體分數
          document.getElementById('overall-score').textContent = report.overallScore || '--';
          
          // 更新用戶福祉
          document.getElementById('wellbeing-score').textContent = 
            report.wellbeing?.averageSatisfaction ? Math.round(report.wellbeing.averageSatisfaction) : '--';
          document.getElementById('avg-satisfaction').textContent = 
            \`\${report.wellbeing?.averageSatisfaction?.toFixed(1) || '--'} / 100\`;
          document.getElementById('avg-engagement').textContent = 
            \`\${report.wellbeing?.averageEngagement?.toFixed(1) || '--'} / 100\`;
          document.getElementById('avg-experience').textContent = 
            \`\${report.wellbeing?.averageExperience?.toFixed(1) || '--'} / 100\`;
          document.getElementById('tracking-count').textContent = 
            report.wellbeing?.trackingCount || 0;
          
          // 更新資源使用
          document.getElementById('resource-cost').textContent = 
            \`$\${report.resourceUsage?.totalCost?.toFixed(2) || '0.00'}\`;
          document.getElementById('api-calls').textContent = 
            report.resourceUsage?.totalApiCalls?.toLocaleString() || '0';
          document.getElementById('ai-calls').textContent = 
            report.resourceUsage?.totalAiCalls?.toLocaleString() || '0';
          document.getElementById('avg-storage').textContent = 
            \`\${report.resourceUsage?.averageStorage?.toFixed(2) || '0'} MB\`;
          document.getElementById('total-bandwidth').textContent = 
            \`\${report.resourceUsage?.totalBandwidth?.toFixed(2) || '0'} MB\`;
          document.getElementById('total-cost').textContent = 
            \`$\${report.resourceUsage?.totalCost?.toFixed(2) || '0.00'}\`;
          
          // 更新社區健康
          document.getElementById('community-health-score').textContent = 
            report.communityHealth?.healthScore || '--';
          document.getElementById('avg-active-users').textContent = 
            report.communityHealth?.averageActiveUsers?.toFixed(0) || '0';
          document.getElementById('total-interactions').textContent = 
            report.communityHealth?.totalInteractions?.toLocaleString() || '0';
          document.getElementById('avg-diversity').textContent = 
            \`\${report.communityHealth?.averageDiversity?.toFixed(1) || '0'} / 100\`;
          document.getElementById('avg-engagement-rate').textContent = 
            \`\${report.communityHealth?.averageEngagementRate?.toFixed(1) || '0'}%\`;
          document.getElementById('health-score').textContent = 
            \`\${report.communityHealth?.healthScore || '0'} / 100\`;
          
          // 更新改進建議
          const recommendationsDiv = document.getElementById('recommendations');
          if (report.recommendations && report.recommendations.length > 0) {
            recommendationsDiv.innerHTML = report.recommendations.map(rec => \`
              <div class="flex items-start p-3 rounded-md \${
                rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }">
                <div class="flex-shrink-0">
                  <span class="text-sm font-medium \${
                    rec.priority === 'high' ? 'text-red-800' :
                    rec.priority === 'medium' ? 'text-yellow-800' :
                    'text-blue-800'
                  }">
                    \${rec.priority === 'high' ? '🔴 高' : rec.priority === 'medium' ? '🟡 中' : '🔵 低'}
                  </span>
                </div>
                <div class="ml-3 flex-1">
                  <p class="text-sm \${
                    rec.priority === 'high' ? 'text-red-700' :
                    rec.priority === 'medium' ? 'text-yellow-700' :
                    'text-blue-700'
                  }">
                    \${rec.message}
                  </p>
                  <p class="text-xs \${
                    rec.priority === 'high' ? 'text-red-600' :
                    rec.priority === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  } mt-1">
                    建議操作: \${rec.action}
                  </p>
                </div>
              </div>
            \`).join('');
          } else {
            recommendationsDiv.innerHTML = '<div class="text-sm text-gray-500">暫無建議</div>';
          }
          
          alert('報告已刷新！');
        } catch (error) {
          console.error('刷新報告失敗:', error);
          alert('刷新失敗: ' + error.message);
        }
      }

      // 定期自動刷新（每5分鐘）
      setInterval(() => {
        refreshEcosystemReport();
      }, 300000);
    </script>
  `;

  return new Response(pageTemplate({
    title: '生態系統監控 - 管理後台',
    content,
    user,
    nonce,
    cssContent: cssContent + `
      /* 生態系統監控頁面特定樣式 */
      .bg-gray-50 { background-color: #f9fafb; }
    `,
    currentPath: '/admin/ecosystem'
  }), {
    headers: {
      'Content-Type': 'text/html;charset=utf-8'
    }
  });
}

