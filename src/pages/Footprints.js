import { pageTemplate } from '../components/layout.js';
import { LocationService } from '../services/locationService.js';
import { ImagePreview } from '../components/ImagePreview.js';
import { ErrorResponseBuilder, ServiceHealthChecker, withErrorHandling } from '../utils/errorHandler.js';

const Footprints = () => { 
  return <div>Placeholder for potential future client-side Footprints content</div>;
};

async function _renderFootprintsPage(request, env, session, user, nonce, cssContent) { 
  // 檢查數據庫連接
  const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
  if (!dbHealth.healthy) {
    console.error('[Footprints] Database not available:', dbHealth.error);
    return ErrorResponseBuilder.buildDatabaseErrorPage({
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }

  // 足跡页面不需要登录，但登录用户会看到自己的地点状态
  const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
  
  // 計算屏幕可容納的地點數量（根據網格布局估算）
  // 假設每個卡片高度約為 400px，加上間距，每屏可顯示約 2-3 行
  // 桌面端：4列 x 3行 = 12個，平板：3列 x 3行 = 9個，手機：2列 x 3行 = 6個
  // 為了安全起見，初始載入 12 個地點（約一屏的內容）
  const initialLimit = 12;
  const initialLocations = await locationService.getLocationsPaginated(initialLimit, 0, user?.id || null);

  // 輔助函數：翻譯地點類型
  const translatePlaceTypes = (types) => {
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
  };

  // 創建圖片回退函數（含骨架屏和載入指示器）
  const createImageWithFallback = (src, alt, className, locationName) => {
    const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const containerId = `img-container-${imageId}`;
    
    if (!src || src === 'null' || src === 'undefined') {
      return `<div id="${containerId}" class="image-loader-container">
        <img 
          id="${imageId}"
          src="${defaultImage}" 
          alt="${alt || '地點照片'}" 
          class="${className}" 
          style="opacity: 1; transition: opacity 0.3s ease-in-out;"
        >
      </div>`;
    }
    
    if (src.includes('placehold.co')) {
      return `<div id="${containerId}" class="image-loader-container">
        <img 
          id="${imageId}"
          src="${src}" 
          alt="${alt || '地點照片'}" 
          class="${className}" 
          style="opacity: 1; transition: opacity 0.3s ease-in-out;"
        >
      </div>`;
    }
    
    return `
      <div id="${containerId}" class="image-loader-container relative">
        <!-- 骨架屏 -->
        <div class="image-skeleton absolute inset-0 bg-gray-200 rounded">
          <div class="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
        </div>
        <!-- 載入進度指示器 -->
        <div class="image-progress absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <!-- 圖片 -->
        <img 
          id="${imageId}"
          src="${src}" 
          alt="${alt || '地點照片'}" 
          class="${className} image-loader-img"
          style="opacity: 0; transition: opacity 0.3s ease-in-out; position: relative; z-index: 1;"
          onerror="handleImageError('${imageId}', '${containerId}', '${defaultImage}')"
          onload="handleImageLoad('${imageId}', '${containerId}')"
          loading="lazy"
        >
        <!-- 錯誤訊息（改進的視覺回饋） -->
        <div id="error-${imageId}" class="image-error-message hidden absolute inset-0 z-10">
          <div class="error-state-icon">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="error-state-title">圖片載入失敗</p>
          <p class="error-state-message">正在嘗試載入預設圖片...</p>
        </div>
      </div>
    `;
  };

  // 渲染地點卡片
  const renderLocationCard = (location) => {
    let typesArray = [];
    try {
      if (location.google_types) {
        typesArray = typeof location.google_types === 'string' 
          ? JSON.parse(location.google_types) 
          : location.google_types;
      }
    } catch (e) {
      console.error('Error parsing google_types JSON:', e, location.google_types);
    }
    const displayTypes = translatePlaceTypes(typesArray);
    const isFavorited = location.is_favorited || false;
    const imageUrl = location.thumbnail_url || 'https://placehold.co/400x268/png?text=No+Image';
    const locationName = location.name || '未命名地點';
    const locationAlt = location.name || '地點照片';
    
    return `
      <div class="location-card bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-transform hover:scale-105" 
           data-location-id="${location.id}"
           onclick="window.location.href='/location/${location.id}'">
        <div class="relative">
          ${new ImagePreview({
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl,
            alt: locationAlt,
            nonce: nonce
          }).render()}
          ${user ? `
            <button 
              class="location-card-favorite-btn ${isFavorited ? 'favorited' : ''}"
              data-location-id="${location.id}"
              data-is-favorited="${isFavorited}"
              onclick="event.stopPropagation(); handleFavoriteToggle('${location.id}', event)"
              title="${isFavorited ? '取消收藏' : '加入收藏'}"
            >
              <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
            </button>
          ` : ''}
        </div>
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
  };

  const content = `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 class="text-2xl font-bold text-gray-900">足跡</h1>
        <p class="text-gray-600 mt-2">探索所有澎湖地點</p>
      </div>

      <!-- 地點網格容器 -->
      <div id="locations-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        ${initialLocations.map(location => renderLocationCard(location)).join('')}
      </div>

      <!-- 載入更多指示器 -->
      <div id="loading-indicator" class="text-center py-8 hidden">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="mt-2 text-gray-600">載入中...</p>
      </div>

      <!-- 沒有更多內容提示 -->
      <div id="no-more-indicator" class="text-center py-8 hidden">
        <p class="text-gray-500">已顯示所有地點</p>
      </div>
    </div>

    <script nonce="${nonce}">
      // 圖片載入處理函數
      function handleImageLoad(imageId, containerId) {
        const img = document.getElementById(imageId);
        const container = document.getElementById(containerId);
        if (img && container) {
          const skeleton = container.querySelector('.image-skeleton');
          const progress = container.querySelector('.image-progress');
          const errorMsg = container.querySelector('#error-' + imageId);
          if (skeleton) skeleton.classList.add('hidden');
          if (progress) progress.classList.add('hidden');
          if (errorMsg) errorMsg.classList.add('hidden');
          img.style.opacity = '1';
        }
      }

      function handleImageError(imageId, containerId, defaultImage) {
        const img = document.getElementById(imageId);
        const container = document.getElementById(containerId);
        if (img && container) {
          const skeleton = container.querySelector('.image-skeleton');
          const progress = container.querySelector('.image-progress');
          if (skeleton) skeleton.classList.add('hidden');
          if (progress) progress.classList.add('hidden');
          const errorMsg = container.querySelector('#error-' + imageId);
          if (errorMsg) errorMsg.classList.remove('hidden');
          if (img.src !== defaultImage) {
            img.onerror = null;
            img.src = defaultImage;
            img.style.opacity = '1';
          } else {
            img.style.opacity = '0.3';
          }
        }
      }

      let currentOffset = ${initialLocations.length};
      let isLoading = false;
      let hasMore = ${initialLocations.length === 12}; // 如果初始載入滿12個，可能還有更多
      const locationsGrid = document.getElementById('locations-grid');
      const loadingIndicator = document.getElementById('loading-indicator');
      const noMoreIndicator = document.getElementById('no-more-indicator');
      
      // 計算每屏可容納的地點數量
      function calculateVisibleLocations() {
        const viewportHeight = window.innerHeight;
        const headerHeight = 80; // 估算header高度
        const footerHeight = 60; // 估算footer高度
        const padding = 64; // 上下padding
        const availableHeight = viewportHeight - headerHeight - footerHeight - padding;
        
        // 每個地點卡片高度約為 400px（包含圖片、文字、按鈕）
        const cardHeight = 400;
        const gap = 24; // 網格間距
        
        // 計算可顯示的行數
        const rows = Math.floor(availableHeight / (cardHeight + gap));
        
        // 根據屏幕寬度計算列數
        let cols = 2; // 默認手機
        if (window.innerWidth >= 1024) {
          cols = 4; // 桌面
        } else if (window.innerWidth >= 768) {
          cols = 3; // 平板
        }
        
        // 返回可容納的數量（至少顯示一行）
        return Math.max(rows * cols, cols);
      }
      
      // 使用 Intersection Observer 實現更精確的懶加載
      let observer;
      const loadMoreTrigger = document.createElement('div');
      loadMoreTrigger.id = 'load-more-trigger';
      loadMoreTrigger.style.height = '1px';
      loadMoreTrigger.style.width = '100%';
      locationsGrid.parentElement.appendChild(loadMoreTrigger);

      // 收藏切換函數
      async function handleFavoriteToggle(locationId, event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        const button = event ? event.target.closest('.location-card-favorite-btn') : null;
        if (!button) return;
        
        const isFavorited = button.getAttribute('data-is-favorited') === 'true';
        
        try {
          const response = await fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              location_id: locationId,
              favorite: !isFavorited
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // 更新按鈕狀態
            if (data.is_favorited) {
              button.setAttribute('data-is-favorited', 'true');
              button.classList.add('favorited');
              button.setAttribute('title', '取消收藏');
              if (window.showToast) {
                window.showToast('已收藏！', 'success');
              }
            } else {
              button.setAttribute('data-is-favorited', 'false');
              button.classList.remove('favorited');
              button.setAttribute('title', '加入收藏');
              if (window.showToast) {
                window.showToast('已取消收藏', 'success');
              }
            }
          } else {
            window.showToast('操作失敗: ' + (data.error || '未知錯誤'), 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          window.showToast('操作失敗，請稍後再試', 'error');
        }
      }

      // 更新地點狀態函數
      async function updateLocationStatus(locationId, newStatus, event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        try {
          const response = await fetch('/api/location/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locationId: locationId,
              status: newStatus
            })
          });
          
          const data = await response.json();
          
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
              let statusText = '';
              if (newStatus === 'visited') {
                button.classList.add('bg-green-500', 'text-white');
                statusText = '來過';
              } else if (newStatus === 'want_to_visit') {
                button.classList.add('bg-blue-500', 'text-white');
                statusText = '想來';
              } else if (newStatus === 'want_to_revisit') {
                button.classList.add('bg-purple-500', 'text-white');
                statusText = '想再來';
              }
              
              // 顯示成功通知
              if (window.showToast && statusText) {
                window.showToast('地點狀態已更新為「' + statusText + '」', 'success');
              }
            }
          } else {
            window.showToast('更新失敗: ' + data.error, 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          window.showToast('更新失敗，請稍後再試', 'error');
        }
      }

      // 載入更多地點
      async function loadMoreLocations() {
        if (isLoading || !hasMore) return;
        
        isLoading = true;
        loadingIndicator.classList.remove('hidden');
        
        // 根據屏幕大小決定每次載入的數量
        const loadLimit = calculateVisibleLocations();
        
        try {
          const apiUrl = '/api/locations/paginated?limit=' + loadLimit + '&offset=' + currentOffset;
          console.log('Loading more locations from:', apiUrl);
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            throw new Error('API request failed with status: ' + response.status);
          }
          
          const data = await response.json();
          
          if (!data) {
            throw new Error('Invalid response data');
          }
          
          if (data.success && data.locations && data.locations.length > 0) {
            // 渲染新地點
            data.locations.forEach(location => {
              const card = document.createElement('div');
              card.className = 'location-card bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-transform hover:scale-105';
              card.setAttribute('data-location-id', location.id);
              card.onclick = function() {
                window.location.href = '/location/' + locationId;
              };
              
              // 解析類型
              let typesArray = [];
              try {
                if (location.google_types) {
                  typesArray = typeof location.google_types === 'string' 
                    ? JSON.parse(location.google_types) 
                    : location.google_types;
                }
              } catch (e) {
                console.error('Error parsing types:', e);
              }
              
              const typeTranslations = {
                'restaurant': '餐廳', 'cafe': '咖啡廳', 'bar': '酒吧', 'bakery': '麵包店',
                'food': '美食', 'lodging': '住宿', 'hotel': '飯店', 'tourist_attraction': '觀光景點',
                'museum': '博物館', 'park': '公園', 'natural_feature': '自然景觀',
                'establishment': '場所', 'point_of_interest': '景點'
              };
              const displayTypes = typesArray.map(type => typeTranslations[type] || type).join(', ') || '未知類型';
              
              const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';
              const imageSrc = location.thumbnail_url || defaultImage;
              const locationName = (location.name || '未命名地點').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
              const locationAddress = (location.address || '無地址資訊').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
              const locationId = location.id;
              const isFavorited = location.is_favorited || false;
              const visitedClass = location.user_location_status === 'visited' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100';
              const wantToVisitClass = location.user_location_status === 'want_to_visit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100';
              const wantToRevisitClass = location.user_location_status === 'want_to_revisit' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100';
              const summaryHtml = location.editorial_summary ? 
                '<p class="text-xs text-gray-600 mb-3 leading-tight max-h-12 overflow-hidden" title="' + 
                location.editorial_summary.replace(/"/g, '&quot;').replace(/'/g, '&#039;') + 
                '">' + location.editorial_summary.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' : '';
              
              // 使用 DOM API 创建元素，避免字符串转义问题
              const imageContainer = document.createElement('div');
              imageContainer.className = 'relative';
              
              // Create image preview container
              const previewContainer = document.createElement('div');
              previewContainer.className = 'image-preview-container relative cursor-pointer group';
              previewContainer.onclick = function(e) {
                e.stopPropagation();
                if (window.openImagePreview) {
                  window.openImagePreview(imageSrc, locationName);
                }
              };
              
              const img = document.createElement('img');
              img.src = imageSrc;
              img.alt = locationName;
              img.className = 'image-preview-thumbnail w-full h-48 object-cover transition-transform group-hover:scale-105';
              img.loading = 'lazy';
              img.onerror = function() {
                this.onerror = null;
                this.src = defaultImage;
              };
              
              // Create overlay
              const overlay = document.createElement('div');
              overlay.className = 'image-preview-overlay absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center';
              overlay.innerHTML = '<svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>';
              
              previewContainer.appendChild(img);
              previewContainer.appendChild(overlay);
              imageContainer.appendChild(previewContainer);
              
              // 添加收藏按鈕（如果用戶已登入）
              ${user ? `
                const favoriteBtn = document.createElement('button');
                favoriteBtn.className = 'location-card-favorite-btn ' + (isFavorited ? 'favorited' : '');
                favoriteBtn.setAttribute('data-location-id', locationId);
                favoriteBtn.setAttribute('data-is-favorited', isFavorited);
                favoriteBtn.setAttribute('title', isFavorited ? '取消收藏' : '加入收藏');
                favoriteBtn.onclick = function(e) {
                  e.stopPropagation();
                  handleFavoriteToggle(locationId, e);
                };
                favoriteBtn.innerHTML = '<svg class="w-5 h-5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>';
                imageContainer.appendChild(favoriteBtn);
              ` : ''}
              
              const contentDiv = document.createElement('div');
              contentDiv.className = 'p-4 flex-grow';
              contentDiv.innerHTML = 
                '<h3 class="text-lg font-semibold mb-1 truncate" title="' + locationName + '">' + locationName + '</h3>' +
                '<p class="text-sm text-gray-600 mb-2 truncate" title="' + locationAddress + '">' + locationAddress + '</p>' +
                '<p class="text-xs text-gray-500 mb-3">類型: ' + displayTypes + '</p>' +
                summaryHtml +
                '<div class="flex justify-between items-center mt-auto pt-2">' +
                '<div class="flex space-x-2">' +
                '<button onclick="event.stopPropagation(); updateLocationStatus(&quot;' + locationId + '&quot;, &quot;visited&quot;)" ' +
                'class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ' + visitedClass + '">' +
                '<span>✓</span><span>來過</span></button>' +
                '<button onclick="event.stopPropagation(); updateLocationStatus(&quot;' + locationId + '&quot;, &quot;want_to_visit&quot;)" ' +
                'class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ' + wantToVisitClass + '">' +
                '<span>❤</span><span>想來</span></button>' +
                '<button onclick="event.stopPropagation(); updateLocationStatus(&quot;' + locationId + '&quot;, &quot;want_to_revisit&quot;)" ' +
                'class="flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ' + wantToRevisitClass + '">' +
                '<span>🔄</span><span>想再來</span></button>' +
                '</div></div></div>';
              
              card.appendChild(imageContainer);
              card.appendChild(contentDiv);
              
              locationsGrid.appendChild(card);
            });
            
            currentOffset += data.locations.length;
            hasMore = data.locations.length === loadLimit; // 如果返回滿載入數量，可能還有更多
            
            // 將觸發器移到最後一個元素後面
            if (loadMoreTrigger.parentElement) {
              loadMoreTrigger.remove();
            }
            locationsGrid.appendChild(loadMoreTrigger);
            
            if (!hasMore) {
              noMoreIndicator.classList.remove('hidden');
              loadMoreTrigger.remove();
            }
          } else {
            hasMore = false;
            noMoreIndicator.classList.remove('hidden');
            loadMoreTrigger.remove();
          }
        } catch (error) {
          console.error('Error loading more locations:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            loadLimit: loadLimit,
            currentOffset: currentOffset
          });
          
          // 如果错误是网络错误或 API 错误，显示更详细的错误信息
          if (error.message.includes('API request failed')) {
            window.showToast('載入失敗：伺服器錯誤，請稍後再試', 'error');
          } else if (error.message.includes('fetch')) {
            window.showToast('載入失敗：網路連線問題，請檢查您的網路連線', 'error');
          } else {
            window.showToast('載入失敗，請稍後再試', 'error');
          }
          
          // 标记为没有更多内容，避免重复尝试
          hasMore = false;
        } finally {
          isLoading = false;
          loadingIndicator.classList.add('hidden');
        }
      }

      // 使用 Intersection Observer 實現更精確的懶加載
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading && hasMore) {
              console.log('Intersection Observer triggered, loading more locations...');
              loadMoreLocations();
            }
          });
        }, {
          rootMargin: '200px' // 提前200px開始載入
        });
        
        observer.observe(loadMoreTrigger);
        console.log('Intersection Observer initialized, observing loadMoreTrigger');
      } else {
        // 降級方案：使用滾動事件
        let scrollTimeout;
        window.addEventListener('scroll', () => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
              loadMoreLocations();
            }
          }, 100);
        });
      }

      // 初始檢查是否需要載入更多（如果內容不足一屏）
      if (window.innerHeight >= document.body.offsetHeight && hasMore) {
        loadMoreLocations();
      }
      
      // 監聽窗口大小變化，重新計算可見數量
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // 如果內容不足一屏且有更多內容，載入更多
          if (window.innerHeight >= document.body.offsetHeight && hasMore && !isLoading) {
            loadMoreLocations();
          }
        }, 300);
      });
    </script>
    ${ImagePreview.getScript(nonce)}
  `;

  try {
    const url = new URL(request.url);
    return new Response(pageTemplate({ 
      title: '足跡 - HOPENGHU', 
      content, 
      user, 
      nonce, 
      cssContent 
    }), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  } catch (error) {
    console.error('[Footprints] Error:', error);
    return ErrorResponseBuilder.buildErrorPage({
      title: '載入足跡頁面失敗',
      message: error.message || '無法載入足跡頁面，請稍後再試。',
      statusCode: 500,
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }
}

// 使用錯誤處理裝飾器包裝
export const renderFootprintsPage = withErrorHandling(_renderFootprintsPage, {
  user: null,
  nonce: '',
  cssContent: ''
});

export default Footprints;
