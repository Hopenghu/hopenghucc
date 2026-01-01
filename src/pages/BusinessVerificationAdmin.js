// Business Verification Admin Page - 商家驗證管理頁面
// 管理員審核商家驗證申請

import { pageTemplate } from '../components/layout.js';
import { BusinessVerificationService } from '../services/BusinessVerificationService.js';
import { requireAdmin } from '../middleware/auth.js';
import { ErrorResponseBuilder, ServiceHealthChecker } from '../utils/errorHandler.js';
import {
  renderPageHeader,
  renderStatisticsCards,
  renderTabNavigation,
  renderVerificationCard,
  renderEmptyState,
  renderPendingPanelHeader,
  renderAllRecordsPanelHeader
} from '../templates/businessVerificationAdmin.js';

export async function renderBusinessVerificationAdminPage(request, env, session, user, nonce, cssContent) {
  // 使用權限檢查中間件
  const authCheck = requireAdmin(user, request);
  if (authCheck) return authCheck;

  try {
    // 檢查數據庫連接（使用健康檢查工具）
    const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
    if (!dbHealth.healthy) {
      console.error('[BusinessVerificationAdmin] Database not available:', dbHealth.error);
      return ErrorResponseBuilder.buildDatabaseErrorPage({
        user: user,
        nonce: nonce,
        cssContent: cssContent
      });
    }

    // 使用注入的服務實例或創建新實例
    const verificationService = env.services?.businessVerification || new BusinessVerificationService(env.DB);

    // 獲取待審核列表
    let pendingVerifications = [];
    let totalPending = 0;
    try {
      const result = await verificationService.getPendingVerifications(50, 0);
      pendingVerifications = result.verifications || [];
      totalPending = result.total || 0;
    } catch (error) {
      console.error('[BusinessVerificationAdmin] Error loading pending verifications:', error);
      // 如果表不存在，返回空列表
      if (error.message && error.message.includes('no such table')) {
        console.warn('[BusinessVerificationAdmin] business_verifications table does not exist. Please run migration 0032.');
        pendingVerifications = [];
        totalPending = 0;
      } else {
        // 其他錯誤，重新拋出
        throw error;
      }
    }

    const content = `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        ${renderPageHeader()}
        ${renderStatisticsCards(totalPending)}
        ${renderTabNavigation(totalPending)}

          <!-- 待審核面板 -->
          <div id="panel-pending" class="tab-panel p-6">
            ${renderPendingPanelHeader()}
            
            <div id="pending-verifications-list" class="space-y-4">
              ${(Array.isArray(pendingVerifications) && pendingVerifications.length === 0) 
                ? renderEmptyState()
                : (Array.isArray(pendingVerifications) 
                  ? pendingVerifications.map(v => renderVerificationCard(v)).join('')
                  : '')}
            </div>
          </div>

          <!-- 全部記錄面板 -->
          <div id="panel-all" class="tab-panel hidden p-6">
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
                class="border border-gray-300 rounded px-3 py-2 text-sm flex-1" 
                onkeyup="handleSearchInput(event)"
                onchange="loadAllVerifications()"
              >
              <button 
                onclick="clearSearch()" 
                id="clear-search-btn"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm hidden"
              >
                清除
              </button>
            </div>
            
            <div id="all-verifications-list" class="space-y-4">
              <div class="text-center text-gray-500 py-8">載入中...</div>
            </div>
            
            <!-- 分頁控制 -->
            <div id="verifications-pagination" class="mt-6 flex justify-center space-x-2 hidden">
                 <button onclick="changePage(-1)" id="prev-page-btn" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">上一頁</button>
                 <span id="page-info" class="px-3 py-1 text-gray-600">第 1 頁</span>
                 <button onclick="changePage(1)" id="next-page-btn" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">下一頁</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批准模態框 -->
    <div id="approve-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-semibold mb-4">批准驗證申請</h3>
        <p class="text-gray-600 mb-4">確定要批准 <span id="approve-location-name" class="font-semibold"></span> 的驗證申請嗎？</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">備註（可選）</label>
          <textarea id="approve-notes" rows="3" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="添加批准備註..."></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button onclick="closeApproveModal()" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            取消
          </button>
          <button onclick="confirmApprove()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            確認批准
          </button>
        </div>
      </div>
    </div>

    <!-- 拒絕模態框 -->
    <div id="reject-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-semibold mb-4">拒絕驗證申請</h3>
        <p class="text-gray-600 mb-4">確定要拒絕 <span id="reject-location-name" class="font-semibold"></span> 的驗證申請嗎？</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">拒絕原因 <span class="text-red-500">*</span></label>
          <textarea id="reject-reason" rows="3" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="請說明拒絕原因..."></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button onclick="closeRejectModal()" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            取消
          </button>
          <button onclick="confirmReject()" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            確認拒絕
          </button>
        </div>
      </div>
    </div>

    <!-- 批量批准模態框 -->
    <div id="batch-approve-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-semibold mb-4">批量批准驗證申請</h3>
        <p class="text-gray-600 mb-4">確定要批准 <span id="batch-approve-count" class="font-semibold">0</span> 個驗證申請嗎？</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">備註（可選）</label>
          <textarea id="batch-approve-notes" rows="3" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="添加批准備註..."></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button onclick="closeBatchApproveModal()" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            取消
          </button>
          <button onclick="confirmBatchApprove()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            確認批准
          </button>
        </div>
      </div>
    </div>

    <!-- 批量拒絕模態框 -->
    <div id="batch-reject-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-semibold mb-4">批量拒絕驗證申請</h3>
        <p class="text-gray-600 mb-4">確定要拒絕 <span id="batch-reject-count" class="font-semibold">0</span> 個驗證申請嗎？</p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">拒絕原因 <span class="text-red-500">*</span></label>
          <textarea id="batch-reject-reason" rows="3" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="請說明拒絕原因..."></textarea>
        </div>
        <div class="flex justify-end space-x-2">
          <button onclick="closeBatchRejectModal()" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            取消
          </button>
          <button onclick="confirmBatchReject()" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            確認拒絕
          </button>
        </div>
      </div>
    </div>

    <!-- 詳情模態框 -->
    <div id="details-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">驗證申請詳情</h3>
          <button onclick="closeDetailsModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div id="verification-details-content" class="space-y-4">
          <div class="text-center text-gray-500 py-8">載入中...</div>
        </div>
      </div>
    </div>

    <script nonce="${nonce}">
      let currentTab = 'pending';
      let currentVerificationId = null;
      let currentPage = 1;
      let totalPages = 1;
      const pageSize = 20;

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
        if (tabName === 'all') {
          loadAllVerifications();
        }
      }

      // 批准驗證
      function approveVerification(verificationId, locationName) {
        currentVerificationId = verificationId;
        document.getElementById('approve-location-name').textContent = locationName;
        document.getElementById('approve-notes').value = '';
        document.getElementById('approve-modal').classList.remove('hidden');
      }

      function closeApproveModal() {
        document.getElementById('approve-modal').classList.add('hidden');
        currentVerificationId = null;
      }

      async function confirmApprove() {
        if (!currentVerificationId) return;

        const notes = document.getElementById('approve-notes').value.trim();
        
        try {
          const response = await fetch('/api/business/verify/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              verification_id: currentVerificationId,
              notes: notes || null
            })
          });

          const data = await response.json();

          if (data.success) {
            if (window.showToast) {
              window.showToast('驗證已批准', 'success');
            }
            closeApproveModal();
            // 重新載入頁面
            setTimeout(() => location.reload(), 1000);
          } else {
            if (window.showToast) {
              window.showToast('批准失敗：' + (data.error || data.message || '未知錯誤'), 'error');
            } else {
              alert('批准失敗：' + (data.error || data.message || '未知錯誤'));
            }
          }
        } catch (error) {
          console.error('批准驗證失敗:', error);
          if (window.showToast) {
            window.showToast('批准失敗，請稍後再試', 'error');
          } else {
            alert('批准失敗，請稍後再試');
          }
        }
      }

      // 拒絕驗證
      function rejectVerification(verificationId, locationName) {
        currentVerificationId = verificationId;
        document.getElementById('reject-location-name').textContent = locationName;
        document.getElementById('reject-reason').value = '';
        document.getElementById('reject-modal').classList.remove('hidden');
      }

      function closeRejectModal() {
        document.getElementById('reject-modal').classList.add('hidden');
        currentVerificationId = null;
      }

      async function confirmReject() {
        if (!currentVerificationId) return;

        const reason = document.getElementById('reject-reason').value.trim();
        if (!reason) {
          if (window.showToast) {
            window.showToast('請填寫拒絕原因', 'warning');
          } else {
            alert('請填寫拒絕原因');
          }
          return;
        }

        try {
          const response = await fetch('/api/business/verify/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              verification_id: currentVerificationId,
              rejection_reason: reason
            })
          });

          const data = await response.json();

          if (data.success) {
            if (window.showToast) {
              window.showToast('驗證已拒絕', 'success');
            }
            closeRejectModal();
            // 重新載入頁面
            setTimeout(() => location.reload(), 1000);
          } else {
            if (window.showToast) {
              window.showToast('拒絕失敗：' + (data.error || data.message || '未知錯誤'), 'error');
            } else {
              alert('拒絕失敗：' + (data.error || data.message || '未知錯誤'));
            }
          }
        } catch (error) {
          console.error('拒絕驗證失敗:', error);
          if (window.showToast) {
            window.showToast('拒絕失敗，請稍後再試', 'error');
          } else {
            alert('拒絕失敗，請稍後再試');
          }
        }
      }

      // 查看詳情
      async function viewVerificationDetails(verificationId) {
        const contentEl = document.getElementById('verification-details-content');
        contentEl.innerHTML = '<div class="text-center text-gray-500 py-8">載入中...</div>';
        document.getElementById('details-modal').classList.remove('hidden');

        try {
          const response = await fetch('/api/business/verify/' + verificationId + '/details', {
            credentials: 'include'
          });

          const data = await response.json();

          if (data.success && data.verification) {
            const v = data.verification;
            
            // 使用 DOM 操作而非 innerHTML 模板字符串，避免 CSP 問題
            contentEl.innerHTML = '';
            const container = document.createElement('div');
            container.className = 'space-y-4';
            
            // 地點名稱
            const nameDiv = document.createElement('div');
            nameDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">地點名稱</h4><p class="text-base font-semibold text-gray-900">' + escapeHtml(v.location_name || '未知地點') + '</p>';
            container.appendChild(nameDiv);
            
            // 地點地址（如果有座標，添加地圖連結）
            const addressDiv = document.createElement('div');
            let addressContent = escapeHtml(v.location_address || '無地址資訊');
            if (v.location_latitude && v.location_longitude) {
              const mapsUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(v.location_latitude + ',' + v.location_longitude);
              addressContent += ' <a href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 text-sm ml-2">📍 在地圖查看</a>';
            }
            addressDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">地點地址</h4><p class="text-base text-gray-900">' + addressContent + '</p>';
            container.appendChild(addressDiv);
            
            // 地點電話（如果有）
            if (v.location_phone) {
              const phoneDiv = document.createElement('div');
              phoneDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">電話</h4><p class="text-base text-gray-900"><a href="tel:' + escapeHtml(v.location_phone) + '" class="text-blue-600 hover:text-blue-800">' + escapeHtml(v.location_phone) + '</a></p>';
              container.appendChild(phoneDiv);
            }
            
            // 地點網站（如果有）
            if (v.location_website) {
              const websiteDiv = document.createElement('div');
              websiteDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">網站</h4><p class="text-base text-gray-900"><a href="' + escapeHtml(v.location_website) + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 break-all">' + escapeHtml(v.location_website) + '</a></p>';
              container.appendChild(websiteDiv);
            }
            
            // 申請人
            const userDiv = document.createElement('div');
            userDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">申請人</h4><p class="text-base text-gray-900">' + escapeHtml(v.user_name || v.user_email || '未知用戶') + '</p>';
            container.appendChild(userDiv);
            
            // 申請時間
            const timeDiv = document.createElement('div');
            timeDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">申請時間</h4><p class="text-base text-gray-900">' + escapeHtml(new Date(v.requested_at).toLocaleString('zh-TW')) + '</p>';
            container.appendChild(timeDiv);
            
            // 狀態
            const statusDiv = document.createElement('div');
            const statusClass = v.status === 'approved' ? 'bg-green-100 text-green-800' :
                              v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              v.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800';
            const statusText = v.status === 'approved' ? '已批准' :
                              v.status === 'rejected' ? '已拒絕' :
                              v.status === 'cancelled' ? '已取消' :
                              '待審核';
            statusDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">狀態</h4><span class="px-2 py-1 text-xs font-medium rounded-full ' + statusClass + '">' + escapeHtml(statusText) + '</span>';
            container.appendChild(statusDiv);
            
            // Google Place ID 和 Maps 連結
            const placeId = v.google_place_id || v.location_google_place_id;
            if (placeId) {
              const placeIdDiv = document.createElement('div');
              const googleMapsUrl = 'https://www.google.com/maps/place/?q=place_id:' + encodeURIComponent(placeId);
              placeIdDiv.innerHTML = 
                '<h4 class="text-sm font-medium text-gray-500 mb-1">Google Place ID</h4>' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                  '<p class="text-base text-gray-900 font-mono text-sm flex-1 min-w-0 break-all">' + escapeHtml(placeId) + '</p>' +
                  '<a href="' + googleMapsUrl + '" target="_blank" rel="noopener noreferrer" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap">在 Google Maps 查看</a>' +
                '</div>';
              container.appendChild(placeIdDiv);
            }
            
            // 操作按鈕區域
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3';
            
            // 地點詳情按鈕（如果有 location_id）
            if (v.location_id) {
              const locationDetailBtn = document.createElement('a');
              locationDetailBtn.href = '/location/' + escapeHtml(v.location_id);
              locationDetailBtn.target = '_blank';
              locationDetailBtn.className = 'inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium';
              locationDetailBtn.innerHTML = 
                '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' +
                '</svg>' +
                '查看地點詳情';
              actionsDiv.appendChild(locationDetailBtn);
            }
            
            // 如果有任何操作按鈕，添加到容器
            if (actionsDiv.children.length > 0) {
              container.appendChild(actionsDiv);
            }
            
            // 審核時間
            if (v.verified_at) {
              const verifiedAtDiv = document.createElement('div');
              verifiedAtDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">審核時間</h4><p class="text-base text-gray-900">' + escapeHtml(new Date(v.verified_at).toLocaleString('zh-TW')) + '</p>';
              container.appendChild(verifiedAtDiv);
            }
            
            // 審核人
            if (v.verified_by_name || v.verified_by_email) {
              const verifiedByDiv = document.createElement('div');
              verifiedByDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">審核人</h4><p class="text-base text-gray-900">' + escapeHtml(v.verified_by_name || v.verified_by_email) + '</p>';
              container.appendChild(verifiedByDiv);
            }
            
            // 備註
            if (v.notes) {
              const notesDiv = document.createElement('div');
              notesDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">備註</h4><p class="text-base text-gray-900">' + escapeHtml(v.notes) + '</p>';
              container.appendChild(notesDiv);
            }
            
            // 拒絕原因
            if (v.rejection_reason) {
              const reasonDiv = document.createElement('div');
              reasonDiv.innerHTML = '<h4 class="text-sm font-medium text-gray-500 mb-1">拒絕原因</h4><p class="text-base text-red-600">' + escapeHtml(v.rejection_reason) + '</p>';
              container.appendChild(reasonDiv);
            }
            
            contentEl.appendChild(container);
          } else {
            contentEl.innerHTML = '<div class="text-center text-red-500 py-8">載入失敗</div>';
          }
        } catch (error) {
          console.error('載入詳情失敗:', error);
          contentEl.innerHTML = '<div class="text-center text-red-500 py-8">載入失敗：' + escapeHtml(error.message) + '</div>';
        }
      }
      
      // HTML 轉義函數
      function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function closeDetailsModal() {
        document.getElementById('details-modal').classList.add('hidden');
      }

      // 高亮搜尋關鍵字
      function highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return escapeHtml(text);
        const escapedText = escapeHtml(text);
        // 轉義正則表達式特殊字符
        let escapedSearch = escapeHtml(searchTerm);
        const specialChars = ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'];
        for (let i = 0; i < specialChars.length; i++) {
          const char = specialChars[i];
          escapedSearch = escapedSearch.split(char).join('\\' + char);
        }
        try {
          const regex = new RegExp('(' + escapedSearch + ')', 'gi');
          return escapedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
        } catch (e) {
          // 如果正則表達式構建失敗，返回原始文本
          return escapedText;
        }
      }

      // 處理搜尋輸入（防抖）
      let searchTimeout = null;
      function handleSearchInput(event) {
        clearTimeout(searchTimeout);
        const searchInput = event.target;
        const clearBtn = document.getElementById('clear-search-btn');
        
        // 顯示/隱藏清除按鈕
        if (searchInput.value.trim()) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
        
        // 防抖：500ms 後執行搜尋
        searchTimeout = setTimeout(() => {
          currentPage = 1; // 搜尋時重置到第一頁
          loadAllVerifications(1);
        }, 500);
      }

      // 清除搜尋
      function clearSearch() {
        document.getElementById('search-all-verifications').value = '';
        document.getElementById('clear-search-btn').classList.add('hidden');
        currentPage = 1;
        loadAllVerifications(1);
      }

      // 載入全部驗證記錄
      async function loadAllVerifications(page = 1) {
        const status = document.getElementById('filter-status')?.value || '';
        const search = document.getElementById('search-all-verifications')?.value?.trim() || '';
        const container = document.getElementById('all-verifications-list');
        const pagination = document.getElementById('verifications-pagination');
        
        // 只有當不是翻頁操作時才重置加載指示器，優化體驗
        if (page === 1 || container.innerHTML.includes('載入中')) {
           container.innerHTML = '<div class="text-center text-gray-500 py-8">載入中...</div>';
        }

        try {
          // 計算偏移量
          const offset = (page - 1) * pageSize;
          
          let url = '/api/business/verify/all?limit=' + pageSize + '&offset=' + offset;
          if (status) {
            url += '&status=' + encodeURIComponent(status);
          }
          if (search) {
            url += '&search=' + encodeURIComponent(search);
          }

          const response = await fetch(url, { credentials: 'include' });
          const data = await response.json();

          if (data.success) {
            const verifications = data.verifications;
            const total = data.total;
            
            // 更新分頁狀態
            currentPage = page;
            totalPages = Math.ceil(total / pageSize);
            
            updatePaginationUI(total);
            
            if (verifications.length === 0) {
              const noResultsMsg = search 
                ? '<div class="text-center text-gray-500 py-8"><p class="text-lg font-medium">沒有找到相關記錄</p><p class="text-sm mt-2">請嘗試調整搜尋條件或篩選器</p></div>'
                : '<div class="text-center text-gray-500 py-8">沒有找到相關記錄</div>';
              container.innerHTML = noResultsMsg;
              return;
            }

            // 獲取搜尋關鍵字用於高亮
            const searchTerm = search || '';

            container.innerHTML = verifications.map(v => {
              const statusClass = v.status === 'approved' ? 'bg-green-100 text-green-800' :
                                v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                v.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800';
              const statusText = v.status === 'approved' ? '已批准' :
                                v.status === 'rejected' ? '已拒絕' :
                                v.status === 'cancelled' ? '已取消' :
                                '待審核';
              
              return '<div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">' +
                '<div class="flex items-start justify-between">' +
                  '<div class="flex-1">' +
                    '<div class="flex items-center gap-3 mb-2">' +
                      '<h3 class="text-base font-semibold text-gray-900">' + highlightSearchTerm(v.location_name || '未知地點', searchTerm) + '</h3>' +
                      '<span class="px-2 py-0.5 text-xs font-medium rounded-full ' + statusClass + '">' +
                        statusText +
                      '</span>' +
                    '</div>' +
                    '<div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">' +
                      '<div><span class="text-gray-500">申請人：</span> <span class="text-gray-900">' + highlightSearchTerm(v.user_name || v.user_email || '未知', searchTerm) + '</span></div>' +
                      '<div><span class="text-gray-500">時間：</span> <span class="text-gray-900">' + new Date(v.requested_at).toLocaleString('zh-TW') + '</span></div>' +
                      '<div><span class="text-gray-500">審核人：</span> <span class="text-gray-900">' + escapeHtml(v.verified_by_name || v.verified_by_email || '-') + '</span></div>' +
                    '</div>' +
                    (v.location_address ? '<div class="mt-2 text-sm text-gray-600"><span class="text-gray-500">地址：</span> <span>' + highlightSearchTerm(v.location_address, searchTerm) + '</span></div>' : '') +
                  '</div>' +
                  '<button onclick="viewVerificationDetails(\\'' + v.id + '\\')" class="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium">詳情</button>' +
                '</div>' +
              '</div>';
            }).join('');
            
          } else {
            container.innerHTML = '<div class="text-center text-red-500 py-8">載入失敗：' + (data.error || '未知錯誤') + '</div>';
          }
        } catch (error) {
          console.error('載入驗證記錄失敗:', error);
          container.innerHTML = '<div class="text-center text-red-500 py-8">載入失敗請稍後再試</div>';
        }
      }
      
      // 更新分頁 UI
      function updatePaginationUI(total) {
        const pagination = document.getElementById('verifications-pagination');
        if (total <= pageSize) {
            pagination.classList.add('hidden');
        } else {
            pagination.classList.remove('hidden');
            document.getElementById('page-info').textContent = '第 ' + currentPage + ' / ' + totalPages + ' 頁';
            document.getElementById('prev-page-btn').disabled = currentPage <= 1;
            document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
        }
      }
      
      // 換頁
      function changePage(delta) {
        const newPage = currentPage + delta;
        if (newPage >= 1 && newPage <= totalPages) {
            loadAllVerifications(newPage);
        }
      }

      // 批量操作相關函數
      function updateBatchActions() {
        const checkboxes = document.querySelectorAll('.verification-checkbox:checked');
        const count = checkboxes.length;
        const batchActions = document.getElementById('batch-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (count > 0) {
          batchActions.classList.remove('hidden');
          selectedCount.textContent = '已選擇 ' + count + ' 項';
        } else {
          batchActions.classList.add('hidden');
        }
      }

      function getSelectedVerificationIds() {
        const checkboxes = document.querySelectorAll('.verification-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.dataset.verificationId);
      }

      function showBatchApproveModal() {
        const ids = getSelectedVerificationIds();
        if (ids.length === 0) {
          if (window.showToast) {
            window.showToast('請選擇至少一個驗證申請', 'warning');
          }
          return;
        }
        document.getElementById('batch-approve-count').textContent = ids.length;
        document.getElementById('batch-approve-notes').value = '';
        document.getElementById('batch-approve-modal').classList.remove('hidden');
      }

      function closeBatchApproveModal() {
        document.getElementById('batch-approve-modal').classList.add('hidden');
      }

      async function confirmBatchApprove() {
        const ids = getSelectedVerificationIds();
        if (ids.length === 0) return;

        const notes = document.getElementById('batch-approve-notes').value.trim();
        
        try {
          const response = await fetch('/api/business/verify/batch-approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              verification_ids: ids,
              notes: notes || null
            })
          });

          const data = await response.json();

          if (data.success) {
            if (window.showToast) {
              window.showToast(data.message || '批量批准成功', 'success');
            }
            closeBatchApproveModal();
            // 清除所有選中狀態
            document.querySelectorAll('.verification-checkbox').forEach(cb => cb.checked = false);
            updateBatchActions();
            // 重新載入頁面
            setTimeout(() => location.reload(), 1000);
          } else {
            if (window.showToast) {
              window.showToast('批量批准失敗：' + (data.error || data.message || '未知錯誤'), 'error');
            }
          }
        } catch (error) {
          console.error('批量批准失敗:', error);
          if (window.showToast) {
            window.showToast('批量批准失敗，請稍後再試', 'error');
          }
        }
      }

      function showBatchRejectModal() {
        const ids = getSelectedVerificationIds();
        if (ids.length === 0) {
          if (window.showToast) {
            window.showToast('請選擇至少一個驗證申請', 'warning');
          }
          return;
        }
        document.getElementById('batch-reject-count').textContent = ids.length;
        document.getElementById('batch-reject-reason').value = '';
        document.getElementById('batch-reject-modal').classList.remove('hidden');
      }

      function closeBatchRejectModal() {
        document.getElementById('batch-reject-modal').classList.add('hidden');
      }

      async function confirmBatchReject() {
        const ids = getSelectedVerificationIds();
        if (ids.length === 0) return;

        const reason = document.getElementById('batch-reject-reason').value.trim();
        if (!reason) {
          if (window.showToast) {
            window.showToast('請填寫拒絕原因', 'warning');
          }
          return;
        }

        try {
          const response = await fetch('/api/business/verify/batch-reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              verification_ids: ids,
              rejection_reason: reason
            })
          });

          const data = await response.json();

          if (data.success) {
            if (window.showToast) {
              window.showToast(data.message || '批量拒絕成功', 'success');
            }
            closeBatchRejectModal();
            // 清除所有選中狀態
            document.querySelectorAll('.verification-checkbox').forEach(cb => cb.checked = false);
            updateBatchActions();
            // 重新載入頁面
            setTimeout(() => location.reload(), 1000);
          } else {
            if (window.showToast) {
              window.showToast('批量拒絕失敗：' + (data.error || data.message || '未知錯誤'), 'error');
            }
          }
        } catch (error) {
          console.error('批量拒絕失敗:', error);
          if (window.showToast) {
            window.showToast('批量拒絕失敗，請稍後再試', 'error');
          }
        }
      }

      // 載入統計數據
      async function loadStatistics() {
        try {
            const response = await fetch('/api/business/verify/stats', { credentials: 'include' });
            const data = await response.json();
            
            if (data.success && data.stats) {
                document.getElementById('approved-count').textContent = data.stats.approved;
                document.getElementById('rejected-count').textContent = data.stats.rejected;
                // 更新 tab 上的計數（如果有變動）
                // 這裡可以選擇是否更新待審核數量，雖然它是從頁面渲染數據來的
            }
        } catch (error) {
            console.error('載入統計數據失敗:', error);
        }
      }

      // 頁面載入時執行
      document.addEventListener('DOMContentLoaded', function() {
        loadStatistics();
      });
    </script>
  `;

    return new Response(pageTemplate({
      title: '商家驗證審核 - 管理員',
      content: content,
      user: user,
      nonce: nonce,
      cssContent: cssContent
    }), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  } catch (error) {
    console.error('[BusinessVerificationAdmin] Error rendering page:', error);
    // 返回錯誤頁面
    // const { renderErrorPage } = await import('./ErrorPage.js');
    // return renderErrorPage(request, env, session, user, nonce, cssContent, error);
    return new Response('Error: ' + error.message, { status: 500 });
  }
}

