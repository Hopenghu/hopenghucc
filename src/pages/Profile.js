import { pageTemplate } from '../components/layout.js';
import { LocationService } from '../services/LocationService.js';
import { ErrorResponseBuilder, ServiceHealthChecker, withErrorHandling } from '../utils/errorHandler.js';

const Profile = () => {
  return <div>Placeholder for potential future client-side Profile content</div>;
};

async function _renderProfilePage(request, env, session, user, nonce, cssContent) {
  console.log('[Profile.js] renderProfilePage called with user:', user ? user.email : 'null');

  if (!user) {
    console.log('[Profile.js] No user, redirecting to login');
    return Response.redirect(new URL(request.url).origin + '/login', 302);
  }

  // 檢查數據庫連接
  const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
  if (!dbHealth.healthy) {
    console.error('[Profile] Database not available:', dbHealth.error);
    return ErrorResponseBuilder.buildDatabaseErrorPage({
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }

  console.log('[Profile.js] Creating LocationService...');
  const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

  // 優化：一次性獲取用戶的所有地點（包括用戶建立的地點）
  console.log('[Profile.js] Getting all user locations (optimized)...');
  const { userLocations, userCreatedLocations } = await locationService.getUserAllLocationsOptimized(user.id);
  console.log('[Profile.js] Found', userLocations.length, 'user locations and', userCreatedLocations.length, 'user created locations');

  // 分類地點
  const visitedLocations = userLocations.filter(loc => loc.user_location_status === 'visited');
  const wantToVisitLocations = userLocations.filter(loc => loc.user_location_status === 'want_to_visit');
  const wantToRevisitLocations = userLocations.filter(loc => loc.user_location_status === 'want_to_revisit');
  const createdLocations = userCreatedLocations; // 使用專門查詢的建立地點

  console.log('[Profile.js] Generating content...');
  const content = `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- 用戶資訊區域 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex items-center space-x-4">
          ${user.avatar_url ?
      `<img src="${user.avatar_url}" alt="User Avatar" class="w-16 h-16 rounded-full object-cover">` :
      `<span class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-semibold text-white">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>`
    }
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${user.name || '使用者'}</h1>
            <p class="text-gray-600">${user.email || '電子郵件未提供'}</p>
            <div class="flex space-x-4 mt-2 text-sm text-gray-500">
              <span>來過: ${visitedLocations.length}</span>
              <span>想來: ${wantToVisitLocations.length}</span>
              <span>想再來: ${wantToRevisitLocations.length}</span>
              <span>我建立: ${createdLocations.length}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的地點分類標籤 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">我的地點</h2>
        <div class="flex flex-wrap gap-2 mb-6">
          <button onclick="showLocationCategory('visited')" class="location-tab active px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium transition-colors">
            來過 (${visitedLocations.length})
          </button>
          <button onclick="showLocationCategory('want_to_visit')" class="location-tab px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
            想來 (${wantToVisitLocations.length})
          </button>
          <button onclick="showLocationCategory('want_to_revisit')" class="location-tab px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
            想再來 (${wantToRevisitLocations.length})
          </button>
          <button onclick="showLocationCategory('created')" class="location-tab px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
            我建立 (${createdLocations.length})
          </button>
        </div>

        <!-- 來過的地點 -->
        <div id="visited-locations" class="location-category">
          ${renderLocationGridWithComponent(visitedLocations, 'visited')}
        </div>

        <!-- 想來的地點 -->
        <div id="want_to_visit-locations" class="location-category" style="display: none;">
          ${renderLocationGridWithComponent(wantToVisitLocations, 'want_to_visit')}
        </div>

        <!-- 想再來的地點 -->
        <div id="want_to_revisit-locations" class="location-category" style="display: none;">
          ${renderLocationGridWithComponent(wantToRevisitLocations, 'want_to_revisit')}
        </div>

        <!-- 我建立的地點 -->
        <div id="created-locations" class="location-category" style="display: none;">
          ${renderLocationGridWithComponent(createdLocations, 'created')}
        </div>
      </div>
    </div>

    <script nonce="${nonce}">
      // 地點詳情管理器
      let locationDetailManager = null;
      
      // 簡化的地點詳情管理器（不依賴外部模組）
      class SimpleLocationDetailManager {
        constructor() {
          this.isVisible = false;
          this.currentLocation = null;
        }
        
        showLocationDetail(location) {
          this.currentLocation = location;
          this.isVisible = true;
          this.renderPanel();
        }
        
        hideLocationDetail() {
          this.isVisible = false;
          this.removePanel();
        }
        
        renderPanel() {
          if (!this.currentLocation) return;
          
          const panel = document.createElement('div');
          panel.id = 'location-detail-panel';
          panel.className = 'location-detail-panel visible';
          
          panel.innerHTML = this.createPanelHTML(this.currentLocation);
          document.body.appendChild(panel);
          
          // 添加事件監聽器
          this.addEventListeners();
        }
        
        createPanelHTML(location) {
          return '<div class="detail-panel-overlay" onclick="closeLocationDetail()"></div>' +
            '<div class="detail-panel-content">' +
              '<button class="detail-panel-close-mobile" onclick="closeLocationDetail()">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M19 12H5M12 19l-7-7 7-7"/>' +
                '</svg>' +
              '</button>' +
              '<button class="detail-panel-close-desktop" onclick="closeLocationDetail()">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M18 6L6 18M6 6l12 12"/>' +
                '</svg>' +
              '</button>' +
              '<div class="detail-panel-image">' +
                '<img src="' + (location.thumbnail_url || 'https://placehold.co/600x400/6B7280/FFFFFF?text=Location+Image') + '" ' +
                     'alt="' + (location.name || '地點照片') + '" ' +
                     'class="detail-panel-img">' +
                this.renderStatusBadge(location.user_location_status) +
              '</div>' +
              '<div class="detail-panel-info">' +
                '<h2 class="detail-panel-title">' + (location.name || '未命名地點') + '</h2>' +
                '<div class="detail-panel-meta">' +
                  '<div class="meta-item">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                      '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
                      '<circle cx="12" cy="10" r="3"/>' +
                    '</svg>' +
                    '<span>' + (location.address || '無地址資訊') + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="detail-panel-actions">' +
                  '<h3>我的狀態</h3>' +
                  '<div class="action-buttons">' +
                    this.renderStatusButtons(location) +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
        }
        
        renderStatusBadge(status) {
          if (!status) return '';
          const statusConfig = {
            visited: { text: '來過', class: 'bg-green-100 text-green-800' },
            want_to_visit: { text: '想來', class: 'bg-blue-100 text-blue-800' },
            want_to_revisit: { text: '想再來', class: 'bg-purple-100 text-purple-800' }
          };
          const config = statusConfig[status];
          return config ? '<span class="status-badge ' + config.class + '">' + config.text + '</span>' : '';
        }
        
        renderStatusButtons(location) {
          const statuses = [
            { key: 'visited', text: '來過', color: 'green' },
            { key: 'want_to_visit', text: '想來', color: 'blue' },
            { key: 'want_to_revisit', text: '想再來', color: 'purple' }
          ];
          
          return statuses.map(status => {
            const isActive = location.user_location_status === status.key;
            const activeClass = isActive ? 'bg-' + status.color + '-500 text-white' : 'bg-gray-200 text-gray-700';
            return '<button onclick="updateLocationStatus(\'' + location.id + '\', \'' + status.key + '\', event)" ' +
                    'class="status-btn ' + activeClass + '">' +
                    status.text +
                    '</button>';
          }).join('');
        }
        
        removePanel() {
          const panel = document.getElementById('location-detail-panel');
          if (panel) {
            panel.remove();
          }
        }
        
        addEventListeners() {
          document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
        
        handleKeyDown(event) {
          if (event.key === 'Escape') {
            this.hideLocationDetail();
          }
        }
      }
      
      // 初始化詳情管理器
      function initLocationDetailManager() {
        if (!locationDetailManager) {
          locationDetailManager = new SimpleLocationDetailManager();
        }
      }
      
      // 處理地點卡片點擊
      function handleLocationCardClick(locationId, event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 獲取地點數據
        const locationData = getLocationDataById(locationId);
        if (locationData) {
          initLocationDetailManager();
          locationDetailManager.showLocationDetail(locationData);
        }
      }
      
      // 獲取地點數據
      function getLocationDataById(locationId) {
        // 從 DOM 中獲取地點卡片的數據
        const card = document.querySelector('.location-card[data-location-id="' + locationId + '"]');
        if (!card) return null;
        
        const name = card.querySelector('h3').textContent.trim();
        const address = card.querySelector('div > p.text-sm').textContent.trim(); // 第一個 p 是地址
        // 注意：圖片 URL 可能在 onerror 中被替換，這裡嘗試獲取原始 src
        const img = card.querySelector('img');
        const thumbnailUrl = img ? img.src : null;
        
        // 嘗試獲取類型資訊
        const typeEl = Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('類型:'));
        const typesText = typeEl ? typeEl.textContent.replace('類型:', '').trim() : '';
        
        // 嘗試獲取簡介
        const summaryEl = card.querySelector('p.max-h-12');
        const summary = summaryEl ? summaryEl.textContent.trim() : null; // 使用 textContent 避免 HTML 實體問題
        
        // 嘗試從按鈕狀態獲取當前用戶狀態
        let status = null;
        if (card.querySelector('button.bg-green-500')) status = 'visited';
        else if (card.querySelector('button.bg-blue-500')) status = 'want_to_visit';
        else if (card.querySelector('button.bg-purple-500')) status = 'want_to_revisit';
        
        return {
          id: locationId,
          name: name,
          address: address,
          thumbnail_url: thumbnailUrl,
          google_types: JSON.stringify([typesText]), // 簡單封裝以符合預期格式
          editorial_summary: summary,
          user_location_status: status
        };
      }
      
      // 關閉地點詳情
      function closeLocationDetail() {
        if (locationDetailManager) {
          locationDetailManager.hideLocationDetail();
        }
      }
      
      function showLocationCategory(category) {
        // 隱藏所有分類
        document.querySelectorAll('.location-category').forEach(el => {
          el.style.display = 'none';
        });
        
        // 顯示選中的分類
        const targetElement = document.getElementById(category + '-locations');
        if (targetElement) {
          targetElement.style.display = 'block';
        }
        
        // 更新標籤樣式
        document.querySelectorAll('.location-tab').forEach(tab => {
          tab.classList.remove('active', 'bg-blue-500', 'text-white');
          tab.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        // 激活選中的標籤
        const activeTab = event.target;
        activeTab.classList.remove('bg-gray-200', 'text-gray-700');
        activeTab.classList.add('active', 'bg-blue-500', 'text-white');
      }

      function updateLocationStatus(locationId, newStatus, event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        fetch('/api/location/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationId: locationId,
            status: newStatus
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // 更新按鈕狀態
            const button = event ? event.target.closest('button') : null;
            if (button) {
              // 重置所有按鈕
              const allButtons = button.parentElement.querySelectorAll('button');
              allButtons.forEach(btn => {
                btn.classList.remove('bg-green-500', 'bg-blue-500', 'bg-purple-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
              });
              
              // 激活選中的按鈕
              button.classList.remove('bg-gray-200', 'text-gray-700');
              if (newStatus === 'visited') {
                button.classList.add('bg-green-500', 'text-white');
              } else if (newStatus === 'want_to_visit') {
                button.classList.add('bg-blue-500', 'text-white');
              } else if (newStatus === 'want_to_revisit') {
                button.classList.add('bg-purple-500', 'text-white');
              }
            }
            
            // 如果詳情面板打開，更新詳情面板
            if (locationDetailManager && locationDetailManager.isVisible) {
              // 重新載入詳情面板數據
              const updatedLocation = getLocationDataById(locationId);
              if (updatedLocation) {
                updatedLocation.user_location_status = newStatus;
                locationDetailManager.showLocationDetail(updatedLocation);
              }
            }
            // 顯示成功提示
            if (window.showToast) {
              const statusText = newStatus === 'visited' ? '來過' : 
                               newStatus === 'want_to_visit' ? '想來' : '想再來';
              window.showToast('已標記為「' + statusText + '」', 'success');
            }
          } else {
            if (window.showToast) {
              window.showToast('更新失敗: ' + data.error, 'error');
            } else {
              alert('更新失敗: ' + data.error);
            }
          }
        })
        .catch(error => {
          console.error('Error:', error);
          if (window.showToast) {
            window.showToast('更新失敗，請稍後再試', 'error');
          } else {
            alert('更新失敗，請稍後再試');
          }
        });
      }
      
      // 頁面載入完成後初始化
      document.addEventListener('DOMContentLoaded', function() {
        initLocationDetailManager();
      });
    </script>
  `;

  try {
    const url = new URL(request.url);
    return new Response(pageTemplate({
      title: '我的地點 - HOPENGHU',
      content,
      user,
      nonce,
      cssContent,
      currentPath: url.pathname
    }), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  } catch (error) {
    console.error('[Profile] Error:', error);
    return ErrorResponseBuilder.buildErrorPage({
      title: '載入個人資料失敗',
      message: error.message || '無法載入個人資料，請稍後再試。',
      statusCode: 500,
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }
}

// 使用錯誤處理裝飾器包裝
export const renderProfilePage = withErrorHandling(_renderProfilePage, {
  user: null,
  nonce: '',
  cssContent: ''
});

// 使用新的物件導向組件渲染地點網格
function renderLocationGridWithComponent(locations, category) {
  // 內聯 LocationCardGrid 實現，避免服務器端模組導入問題
  if (locations.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">還沒有${getCategoryName(category)}的地點</h3>
        <p class="text-gray-500 mb-6">開始探索並記錄您的地點吧！</p>
        <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          瀏覽地點
        </a>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      ${locations.map(location => {
    // Parse google_types JSON string
    let typesArray = [];
    try {
      if (location.google_types) {
        typesArray = JSON.parse(location.google_types);
      }
    } catch (e) {
      console.error('Error parsing google_types JSON:', e, location.google_types);
    }
    const displayTypes = translatePlaceTypes(typesArray);

    return `
        <div class="location-card bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-transform hover:scale-105" 
             data-location-id="${location.id}"
             onclick="handleLocationCardClick('${location.id}')">
          ${createImageWithFallback(
      location.thumbnail_url || 'https://placehold.co/400x268/png?text=No+Image',
      location.name || '地點照片',
      'w-full h-48 object-cover',
      location.name || '未命名地點'
    )}
          <div class="p-4 flex-grow">
            <h3 class="text-lg font-semibold mb-1 truncate" title="${location.name || '未命名地點'}">${location.name || '未命名地點'}</h3>
            <p class="text-sm text-gray-600 mb-2 truncate" title="${location.address || '無地址資訊'}">${location.address || '無地址資訊'}</p>
            <p class="text-xs text-gray-500 mb-3">類型: ${displayTypes}</p>
            ${location.editorial_summary ? `<p class="text-xs text-gray-600 mb-3 leading-tight max-h-12 overflow-hidden" title="${location.editorial_summary}">${location.editorial_summary}</p>` : ''}
            
            <!-- 互動按鈕 -->
            <div class="flex justify-between items-center mt-auto pt-2">
              <div class="flex space-x-2">
                <button 
                  onclick="event.stopPropagation(); updateLocationStatus('${location.id}', 'visited')"
                  class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${location.user_location_status === 'visited' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}"
                >
                  <span>✓</span>
                  <span>來過</span>
                </button>
                <button 
                  onclick="event.stopPropagation(); updateLocationStatus('${location.id}', 'want_to_visit')"
                  class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${location.user_location_status === 'want_to_visit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}"
                >
                  <span>❤</span>
                  <span>想來</span>
                </button>
                <button 
                  onclick="event.stopPropagation(); updateLocationStatus('${location.id}', 'want_to_revisit')"
                  class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${location.user_location_status === 'want_to_revisit' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}"
                >
                  <span>🔄</span>
                  <span>想再來</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderLocationGrid(locations, category) {
  if (locations.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">還沒有${getCategoryName(category)}的地點</h3>
        <p class="text-gray-500 mb-6">開始探索並記錄您的地點吧！</p>
        <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          瀏覽地點
        </a>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${locations.map(loc => {
    // Parse google_types JSON string
    let typesArray = [];
    try {
      if (loc.google_types) {
        typesArray = JSON.parse(loc.google_types);
      }
    } catch (e) {
      console.error('Error parsing google_types JSON:', e, loc.google_types);
    }
    const displayTypes = translatePlaceTypes(typesArray);

    return `
        <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200 flex flex-col">
          ${createImageWithFallback(
      loc.thumbnail_url || 'https://placehold.co/400x268/png?text=No+Image',
      loc.name || '地點照片',
      'w-full h-48 object-cover',
      loc.name || '未命名地點'
    )}
          <div class="p-4 flex-grow">
            <h3 class="text-lg font-semibold mb-1 truncate" title="${loc.name || '未命名地點'}">${loc.name || '未命名地點'}</h3>
            <p class="text-sm text-gray-600 mb-2 truncate" title="${loc.address || '無地址資訊'}">${loc.address || '無地址資訊'}</p>
            <p class="text-xs text-gray-500 mb-3">類型: ${displayTypes}</p>
            ${loc.editorial_summary ? `<p class="text-xs text-gray-600 mb-3 leading-tight max-h-12 overflow-hidden" title="${loc.editorial_summary}">${loc.editorial_summary}</p>` : ''}
            
            <!-- 互動按鈕 -->
            <div class="flex justify-between items-center mt-auto pt-2">
              <div class="flex space-x-2">
                <button 
                  onclick="updateLocationStatus('${loc.id}', 'visited')"
                  class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${loc.user_location_status === 'visited' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}"
                >
                  <span>✓</span>
                  <span>來過</span>
                </button>
                <button 
                  onclick="updateLocationStatus('${loc.id}', 'want_to_visit')"
                  class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${loc.user_location_status === 'want_to_visit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}"
                >
                  <span>❤</span>
                  <span>想來</span>
                </button>
                <button 
                  onclick="updateLocationStatus('${loc.id}', 'want_to_revisit')"
                  class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${loc.user_location_status === 'want_to_revisit' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}"
                >
                  <span>🔄</span>
                  <span>想再來</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        `;
  }).join('')}
    </div>
  `;
}

function getCategoryName(category) {
  const names = {
    'visited': '來過',
    'want_to_visit': '想來',
    'want_to_revisit': '想再來',
    'created': '建立'
  };
  return names[category] || category;
}

// 輔助函數
function createImageWithFallback(src, alt, className, locationName) {
  const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';

  if (!src || src === 'null' || src === 'undefined') {
    return `<img 
      src="${defaultImage}" 
      alt="${alt || '地點照片'}" 
      class="${className}" 
      style="opacity: 1; transition: opacity 0.3s ease-in-out;"
    >`;
  }

  if (src.includes('placehold.co')) {
    return `<img 
      src="${src}" 
      alt="${alt || '地點照片'}" 
      class="${className}" 
      style="opacity: 1; transition: opacity 0.3s ease-in-out;"
    >`;
  }

  return `<img 
    src="${src}" 
    alt="${alt || '地點照片'}" 
    class="${className}" 
    onerror="this.onerror=null; this.src='${defaultImage}'; this.style.opacity='1';"
    onload="this.style.opacity='1'"
    style="opacity: 0; transition: opacity 0.3s ease-in-out;"
  >`;
}

function translatePlaceTypes(types) {
  if (!types || !Array.isArray(types)) return '未知類型';

  const typeTranslations = {
    'restaurant': '餐廳',
    'cafe': '咖啡廳',
    'bar': '酒吧',
    'bakery': '麵包店',
    'food': '美食',
    'lodging': '住宿',
    'hotel': '飯店',
    'tourist_attraction': '觀光景點',
    'museum': '博物館',
    'park': '公園',
    'natural_feature': '自然景觀',
    'establishment': '場所',
    'point_of_interest': '景點'
  };

  return types.map(type => typeTranslations[type] || type).join(', ');
}

export default Profile; 