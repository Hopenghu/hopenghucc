/**
 * Business Verification Admin Page Templates
 * 商家驗證管理頁面模板
 * 
 * 將 HTML 模板從 BusinessVerificationAdmin.js 中分離出來，提高可維護性
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
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">商家驗證審核</h1>
          <p class="mt-2 text-gray-600">審核和管理商家驗證申請</p>
        </div>
        <a href="/admin" class="text-blue-600 hover:text-blue-800 text-sm">
          ← 返回管理員儀表板
        </a>
      </div>
    </div>
  `;
}

/**
 * 渲染統計卡片
 */
export function renderStatisticsCards(totalPending) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- 待審核卡片 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">待審核</dt>
                <dd class="text-2xl font-semibold text-gray-900">${totalPending}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 已批准卡片 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">已批准</dt>
                <dd class="text-2xl font-semibold text-gray-900" id="approved-count">-</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 已拒絕卡片 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">已拒絕</dt>
                <dd class="text-2xl font-semibold text-gray-900" id="rejected-count">-</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染標籤頁導航
 */
export function renderTabNavigation(totalPending) {
  return `
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button onclick="showTab('pending')" id="tab-pending" class="tab-button active px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
            待審核 (${totalPending})
          </button>
          <button onclick="showTab('all')" id="tab-all" class="tab-button px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            全部記錄
          </button>
        </nav>
      </div>
  `;
}

/**
 * 渲染待審核驗證卡片
 */
export function renderVerificationCard(verification) {
  const safeValue = (val, def = '') => {
    if (val == null) return def;
    return escapeHtml(String(val));
  };

  const locationName = safeValue(verification.location_name, '未知地點');
  const verificationId = safeValue(verification.id, '');
  const userName = safeValue(verification.user_name || verification.user_email, '未知用戶');
  const address = safeValue(verification.location_address, '無地址資訊');
  const placeId = safeValue(verification.google_place_id, '無');
  const requestedAt = verification.requested_at 
    ? new Date(verification.requested_at).toLocaleString('zh-TW') 
    : '未知時間';

  return `
    <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow" data-verification-id="${verificationId}">
      <div class="flex items-start gap-3">
        <input type="checkbox" class="verification-checkbox mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500" data-verification-id="${verificationId}" onchange="updateBatchActions()">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-3">
            <h3 class="text-lg font-semibold text-gray-900">${locationName}</h3>
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
              待審核
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-500 mb-1">申請人</p>
              <p class="text-sm font-medium text-gray-900">${userName}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-1">申請時間</p>
              <p class="text-sm font-medium text-gray-900">${requestedAt}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-1">地點地址</p>
              <p class="text-sm font-medium text-gray-900">${address}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-1">Google Place ID</p>
              <p class="text-sm font-medium text-gray-900 font-mono">${placeId}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button 
          onclick="approveVerification('${verificationId}', '${locationName}')"
          class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          ✓ 批准
        </button>
        <button 
          onclick="rejectVerification('${verificationId}', '${locationName}')"
          class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          ✗ 拒絕
        </button>
        <button 
          onclick="viewVerificationDetails('${verificationId}')"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          查看詳情
        </button>
      </div>
    </div>
  `;
}

/**
 * 渲染空狀態（無待審核申請）
 */
export function renderEmptyState() {
  return `
    <div class="text-center text-gray-500 py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <p class="mt-4 text-lg font-medium">目前沒有待審核的申請</p>
      <p class="mt-2 text-sm">所有驗證申請都已處理完成</p>
    </div>
  `;
}

/**
 * 渲染批量操作按鈕區域
 */
export function renderBatchActions() {
  return `
    <div id="batch-actions" class="hidden flex items-center gap-2">
      <span id="selected-count" class="text-sm text-gray-600">已選擇 0 項</span>
      <button onclick="showBatchApproveModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
        批量批准
      </button>
      <button onclick="showBatchRejectModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
        批量拒絕
      </button>
    </div>
  `;
}

/**
 * 渲染待審核面板標題
 */
export function renderPendingPanelHeader() {
  return `
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">待審核申請</h2>
        <p class="text-sm text-gray-600 mt-1">請仔細審核每個申請，確保商家擁有權的真實性</p>
      </div>
      ${renderBatchActions()}
    </div>
  `;
}

/**
 * 渲染全部記錄面板標題和搜尋框
 */
export function renderAllRecordsPanelHeader() {
  return `
    <div class="mb-4">
      <h2 class="text-xl font-semibold text-gray-900">全部驗證記錄</h2>
      <p class="text-sm text-gray-600 mt-1">查看所有驗證申請的歷史記錄</p>
    </div>
    
    <div class="mb-4 flex space-x-2">
      <select id="filter-status" class="border border-gray-300 rounded px-3 py-2 text-sm" onchange="loadAllVerifications()">
        <option value="">所有狀態</option>
        <option value="pending">待審核</option>
        <option value="approved">已批准</option>
        <option value="rejected">已拒絕</option>
        <option value="cancelled">已取消</option>
      </select>
      <input 
        type="text" 
        id="search-all-verifications" 
        placeholder="搜尋商家名稱、申請人 Email 或地址..." 
        class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        onkeyup="handleSearchInput(event)"
      >
      <button 
        id="clear-search-btn"
        class="hidden px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        onclick="clearSearch()"
      >
        清除
      </button>
    </div>
  `;
}

