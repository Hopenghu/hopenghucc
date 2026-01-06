/**
 * Admin Dashboard Page Templates
 * 管理員儀表板頁面模板
 * 
 * 將 HTML 模板從 AdminDashboard.js 中分離出來，提高可維護性
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
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">管理員儀表板</h1>
      <p class="mt-2 text-gray-600">系統狀態監控和管理</p>
    </div>
  `;
}

/**
 * 渲染系統狀態概覽卡片
 */
export function renderSystemStatusCards() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">系統健康度</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900" id="system-health-score">--</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600" id="system-health-status">
                    <span class="sr-only">狀態</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">圖片緩存</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900" id="image-cache-count">--</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <span class="sr-only">有效圖片</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">API 使用量</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900" id="api-usage">--</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <span class="sr-only">今日請求</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">安全分數</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900" id="security-score">--</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    <span class="sr-only">分數</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染功能卡片
 */
export function renderFeatureCards() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 備份管理 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">資料庫備份</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">備份狀態</span>
              <span class="text-sm font-medium" id="backup-status">檢查中...</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">最後備份</span>
              <span class="text-sm font-medium" id="last-backup">--</span>
            </div>
            <div class="flex space-x-2">
              <button onclick="createBackup()" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                創建備份
              </button>
              <button onclick="checkBackupHealth()" class="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                檢查健康狀態
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 速率限制管理 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">API 速率限制</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Google Places API</span>
              <span class="text-sm font-medium" id="google-api-usage">檢查中...</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">總請求數 (24h)</span>
              <span class="text-sm font-medium" id="total-requests">--</span>
            </div>
            <div class="flex space-x-2">
              <button onclick="checkRateLimitStats()" class="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                查看統計
              </button>
              <button onclick="cleanupRateLimitLogs()" class="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                清理日誌
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全審計 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">安全審計</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">安全分數</span>
              <span class="text-sm font-medium" id="audit-score">--</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">關鍵問題</span>
              <span class="text-sm font-medium" id="critical-issues">--</span>
            </div>
            <div class="flex space-x-2">
              <button onclick="runSecurityAudit()" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                執行審計
              </button>
              <button onclick="getSecurityStatus()" class="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700">
                查看狀態
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 系統監控 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">系統監控</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">資料庫狀態</span>
              <span class="text-sm font-medium" id="db-status">檢查中...</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">圖片錯誤</span>
              <span class="text-sm font-medium" id="image-errors">--</span>
            </div>
            <div class="flex space-x-2">
              <button onclick="refreshSystemStatus()" class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                刷新狀態
              </button>
              <button onclick="refreshImageStats()" class="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700">
                圖片統計
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 商家驗證管理 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">商家驗證</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">待審核申請</span>
              <span class="text-sm font-medium" id="pending-verifications-count">檢查中...</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">驗證狀態</span>
              <span class="text-sm font-medium" id="verification-status">--</span>
            </div>
            <div class="flex space-x-2">
              <a href="/admin/verifications" class="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 text-center">
                審核驗證申請
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 生態系統監控 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">生態系統監控</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">總體分數</span>
              <span class="text-sm font-medium" id="ecosystem-overall-score">--</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">狀態</span>
              <span class="text-sm font-medium" id="ecosystem-status">檢查中...</span>
            </div>
            <div class="flex space-x-2">
              <a href="/admin/ecosystem" class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 text-center">
                查看詳細報告
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染系統日誌區域
 */
export function renderSystemLogSection() {
  return `
    <div class="mt-8 bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">系統日誌</h3>
        <div class="bg-gray-50 rounded-md p-4">
          <pre id="system-log" class="text-sm text-gray-700 whitespace-pre-wrap">載入中...</pre>
        </div>
      </div>
    </div>
  `;
}

