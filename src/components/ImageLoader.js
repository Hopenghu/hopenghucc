// 圖片載入組件 - 包含載入指示器、骨架屏和錯誤處理
export class ImageLoader {
  constructor(src, options = {}) {
    this.src = src;
    this.options = {
      alt: options.alt || '圖片',
      className: options.className || '',
      defaultImage: options.defaultImage || 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image',
      showSkeleton: options.showSkeleton !== false, // 預設顯示骨架屏
      showProgress: options.showProgress !== false, // 預設顯示進度
      onLoad: options.onLoad || null,
      onError: options.onError || null,
      ...options
    };
  }

  // 渲染圖片（含載入指示器和錯誤處理）
  render() {
    const { src, options } = this;
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const containerId = `img-container-${imageId}`;
    
    // 如果沒有圖片URL，直接使用默認圖片
    if (!src || src === 'null' || src === 'undefined') {
      return this.renderDefaultImage(imageId, containerId);
    }
    
    // 如果已經是默認圖片，直接顯示
    if (src.includes('placehold.co')) {
      return this.renderPlaceholderImage(src, imageId, containerId);
    }
    
    // 渲染帶載入指示器的圖片
    return this.renderImageWithLoader(src, imageId, containerId);
  }

  // 渲染默認圖片
  renderDefaultImage(imageId, containerId) {
    return `
      <div id="${containerId}" class="image-loader-container">
        <img 
          id="${imageId}"
          src="${this.options.defaultImage}" 
          alt="${this.options.alt}" 
          class="${this.options.className}"
          style="opacity: 1; transition: opacity 0.3s ease-in-out;"
        >
      </div>
    `;
  }

  // 渲染佔位圖片
  renderPlaceholderImage(src, imageId, containerId) {
    return `
      <div id="${containerId}" class="image-loader-container">
        <img 
          id="${imageId}"
          src="${src}" 
          alt="${this.options.alt}" 
          class="${this.options.className}"
          style="opacity: 1; transition: opacity 0.3s ease-in-out;"
        >
      </div>
    `;
  }

  // 渲染帶載入指示器的圖片
  renderImageWithLoader(src, imageId, containerId) {
    const skeletonHtml = this.options.showSkeleton ? this.renderSkeleton() : '';
    const progressHtml = this.options.showProgress ? this.renderProgress() : '';
    
    return `
      <div id="${containerId}" class="image-loader-container relative">
        ${skeletonHtml}
        ${progressHtml}
        <img 
          id="${imageId}"
          src="${src}" 
          alt="${this.options.alt}" 
          class="${this.options.className} image-loader-img"
          style="opacity: 0; transition: opacity 0.3s ease-in-out;"
          onerror="ImageLoader.handleError('${imageId}', '${containerId}', '${this.options.defaultImage}')"
          onload="ImageLoader.handleLoad('${imageId}', '${containerId}')"
          loading="lazy"
        >
        <div id="error-${imageId}" class="image-error-message hidden">
          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs text-gray-500 mt-1">圖片載入失敗</p>
        </div>
      </div>
    `;
  }

  // 渲染骨架屏
  renderSkeleton() {
    return `
      <div class="image-skeleton absolute inset-0 bg-gray-200 animate-pulse rounded">
        <div class="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
      </div>
    `;
  }

  // 渲染載入進度指示器
  renderProgress() {
    return `
      <div class="image-progress absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
        <div class="image-progress-spinner">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    `;
  }

  // 靜態方法：處理圖片載入成功
  static handleLoad(imageId, containerId) {
    const img = document.getElementById(imageId);
    const container = document.getElementById(containerId);
    
    if (img && container) {
      // 隱藏骨架屏和進度指示器
      const skeleton = container.querySelector('.image-skeleton');
      const progress = container.querySelector('.image-progress');
      const errorMsg = container.querySelector(`#error-${imageId}`);
      
      if (skeleton) skeleton.classList.add('hidden');
      if (progress) progress.classList.add('hidden');
      if (errorMsg) errorMsg.classList.add('hidden');
      
      // 顯示圖片
      img.style.opacity = '1';
    }
  }

  // 靜態方法：處理圖片載入錯誤
  static handleError(imageId, containerId, defaultImage) {
    const img = document.getElementById(imageId);
    const container = document.getElementById(containerId);
    
    if (img && container) {
      // 隱藏骨架屏和進度指示器
      const skeleton = container.querySelector('.image-skeleton');
      const progress = container.querySelector('.image-progress');
      
      if (skeleton) skeleton.classList.add('hidden');
      if (progress) progress.classList.add('hidden');
      
      // 顯示錯誤訊息
      const errorMsg = container.querySelector(`#error-${imageId}`);
      if (errorMsg) {
        errorMsg.classList.remove('hidden');
      }
      
      // 嘗試載入默認圖片
      if (img.src !== defaultImage) {
        img.onerror = null; // 防止無限循環
        img.src = defaultImage;
        img.style.opacity = '1';
      } else {
        // 如果默認圖片也載入失敗，至少顯示錯誤訊息
        img.style.opacity = '0.3';
      }
    }
  }
}

// 導出便捷函數
export function createImageWithLoader(src, alt, className, options = {}) {
  const loader = new ImageLoader(src, {
    alt,
    className,
    ...options
  });
  return loader.render();
}

