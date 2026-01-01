// 圖片優化工具函數

/**
 * 檢測瀏覽器是否支援 WebP
 */
export function supportsWebP() {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * 獲取最佳圖片格式 URL
 * 如果瀏覽器支援 WebP，返回 WebP URL，否則返回原始 URL
 */
export function getOptimizedImageUrl(originalUrl, webpUrl = null) {
  if (typeof window === 'undefined') return originalUrl;
  
  // 如果提供了 WebP URL 且瀏覽器支援，使用 WebP
  if (webpUrl && supportsWebP()) {
    return webpUrl;
  }
  
  return originalUrl;
}

/**
 * 使用 IntersectionObserver 實現進階懶載入
 */
export function setupLazyLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // 如果不支援 IntersectionObserver，使用原生 loading="lazy"
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const dataSrc = img.getAttribute('data-src');
        const dataSrcset = img.getAttribute('data-srcset');
        
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
        }
        
        if (dataSrcset) {
          img.srcset = dataSrcset;
          img.removeAttribute('data-srcset');
        }
        
        // 移除 loading="lazy" 以啟用載入
        img.removeAttribute('loading');
        
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px' // 提前 50px 開始載入
  });

  // 觀察所有帶有 data-src 的圖片
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => imageObserver.observe(img));

  return imageObserver;
}

/**
 * 初始化圖片優化功能
 */
export function initImageOptimization() {
  if (typeof window === 'undefined') return;
  
  // 設置懶載入
  setupLazyLoading();
  
  // 檢測 WebP 支援並添加類別到 body
  if (supportsWebP()) {
    document.documentElement.classList.add('webp-supported');
  } else {
    document.documentElement.classList.add('webp-not-supported');
  }
}

