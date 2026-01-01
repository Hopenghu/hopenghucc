/**
 * 圖片優化工具
 * 提供響應式圖片、格式優化和尺寸優化功能
 */

/**
 * 生成響應式圖片 srcset
 * @param {string} baseUrl - 基礎圖片 URL
 * @param {Array<number>} widths - 圖片寬度數組，例如 [400, 800, 1200]
 * @returns {string} srcset 字符串
 */
export function generateSrcset(baseUrl, widths = [400, 800, 1200]) {
  if (!baseUrl) return '';
  
  // 如果 URL 包含查詢參數，需要正確處理
  const url = new URL(baseUrl, 'https://example.com');
  const srcsetParts = widths.map(width => {
    url.searchParams.set('w', width.toString());
    return `${url.toString()} ${width}w`;
  });
  
  return srcsetParts.join(', ');
}

/**
 * 生成圖片尺寸屬性
 * @param {number} width - 圖片寬度
 * @param {number} height - 圖片高度
 * @returns {string} sizes 屬性值
 */
export function generateSizes(width = 800) {
  // 根據常見的響應式斷點生成 sizes
  if (width <= 400) {
    return '100vw';
  } else if (width <= 800) {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  } else {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px';
  }
}

/**
 * 優化圖片 URL（添加尺寸參數）
 * @param {string} imageUrl - 原始圖片 URL
 * @param {number} width - 目標寬度
 * @param {number} height - 目標高度（可選）
 * @returns {string} 優化後的 URL
 */
export function optimizeImageUrl(imageUrl, width, height = null) {
  if (!imageUrl) return '';
  
  try {
    const url = new URL(imageUrl);
    
    // 如果是 Google Places API 圖片，添加 maxwidth 參數
    if (url.hostname.includes('maps.googleapis.com')) {
      url.searchParams.set('maxwidth', width.toString());
      if (height) {
        url.searchParams.set('maxheight', height.toString());
      }
      return url.toString();
    }
    
    // 對於其他圖片服務，可以添加自定義參數
    url.searchParams.set('w', width.toString());
    if (height) {
      url.searchParams.set('h', height.toString());
    }
    
    return url.toString();
  } catch (e) {
    // 如果 URL 解析失敗，返回原始 URL
    console.warn('[ImageOptimizer] Failed to parse URL:', imageUrl, e);
    return imageUrl;
  }
}

/**
 * 檢測瀏覽器是否支持 WebP
 * @param {Request} request - HTTP 請求對象
 * @returns {boolean} 是否支持 WebP
 */
export function supportsWebP(request) {
  const acceptHeader = request.headers.get('Accept') || '';
  return acceptHeader.includes('image/webp');
}

/**
 * 生成響應式圖片 HTML
 * @param {string} imageUrl - 圖片 URL
 * @param {string} alt - 圖片 alt 文本
 * @param {string} className - CSS 類名
 * @param {object} options - 選項
 * @returns {string} HTML 字符串
 */
export function generateResponsiveImage(imageUrl, alt = '', className = '', options = {}) {
  const {
    widths = [400, 800, 1200],
    defaultWidth = 800,
    loading = 'lazy',
    sizes = null
  } = options;
  
  if (!imageUrl) {
    return `<img src="" alt="${alt}" class="${className}" loading="${loading}">`;
  }
  
  // 生成 srcset
  const srcset = generateSrcset(imageUrl, widths);
  const defaultSrc = optimizeImageUrl(imageUrl, defaultWidth);
  const sizesAttr = sizes || generateSizes(defaultWidth);
  
  return `
    <img 
      src="${defaultSrc}" 
      srcset="${srcset}"
      sizes="${sizesAttr}"
      alt="${alt}" 
      class="${className}" 
      loading="${loading}"
    >
  `;
}

/**
 * 生成帶有錯誤處理的響應式圖片 HTML
 * @param {string} imageUrl - 圖片 URL
 * @param {string} alt - 圖片 alt 文本
 * @param {string} className - CSS 類名
 * @param {string} fallbackUrl - 回退圖片 URL
 * @param {object} options - 選項
 * @returns {string} HTML 字符串
 */
export function generateResponsiveImageWithFallback(
  imageUrl, 
  alt = '', 
  className = '', 
  fallbackUrl = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image',
  options = {}
) {
  const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const containerId = `img-container-${imageId}`;
  
  const {
    widths = [400, 800, 1200],
    defaultWidth = 800,
    loading = 'lazy',
    sizes = null,
    showSkeleton = true
  } = options;
  
  if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
    return `
      <div id="${containerId}" class="image-loader-container">
        <img 
          src="${fallbackUrl}" 
          alt="${alt}" 
          class="${className}" 
          style="opacity: 1;"
        >
      </div>
    `;
  }
  
  const srcset = generateSrcset(imageUrl, widths);
  const defaultSrc = optimizeImageUrl(imageUrl, defaultWidth);
  const sizesAttr = sizes || generateSizes(defaultWidth);
  
  const skeletonHtml = showSkeleton ? `
    <div class="image-skeleton absolute inset-0 bg-gray-200 rounded">
      <div class="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
    </div>
  ` : '';
  
  return `
    <div id="${containerId}" class="image-loader-container relative">
      ${skeletonHtml}
      <div class="image-progress absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <img 
        id="${imageId}"
        src="${defaultSrc}" 
        srcset="${srcset}"
        sizes="${sizesAttr}"
        alt="${alt}" 
        class="${className} image-loader-img"
        style="opacity: 0; transition: opacity 0.3s ease-in-out; position: relative; z-index: 1;"
        onerror="handleImageError('${imageId}', '${containerId}', '${fallbackUrl}')"
        onload="handleImageLoad('${imageId}', '${containerId}')"
        loading="${loading}"
      >
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
}

