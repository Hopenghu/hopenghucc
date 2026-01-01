// 圖片預載入工具
// 用於預載入關鍵圖片以提升首屏載入體驗

/**
 * 生成圖片預載入標籤
 * @param {string[]} imageUrls - 要預載入的圖片 URL 陣列
 * @returns {string} HTML 預載入標籤
 */
export function generateImagePreloadTags(imageUrls = []) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return '';
  }

  // 限制預載入圖片數量（避免過多請求）
  const maxPreload = 3;
  const urlsToPreload = imageUrls.slice(0, maxPreload);

  return urlsToPreload
    .map(url => `<link rel="preload" as="image" href="${url}" fetchpriority="high">`)
    .join('\n    ');
}

/**
 * 從地點陣列中提取關鍵圖片 URL（首屏可見的圖片）
 * @param {object[]} locations - 地點物件陣列
 * @param {number} maxImages - 最大圖片數量（預設 3）
 * @returns {string[]} 圖片 URL 陣列
 */
export function extractCriticalImages(locations = [], maxImages = 3) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  const imageUrls = [];
  const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';

  for (let i = 0; i < Math.min(locations.length, maxImages); i++) {
    const location = locations[i];
    const imageUrl = location?.thumbnail_url || location?.photo_url || null;
    
    // 只預載入有效的圖片 URL（排除預設圖片）
    if (imageUrl && imageUrl !== defaultImage && !imageUrl.includes('placehold.co')) {
      imageUrls.push(imageUrl);
    }
  }

  return imageUrls;
}

/**
 * 生成完整的預載入標籤（包含 DNS prefetch）
 * @param {string[]} imageUrls - 圖片 URL 陣列
 * @returns {string} 完整的預載入 HTML
 */
export function generateFullPreloadTags(imageUrls = []) {
  const imageTags = generateImagePreloadTags(imageUrls);
  
  const dnsPrefetchTags = `
    <link rel="dns-prefetch" href="https://maps.googleapis.com">
    <link rel="dns-prefetch" href="https://maps.gstatic.com">
    <link rel="dns-prefetch" href="https://www.gstatic.com">`;

  return imageTags + dnsPrefetchTags;
}

