// 地點詳情面板組件 - 物件導向設計
export class LocationDetailPanel {
  constructor(options = {}) {
    this.options = {
      isVisible: false,
      location: null,
      onClose: null,
      onStatusUpdate: null,
      ...options
    };
  }

  // 渲染詳情面板
  render() {
    if (!this.options.location) {
      return '';
    }

    const { location } = this.options;
    
    return `
      <div id="location-detail-panel" class="location-detail-panel ${this.options.isVisible ? 'visible' : ''}">
        <!-- 遮罩層 -->
        <div class="detail-panel-overlay" onclick="closeLocationDetail()"></div>
        
        <!-- 面板內容 -->
        <div class="detail-panel-content">
          <!-- 手機端返回按鈕 -->
          <button class="detail-panel-close-mobile" onclick="closeLocationDetail()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <!-- 桌面端關閉按鈕 -->
          <button class="detail-panel-close-desktop" onclick="closeLocationDetail()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          
          <!-- 地點圖片 -->
          <div class="detail-panel-image">
            ${this.createImageWithFallback(
              location.thumbnail_url,
              location.name,
              'detail-panel-img'
            )}
            
            <!-- 狀態標籤 -->
            ${this.renderStatusBadge(location.user_location_status)}
          </div>
          
          <!-- 地點資訊 -->
          <div class="detail-panel-info">
            <h2 class="detail-panel-title">${location.name || '未命名地點'}</h2>
            
            <div class="detail-panel-meta">
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>${location.address || '無地址資訊'}</span>
              </div>
              
              ${location.phone_number ? `
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>${location.phone_number}</span>
                </div>
              ` : ''}
              
              ${location.website ? `
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <a href="${location.website}" target="_blank" rel="noopener noreferrer">${location.website}</a>
                </div>
              ` : ''}
            </div>
            
            <!-- 地點類型 -->
            <div class="detail-panel-types">
              <span class="types-label">類型:</span>
              <span class="types-value">${this.translatePlaceTypes(this.parseLocationTypes(location.google_types))}</span>
            </div>
            
            <!-- Google 評分 -->
            ${location.google_rating ? `
              <div class="detail-panel-rating">
                <div class="rating-stars">
                  ${this.renderRatingStars(location.google_rating)}
                </div>
                <span class="rating-score">${location.google_rating}</span>
                ${location.google_user_ratings_total ? 
                  `<span class="rating-count">(${location.google_user_ratings_total} 則評價)</span>` : ''
                }
              </div>
            ` : ''}
            
            <!-- 編輯摘要 -->
            ${location.editorial_summary ? `
              <div class="detail-panel-summary">
                <h3>關於此地點</h3>
                <p>${location.editorial_summary}</p>
              </div>
            ` : ''}
            
            <!-- 互動按鈕 -->
            <div class="detail-panel-actions">
              <h3>我的狀態</h3>
              <div class="action-buttons">
                ${this.renderStatusButtons(location)}
              </div>
            </div>
            
            <!-- 互動統計 -->
            ${location.interaction_counts ? `
              <div class="detail-panel-stats">
                <h3>社群統計</h3>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-number">${location.interaction_counts.visited || 0}</span>
                    <span class="stat-label">來過</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${location.interaction_counts.want_to_visit || 0}</span>
                    <span class="stat-label">想來</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">${location.interaction_counts.want_to_revisit || 0}</span>
                    <span class="stat-label">想再來</span>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
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

  // 創建圖片（含錯誤處理）
  createImageWithFallback(src, alt, className) {
    const defaultImage = 'https://placehold.co/600x400/6B7280/FFFFFF?text=Location+Image';
    
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
      <div class="detail-status-badge ${config.class}">
        ${config.text}
      </div>
    `;
  }

  // 渲染評分星星
  renderRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // 滿星
    for (let i = 0; i < fullStars; i++) {
      stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    
    // 半星
    if (hasHalfStar) {
      stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"/></svg>';
    }
    
    // 空星
    for (let i = 0; i < emptyStars; i++) {
      stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    
    return stars;
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
  renderStatusButtons(location) {
    const styles = this.getStatusButtonStyles(location.user_location_status);
    
    return `
      <button 
        onclick="updateLocationStatus('${location.id}', 'visited', event)"
        class="action-button ${styles.visited}"
      >
        <span>✓</span>
        <span>來過</span>
      </button>
      <button 
        onclick="updateLocationStatus('${location.id}', 'want_to_visit', event)"
        class="action-button ${styles.want_to_visit}"
      >
        <span>❤</span>
        <span>想來</span>
      </button>
      <button 
        onclick="updateLocationStatus('${location.id}', 'want_to_revisit', event)"
        class="action-button ${styles.want_to_revisit}"
      >
        <span>🔄</span>
        <span>想再來</span>
      </button>
    `;
  }
}

// 地點詳情面板管理器
export class LocationDetailManager {
  constructor() {
    this.currentLocation = null;
    this.isVisible = false;
    this.panel = null;
  }

  // 顯示地點詳情
  showLocationDetail(location) {
    this.currentLocation = location;
    this.isVisible = true;
    
    // 創建面板實例
    this.panel = new LocationDetailPanel({
      isVisible: true,
      location: location,
      onClose: () => this.hideLocationDetail(),
      onStatusUpdate: (locationId, status) => this.handleStatusUpdate(locationId, status)
    });
    
    // 渲染面板
    this.renderPanel();
    
    // 添加事件監聽器
    this.addEventListeners();
  }

  // 隱藏地點詳情
  hideLocationDetail() {
    this.isVisible = false;
    this.currentLocation = null;
    
    // 移除面板
    this.removePanel();
    
    // 移除事件監聽器
    this.removeEventListeners();
  }

  // 渲染面板
  renderPanel() {
    if (!this.panel) return;
    
    const panelHTML = this.panel.render();
    
    // 檢查是否已存在面板
    let existingPanel = document.getElementById('location-detail-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // 添加到頁面
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    
    // 觸發動畫
    setTimeout(() => {
      const panel = document.getElementById('location-detail-panel');
      if (panel) {
        panel.classList.add('visible');
      }
    }, 10);
  }

  // 移除面板
  removePanel() {
    const panel = document.getElementById('location-detail-panel');
    if (panel) {
      panel.classList.remove('visible');
      setTimeout(() => {
        panel.remove();
      }, 300); // 等待動畫完成
    }
  }

  // 添加事件監聽器
  addEventListeners() {
    // 遮罩層點擊關閉
    document.addEventListener('click', this.handleOverlayClick.bind(this));
    
    // ESC 鍵關閉
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 移除事件監聽器
  removeEventListeners() {
    document.removeEventListener('click', this.handleOverlayClick.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 處理遮罩層點擊
  handleOverlayClick(event) {
    if (event.target.classList.contains('detail-panel-overlay')) {
      this.hideLocationDetail();
    }
  }

  // 處理鍵盤事件
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.hideLocationDetail();
    }
  }

  // 處理狀態更新
  handleStatusUpdate(locationId, status) {
    // 這裡可以添加狀態更新的邏輯
    console.log('Status update:', locationId, status);
  }
} 