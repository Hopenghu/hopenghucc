// 地點卡片組件 - 物件導向設計
export class LocationCard {
  constructor(location, options = {}) {
    this.location = location;
    this.options = {
      showStatusButtons: true,
      showInteractionCounts: false,
      showFavoriteButton: true, // 新增：顯示收藏按鈕
      isFavorited: false, // 新增：是否已收藏
      cardSize: 'default', // 'default', 'compact', 'large'
      onCardClick: null,
      onStatusUpdate: null,
      onFavoriteToggle: null, // 新增：收藏切換回調
      ...options
    };
  }

  // 渲染地點卡片
  render() {
    const { location, options } = this;
    
    // 解析地點類型
    const typesArray = this.parseLocationTypes(location.google_types);
    const displayTypes = this.translatePlaceTypes(typesArray);
    
    // 獲取用戶狀態樣式
    const statusStyles = this.getStatusButtonStyles(location.user_location_status);
    
    return `
      <div class="location-card ${this.getCardSizeClass()}" 
           onclick="handleLocationCardClick('${location.id}', event)"
           data-location-id="${location.id}">
        
        <!-- 圖片區域 -->
        <div class="location-card-image">
          ${this.createImageWithFallback(
            location.thumbnail_url,
            location.name,
            'location-card-img'
          )}
          
          <!-- 狀態標籤 -->
          ${this.renderStatusBadge(location.user_location_status)}
          
          <!-- 收藏按鈕 -->
          ${options.showFavoriteButton ? this.renderFavoriteButton(location, options.isFavorited) : ''}
        </div>
        
        <!-- 內容區域 -->
        <div class="location-card-content">
          <h3 class="location-card-title" title="${location.name || '未命名地點'}">
            ${location.name || '未命名地點'}
          </h3>
          
          <p class="location-card-address" title="${location.address || '無地址資訊'}">
            ${location.address || '無地址資訊'}
          </p>
          
          <p class="location-card-types">類型: ${displayTypes}</p>
          
          ${location.editorial_summary ? 
            `<p class="location-card-summary" title="${location.editorial_summary}">
              ${location.editorial_summary}
            </p>` : ''
          }
          
          <!-- 互動按鈕 -->
          ${options.showStatusButtons ? this.renderStatusButtons(location, statusStyles) : ''}
          
          <!-- 互動統計 -->
          ${options.showInteractionCounts ? this.renderInteractionCounts(location) : ''}
        </div>
      </div>
    `;
  }

  // 解析地點類型
  parseLocationTypes(googleTypes) {
    if (!googleTypes) return [];
    try {
      return typeof googleTypes === 'string' ? JSON.parse(googleTypes) : googleTypes;
    } catch (e) {
      console.error('Error parsing google_types JSON:', e, googleTypes);
      return [];
    }
  }

  // 翻譯地點類型
  translatePlaceTypes(types) {
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

  // 創建圖片（含錯誤處理、骨架屏和載入指示器）
  createImageWithFallback(src, alt, className) {
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
          onerror="window.handleImageError && window.handleImageError('${imageId}', '${containerId}', '${defaultImage}')"
          onload="window.handleImageLoad && window.handleImageLoad('${imageId}', '${containerId}')"
          loading="lazy"
        >
        <!-- 錯誤訊息 -->
        <div id="error-${imageId}" class="image-error-message hidden absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs text-gray-500 mt-1">圖片載入失敗</p>
        </div>
      </div>
      <script>
        if (typeof handleImageLoad === 'undefined') {
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
        }
        if (typeof handleImageError === 'undefined') {
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
        }
      </script>
    `;
  }

  // 獲取卡片尺寸樣式
  getCardSizeClass() {
    const sizeClasses = {
      'compact': 'location-card-compact',
      'default': 'location-card-default',
      'large': 'location-card-large'
    };
    return sizeClasses[this.options.cardSize] || sizeClasses.default;
  }

  // 渲染狀態標籤
  renderStatusBadge(status) {
    if (!status) return '';
    
    const badgeConfig = {
      'visited': { text: '來過', class: 'status-badge-visited' },
      'want_to_visit': { text: '想來', class: 'status-badge-want' },
      'want_to_revisit': { text: '想再來', class: 'status-badge-revisit' },
      'created': { text: '我建立', class: 'status-badge-created' }
    };
    
    const config = badgeConfig[status];
    if (!config) return '';
    
    return `
      <div class="location-status-badge ${config.class}">
        ${config.text}
      </div>
    `;
  }

  // 獲取狀態按鈕樣式
  getStatusButtonStyles(currentStatus) {
    return {
      visited: currentStatus === 'visited' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100',
      want_to_visit: currentStatus === 'want_to_visit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100',
      want_to_revisit: currentStatus === 'want_to_revisit' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
    };
  }

  // 渲染狀態按鈕
  renderStatusButtons(location, styles) {
    return `
      <div class="location-status-buttons">
        <button 
          onclick="updateLocationStatus('${location.id}', 'visited', event)"
          class="status-button ${styles.visited}"
        >
          <span>✓</span>
          <span>來過</span>
        </button>
        <button 
          onclick="updateLocationStatus('${location.id}', 'want_to_visit', event)"
          class="status-button ${styles.want_to_visit}"
        >
          <span>❤</span>
          <span>想來</span>
        </button>
        <button 
          onclick="updateLocationStatus('${location.id}', 'want_to_revisit', event)"
          class="status-button ${styles.want_to_revisit}"
        >
          <span>🔄</span>
          <span>想再來</span>
        </button>
      </div>
    `;
  }

  // 渲染互動統計
  renderInteractionCounts(location) {
    if (!location.interaction_counts) return '';
    
    return `
      <div class="location-interaction-counts">
        <span class="count-item">
          <span class="count-number">${location.interaction_counts.visited || 0}</span>
          <span class="count-label">來過</span>
        </span>
        <span class="count-item">
          <span class="count-number">${location.interaction_counts.want_to_visit || 0}</span>
          <span class="count-label">想來</span>
        </span>
        <span class="count-item">
          <span class="count-number">${location.interaction_counts.want_to_revisit || 0}</span>
          <span class="count-label">想再來</span>
        </span>
      </div>
    `;
  }
}

// 地點卡片網格組件
export class LocationCardGrid {
  constructor(locations, options = {}) {
    this.locations = locations;
    this.options = {
      columns: {
        mobile: 2,
        tablet: 3,
        desktop: 4
      },
      cardSize: 'default',
      showStatusButtons: true,
      showInteractionCounts: false,
      onCardClick: null,
      onStatusUpdate: null,
      ...options
    };
  }

  // 渲染地點卡片網格
  render() {
    if (this.locations.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <div class="location-card-grid ${this.getGridClass()}">
        ${this.locations.map(location => {
          const card = new LocationCard(location, this.options);
          return card.render();
        }).join('')}
      </div>
    `;
  }

  // 獲取網格樣式類別
  getGridClass() {
    const { columns } = this.options;
    return `grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`;
  }

  // 渲染空狀態
  renderEmptyState() {
    return `
      <div class="location-empty-state">
        <div class="empty-state-icon">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 class="empty-state-title">還沒有地點</h3>
        <p class="empty-state-description">開始探索並記錄您的地點吧！</p>
        <a href="/" class="empty-state-action">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          瀏覽地點
        </a>
      </div>
    `;
  }
} 