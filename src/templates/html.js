// src/templates/html.js
// Module for generating basic HTML page strings

// --- Reusable Type Translation Logic --- 
const placeTypeTranslations = {
    'bar': '酒吧',
    'restaurant': '餐廳',
    'cafe': '咖啡廳',
    'store': '商店',
    'supermarket': '超市',
    'convenience_store': '便利商店',
    'department_store': '百貨公司',
    'shopping_mall': '購物中心',
    'lodging': '住宿',
    'hotel': '飯店',
    'point_of_interest': '景點',
    'tourist_attraction': '旅遊景點',
    'park': '公園',
    'museum': '博物館',
    'library': '圖書館',
    'school': '學校',
    'hospital': '醫院',
    'train_station': '火車站',
    'bus_station': '公車站',
    'airport': '機場',
    'bank': '銀行',
    'post_office': '郵局',
    'gas_station': '加油站',
    'establishment': '場所' 
};

// Helper function to translate types (accessible module-wide)
function translatePlaceTypes(typesArray) {
    if (!typesArray || typesArray.length === 0) return '-';

    const translatedTypes = typesArray
        .map(type => placeTypeTranslations[type] || null) 
        .filter(translated => translated !== null && translated !== '場所');

    return translatedTypes.length > 0 ? translatedTypes.join(', ') : '其他'; 
}
// --- END Reusable Type Translation Logic --- 

// --- Shared HTML Components --- 

// Removed getHeaderHtml

// --- NEW: Fixed Header --- 
const getFixedHeaderHtml = () => `
<header class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm flex items-center justify-center h-16 z-40" style="height: 64px;">
  <a href="/" class="text-2xl font-bold text-blue-600">HOPENGHU</a>
  <!-- Add search icon/bar later if needed -->
</header>
`;
// --- END NEW: Fixed Header --- 

const getFooterHtml = () => `
<footer class="bg-gray-200 text-gray-600 p-4 mt-auto w-full text-center">
  <div class="container mx-auto">
    © ${new Date().getFullYear()} Hopenghu. All rights reserved.
  </div>
</footer>
`;

// --- NEW: Bottom Navigation --- 
const getBottomNavHtml = (user) => {
  console.log('[getBottomNavHtml] User object:', user ? { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } : 'null');
  return `
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md flex justify-around items-center h-16 z-50" style="height: 64px;">
  <a href="/" class="flex flex-col items-center text-gray-700 hover:text-blue-600 p-2">
    <!-- Placeholder icon (replace with SVG/Icon font later) -->
    <span class="text-xl">🏠</span> 
    <span class="text-xs mt-1">首頁</span>
  </a>
  <a href="/add-place" class="flex flex-col items-center text-gray-700 hover:text-blue-600 p-2">
    <span class="text-xl">➕</span>
    <span class="text-xs mt-1">新增地點</span>
  </a>
  ${user ? `<a href="/itinerary" class="flex flex-col items-center text-gray-700 hover:text-blue-600 p-2">
    <span class="text-xl">🗺️</span>
    <span class="text-xs mt-1">行程規劃</span>
  </a>` : `<a href="#" class="flex flex-col items-center text-gray-700 hover:text-blue-600 p-2"> <!-- Placeholder link for 優惠 -->
    <span class="text-xl">🏷️</span>
    <span class="text-xs mt-1">優惠</span>
  </a>`}
  ${user 
    ? `<div class="relative flex flex-col items-center p-2">
         <div id="bottom-avatar-container" role="button" tabindex="0" aria-label="User menu" class="focus:outline-none cursor-pointer">
           ${user.avatar_url 
             ? `<img src="${user.avatar_url}" alt="User Avatar" class="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-blue-600 transition-colors duration-200">` 
             : `<span class="w-8 h-8 rounded-full bg-blue-500 text-white text-center font-bold text-sm leading-8 flex items-center justify-center">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>`
           }
         </div>
         <span class="text-xs mt-1 text-gray-700">我的</span>
         
         <div id="bottom-user-dropdown-menu" class="hidden absolute bottom-full right-0 mb-2 min-w-[180px] bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200" style="bottom: calc(100% + 8px);">
           <div class="px-4 py-2 border-b border-gray-200">
             <p class="text-sm font-medium text-gray-900 truncate">${user.name || 'User'}</p>
             <p class="text-sm text-gray-500 truncate">${user.email || ''}</p>
           </div>
           <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">我的地點</a>
           <a href="/itinerary" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">我的行程</a>
           <a href="/google-info" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">我的帳號</a>
           <div class="border-t border-gray-200 my-1"></div>
           <button id="bottom-logout-button" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">登出</button>
         </div>
       </div>`
    : `<a href="/api/auth/google" class="flex flex-col items-center text-gray-700 hover:text-blue-600 p-2">
         <span class="text-xl">➡️</span>
         <span class="text-xs mt-1">登入</span>
       </a>`
  }
</nav>
`;
}
// --- END NEW: Bottom Navigation ---

// Bottom Navigation User Dropdown Menu Script
const getBottomNavScript = () => `
<script>
  // Bottom Navigation User Dropdown Menu Logic
  (function() {
    const avatarContainer = document.getElementById('bottom-avatar-container');
    const dropdownMenu = document.getElementById('bottom-user-dropdown-menu');
    const logoutButton = document.getElementById('bottom-logout-button');

    if (avatarContainer && dropdownMenu) {
      avatarContainer.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
      });
      
      avatarContainer.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          dropdownMenu.classList.toggle('hidden');
        }
      });
      
      document.addEventListener('click', (event) => {
        if (!dropdownMenu.contains(event.target) && !avatarContainer.contains(event.target)) {
          dropdownMenu.classList.add('hidden');
        }
      });
      
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !dropdownMenu.classList.contains('hidden')) {
          dropdownMenu.classList.add('hidden');
          avatarContainer.focus();
        }
      });
    }

    // Logout button handler
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            window.location.href = '/';
          } else {
            console.error('Logout failed:', await response.text());
            alert('登出失敗，請稍後再試。');
          }
        } catch (error) {
          console.error('Error logging out:', error);
          alert('登出時發生錯誤。');
        }
      });
    }

    // 全局圖片載入處理函數
    window.handleImageLoad = function(imageId, containerId) {
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
    };

    window.handleImageError = function(imageId, containerId, defaultImage) {
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
    };

    // 進階懶載入（使用 IntersectionObserver）
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              img.removeAttribute('loading');
              observer.unobserve(img);
            }
          }
        });
      }, { rootMargin: '50px' });

      // 在 DOM 載入完成後觀察所有帶有 data-src 的圖片
      function observeLazyImages() {
        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeLazyImages);
      } else {
        observeLazyImages();
      }
    }

    // 檢測 WebP 支援
    (function() {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
        document.documentElement.classList.add('webp-supported');
      } else {
        document.documentElement.classList.add('webp-not-supported');
      }
    })();
  })();
</script>
`; 

// 關鍵 CSS（首屏渲染必需）
const criticalCSS = `
/* ===== CRITICAL CSS - Above the fold ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --header-height: 64px;
  --nav-height: 64px;
  --total-fixed-height: calc(var(--header-height) + var(--nav-height));
  --main-available-height: calc(100vh - var(--header-height) + var(--nav-height));
  --main-padding: 1rem;
  --main-padding-md: 2rem;
}

html, body {
  height: 100%;
  overflow-x: hidden;
}

body {
  display: flex;
  flex-direction: column;
  background-color: #f3f4f6;
  color: #1f2937;
  font-family: 'Noto Sans TC', sans-serif;
  line-height: 1.6;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

main {
  flex: 1;
  margin-top: var(--header-height);
  margin-bottom: var(--nav-height);
  min-height: var(--main-available-height);
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.image-loader-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  z-index: 1;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.image-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 2;
}

.image-loader-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.page-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--main-padding);
  min-height: var(--main-available-height);
}

@media (min-width: 768px) {
  .page-container {
    padding: var(--main-padding-md);
  }
}

.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.aspect-\\[3\\/4\\] {
  aspect-ratio: 3 / 4;
}
`;

// Wrapper function - Takes title, main content HTML, user state, and bundled CSS
const wrapPageHtml = (title, mainContentHtml, user, bundledCss = '') => {
  console.log('[wrapPageHtml] User object:', user ? { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } : 'null');
  return `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Hopenghu</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <!-- Critical CSS - Inline for faster rendering -->
    <style id="critical-css">
      ${criticalCSS}
    </style>
    <!-- Non-critical CSS - Loaded asynchronously -->
    <style id="non-critical-css" media="print" onload="this.media='all'; this.onload=null;">
      /* Inject bundled Tailwind CSS */
      ${bundledCss}
      
      /* ===== GLOBAL LAYOUT SYSTEM ===== */
      
      /* CSS Reset for consistent box model */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      /* Layout System Variables */
      :root {
        --header-height: 64px;
        --nav-height: 64px;
        --total-fixed-height: calc(var(--header-height) + var(--nav-height));
        --main-available-height: calc(100vh - var(--total-fixed-height));
        --main-padding: 1rem;
        --main-padding-md: 2rem;
      }
      
      /* Global Layout Structure */
      html, body {
        height: 100%;
        overflow-x: hidden;
      }
      
      body { 
        display: flex; 
        flex-direction: column; 
        background-color: #f3f4f6;
        color: #1f2937;
      }
      
      /* Fixed Header - Always at top */
      header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: var(--header-height);
        background: white;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Fixed Navigation - Always at bottom */
      nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--nav-height);
        background: white;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      
      /* Main Content Area - Between header and nav */
      main {
        flex: 1;
        margin-top: var(--header-height);
        margin-bottom: var(--nav-height);
        min-height: var(--main-available-height);
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
      }
      
      /* Standard Page Layout */
      .page-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--main-padding);
        min-height: var(--main-available-height);
      }
      
      @media (min-width: 768px) {
        .page-container {
          padding: var(--main-padding-md);
        }
      }
      
      /* Full Screen Layout (for add-place page) */
      .fullscreen-container {
        width: 100%;
        height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      
      /* ===== UTILITY CLASSES ===== */
      
      /* Line Clamp Utilities */
      .line-clamp-1 {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
      }
      
      .line-clamp-2 {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      
      .line-clamp-3 {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }
      
      /* Aspect Ratio Utilities */
      .aspect-\\[3\\/4\\] {
        aspect-ratio: 3 / 4;
      }
      
      /* ===== RESPONSIVE DESIGN ===== */
      
      /* Mobile First Approach */
      @media (max-width: 640px) {
        /* Mobile specific styles */
        .mobile-full-width {
          width: 100vw;
          margin-left: calc(-50vw + 50%);
        }
      }
      
      /* Tablet and Desktop */
      @media (min-width: 768px) {
        /* Tablet specific styles */
      }
      
      @media (min-width: 1024px) {
        /* Desktop specific styles */
      }
      
      /* ===== ANIMATIONS ===== */
      
      /* Smooth transitions */
      .transition-shadow {
        transition: box-shadow 0.2s ease-in-out;
      }
      
      .transition-colors {
        transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
      }
      
      /* ===== CUSTOM SCROLLBAR ===== */
      
      /* Webkit browsers */
      ::-webkit-scrollbar {
        width: 6px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: #c1c1c1 #f1f1f1;
      }
    </style>
    <noscript>
      <style id="non-critical-css-fallback">
        /* Inject bundled Tailwind CSS */
        ${bundledCss}
      </style>
    </noscript>
    <!-- Preload critical resources -->
    <link rel="preload" as="image" href="https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image">
    <link rel="dns-prefetch" href="https://maps.googleapis.com">
    <link rel="dns-prefetch" href="https://maps.gstatic.com">
    <link rel="dns-prefetch" href="https://www.gstatic.com">
</head>
<body>
    ${getFixedHeaderHtml()}
    
    <main>
        ${mainContentHtml}
    </main>
    
    ${getBottomNavHtml(user)}
    ${getBottomNavScript()}
</body>
</html>
`;
};

// 改進的圖片錯誤處理函數（使用新的 ImageLoader 組件）
function createImageWithFallback(src, alt, className, locationName) {
    // 更溫和的備用圖片策略
    const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const containerId = `img-container-${imageId}`;
    
    // 如果沒有圖片URL，直接使用默認圖片
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
    
    // 如果已經是默認圖片，直接顯示
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
    
    // 對於所有其他圖片（包括代理URL），使用改進的載入指示器
    return `
        <div id="${containerId}" class="image-loader-container relative">
            <!-- 骨架屏 -->
            <div class="image-skeleton absolute inset-0 bg-gray-200 animate-pulse rounded">
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
    `;
}

// --- Page Specific Content Generators --- 

/**
 * Generates only the main content HTML for the homepage.
 * @param {object[]} locations Array of location objects (general locations).
 * @returns {string} HTML string for the main content.
 */
export function getHomePageContent(locations = [], userLocationCounts = null, locationInteractionCounts = {}, userLocationStatuses = {}) {
  const content = `
    <div class="w-full h-full relative overflow-hidden">
        <div class="w-full h-full overflow-y-auto pb-20">
            <div class="w-full px-2 py-4">
                <h1 class="text-2xl font-bold text-gray-800 mb-4 px-2">我的地點</h1>
            </div>
        </div>
    </div>
  `;
  return content;
}

// 渲染地點網格的輔助函數 - 小紅書風格直屏佈局
function renderLocationGrid(locations, category, userLocationStatuses, locationInteractionCounts) {
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
    <!-- 小紅書風格瀑布流佈局 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
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
        
        // 獲取當前用戶對此地點的狀態
        const userStatus = userLocationStatuses[loc.id] || null;
        
        // 獲取此地點的點擊統計數字
        const locationCounts = locationInteractionCounts[loc.id] || { visited: 0, want_to_visit: 0, want_to_revisit: 0 };
        const visitedCount = locationCounts.visited || 0;
        const wantToVisitCount = locationCounts.want_to_visit || 0;
        const wantToRevisitCount = locationCounts.want_to_revisit || 0;
        
        // 根據用戶狀態決定按鈕樣式
        const visitedButtonClass = userStatus === 'visited' 
          ? 'bg-green-500 text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-green-100';
        const wantToVisitButtonClass = userStatus === 'want_to_visit' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-blue-100';
        const wantToRevisitButtonClass = userStatus === 'want_to_revisit' 
          ? 'bg-purple-500 text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-purple-100';
        
        return `
        <!-- 小紅書風格卡片 -->
        <div class="location-card bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-md transition-shadow duration-200 cursor-pointer" data-location-id="${loc.id}">
          <!-- 圖片區域 - 直屏比例 -->
          <div class="relative aspect-[3/4] overflow-hidden">
            ${createImageWithFallback(
              loc.thumbnail_url || 'https://placehold.co/400x533/png?text=No+Image',
              loc.name || '地點照片',
              'w-full h-full object-cover',
              loc.name || '未命名地點'
            )}
            <!-- 類型標籤 -->
            <div class="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              ${displayTypes.split(',')[0] || '景點'}
            </div>
          </div>
          
          <!-- 內容區域 -->
          <div class="p-3 flex-grow flex flex-col">
            <!-- 標題和地址 -->
            <h3 class="text-sm font-semibold mb-1 line-clamp-2 leading-tight" title="${loc.name || '未命名地點'}">${loc.name || '未命名地點'}</h3>
            <p class="text-xs text-gray-500 mb-2 line-clamp-1" title="${loc.address || '無地址資訊'}">${loc.address || '無地址資訊'}</p>
            
            <!-- 簡介（如果有的話） -->
            ${loc.editorial_summary ? `<p class="text-xs text-gray-600 mb-2 line-clamp-2 leading-tight" title="${loc.editorial_summary}">${loc.editorial_summary}</p>` : ''}
            
            <!-- 互動按鈕 - 小紅書風格 -->
            <div class="mt-auto pt-2">
              <div class="flex flex-wrap gap-1">
                <button 
                  onclick='event.stopPropagation(); updateLocationStatus("${loc.id}", "visited", event)'
                  class="flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${visitedButtonClass}"
                >
                  <span>來過</span>
                  <span>${visitedCount}</span>
                </button>
                <button 
                  onclick='event.stopPropagation(); updateLocationStatus("${loc.id}", "want_to_visit", event)'
                  class="flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${wantToVisitButtonClass}"
                >
                  <span>想來</span>
                  <span>${wantToVisitCount}</span>
                </button>
                <button 
                  onclick='event.stopPropagation(); updateLocationStatus("${loc.id}", "want_to_revisit", event)'
                  class="flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${wantToRevisitButtonClass}"
                >
                  <span>想再來</span>
                  <span>${wantToRevisitCount}</span>
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

// 渲染地點網格的輔助函數 - 小紅書風格直屏佈局（已移除重複定義，使用第449行的版本）

// 獲取分類名稱的輔助函數
function getCategoryName(category) {
  const categoryNames = {
    'visited': '來過',
    'want_to_visit': '想來',
    'want_to_revisit': '想再來',
    'created': '建立',
    'all': '所有'
  };
  return categoryNames[category] || category;
}

/**
 * Generates only the main content HTML for the Google Info/Login Success page.
 * @param {object|null} user User object or null.
 * @returns {string} HTML string for the main content.
 */
export function getGoogleInfoContent(user) {
   const userName = user ? (user.name || user.email) : 'Guest';
   return `
    <div class="text-center bg-white p-8 rounded shadow-md">
        <h1 class="text-2xl font-semibold text-green-600 mb-4">Google Login Successful!</h1>
        <p class="mb-4">Welcome, ${userName}!</p>
        <p class="mb-6 text-gray-600">You have been successfully authenticated.</p>
        <a href="/" class="text-blue-500 hover:underline">Go back home</a>
    </div>
   `;
}

/**
 * Generates only the main content HTML for the User Profile page.
 * @param {object} user User object (assumed to be valid and passed).
 * @param {object[]} locations Array of the user's specific locations.
 * @returns {string} HTML string for the main content.
 */
export function getProfilePageContent(user, locations = [], userLocationCounts = null, locationInteractionCounts = {}, userLocationStatuses = {}) {
  if (!user) return `<p>Error: User data is missing.</p>`; 

  const displayName = user.name ? String(user.name).replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/A';
  const displayEmail = user.email ? String(user.email).replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/A';
  const avatarUrl = user.avatar_url ? String(user.avatar_url) : ''; 

  // 分類地點
  const visitedLocations = locations.filter(loc => userLocationStatuses[loc.id] === 'visited');
  const wantToVisitLocations = locations.filter(loc => userLocationStatuses[loc.id] === 'want_to_visit');
  const wantToRevisitLocations = locations.filter(loc => userLocationStatuses[loc.id] === 'want_to_revisit');
  
  // 使用 userLocationCounts 來獲取「我建立」的數量，而不是從 locations 數組中過濾
  const createdCount = userLocationCounts ? userLocationCounts.created || 0 : 0;
  // 從 locations 數組中找出用戶創建的地點
  const createdLocations = locations.filter(loc => loc.created_by_user_id === user.id);

  const content = `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- 用戶資訊區域 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex items-center space-x-4">
          ${avatarUrl ? 
            `<img src="${avatarUrl}" alt="User Avatar" class="w-16 h-16 rounded-full object-cover">` : 
            `<span class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-semibold text-white">${displayName.charAt(0).toUpperCase()}</span>`
          }
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${displayName || '使用者'}</h1>
            <p class="text-gray-600">${displayEmail || '電子郵件未提供'}</p>
            <div class="flex space-x-4 mt-2 text-sm text-gray-500">
              <span>來過: ${visitedLocations.length}</span>
              <span>想來: ${wantToVisitLocations.length}</span>
              <span>想再來: ${wantToRevisitLocations.length}</span>
              <span>我建立: ${createdCount}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的地點分類標籤 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">我的地點</h2>
        <div class="flex flex-wrap gap-2 mb-6">
          <button onclick='showLocationCategory("visited")' class="location-tab active px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium transition-colors">
            來過 (${visitedLocations.length})
          </button>
          <button onclick='showLocationCategory("want_to_visit")' class="location-tab px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
            想來 (${wantToVisitLocations.length})
          </button>
          <button onclick='showLocationCategory("want_to_revisit")' class="location-tab px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
            想再來 (${wantToRevisitLocations.length})
          </button>
          <button onclick='showLocationCategory("created")' class="location-tab px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-colors">
            我建立 (${createdCount})
          </button>
        </div>

        <!-- 來過的地點 -->
        <div id="visited-locations" class="location-category">
          ${renderLocationGrid(visitedLocations, 'visited', userLocationStatuses, locationInteractionCounts)}
        </div>

        <!-- 想來的地點 -->
        <div id="want_to_visit-locations" class="location-category" style="display: none;">
          ${renderLocationGrid(wantToVisitLocations, 'want_to_visit', userLocationStatuses, locationInteractionCounts)}
        </div>

        <!-- 想再來的地點 -->
        <div id="want_to_revisit-locations" class="location-category" style="display: none;">
          ${renderLocationGrid(wantToRevisitLocations, 'want_to_revisit', userLocationStatuses, locationInteractionCounts)}
        </div>

        <!-- 我建立的地點 -->
        <div id="created-locations" class="location-category" style="display: none;">
          ${renderLocationGrid(createdLocations, 'created', userLocationStatuses, locationInteractionCounts)}
        </div>
      </div>
    </div>
    
    <!-- 地點詳情側邊欄 - 桌機版 -->
    <div id="location-detail-sidebar" class="fixed top-0 right-0 w-1/4 h-full bg-white shadow-lg transform translate-x-full transition-transform duration-300 ease-in-out z-50 hidden lg:block">
      <div id="location-detail-content" class="h-full overflow-y-auto">
        <!-- 地點詳情內容將在這裡動態插入 -->
      </div>
    </div>
    
    <!-- 地點詳情模態框 - 手機版 -->
    <div id="location-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden lg:hidden">
      <div class="w-full h-full bg-white transform translate-y-full transition-transform duration-300 ease-in-out">
        <div class="flex items-center p-4 border-b border-gray-200">
          <button id="close-location-detail" class="flex items-center text-gray-600 hover:text-gray-800">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span>返回</span>
          </button>
        </div>
        <div id="location-detail-modal-content" class="h-full overflow-y-auto">
          <!-- 地點詳情內容將在這裡動態插入 -->
        </div>
      </div>
    </div>
    
    <!-- 遮罩層 - 桌機版點擊關閉 -->
    <div id="location-detail-overlay" class="fixed inset-0 bg-black bg-opacity-25 z-40 hidden lg:block" style="display: none;"></div>

    <script>
      // 地點類型翻譯對象
      const placeTypeTranslations = {
        'accounting': '會計',
        'airport': '機場',
        'amusement_park': '遊樂園',
        'aquarium': '水族館',
        'art_gallery': '藝廊',
        'atm': 'ATM',
        'bakery': '麵包店',
        'bank': '銀行',
        'bar': '酒吧',
        'beauty_salon': '美容院',
        'bicycle_store': '腳踏車店',
        'book_store': '書店',
        'bowling_alley': '保齡球館',
        'bus_station': '公車站',
        'cafe': '咖啡廳',
        'car_dealer': '汽車經銷商',
        'car_rental': '租車',
        'car_repair': '汽車維修',
        'car_wash': '洗車',
        'casino': '賭場',
        'cemetery': '墓園',
        'church': '教堂',
        'city_hall': '市政府',
        'clothing_store': '服飾店',
        'convenience_store': '便利商店',
        'courthouse': '法院',
        'dentist': '牙醫',
        'department_store': '百貨公司',
        'doctor': '醫生',
        'drugstore': '藥局',
        'electrician': '電工',
        'electronics_store': '電子用品店',
        'embassy': '大使館',
        'fire_station': '消防局',
        'florist': '花店',
        'funeral_home': '殯儀館',
        'furniture_store': '家具店',
        'gas_station': '加油站',
        'gym': '健身房',
        'hair_care': '美髮',
        'hardware_store': '五金行',
        'hindu_temple': '印度廟',
        'home_goods_store': '家居用品店',
        'hospital': '醫院',
        'insurance_agency': '保險公司',
        'jewelry_store': '珠寶店',
        'laundry': '洗衣店',
        'lawyer': '律師',
        'library': '圖書館',
        'light_rail_station': '輕軌站',
        'liquor_store': '酒類專賣店',
        'local_government_office': '政府機關',
        'locksmith': '鎖匠',
        'lodging': '住宿',
        'meal_delivery': '外送',
        'meal_takeaway': '外帶',
        'mosque': '清真寺',
        'movie_rental': '影片出租',
        'movie_theater': '電影院',
        'moving_company': '搬家公司',
        'museum': '博物館',
        'night_club': '夜店',
        'painter': '油漆工',
        'park': '公園',
        'parking': '停車場',
        'pet_store': '寵物店',
        'pharmacy': '藥房',
        'physiotherapist': '物理治療師',
        'plumber': '水電工',
        'police': '警察局',
        'post_office': '郵局',
        'primary_school': '小學',
        'real_estate_agency': '房地產公司',
        'restaurant': '餐廳',
        'roofing_contractor': '屋頂承包商',
        'rv_park': '露營車公園',
        'school': '學校',
        'secondary_school': '中學',
        'shoe_store': '鞋店',
        'shopping_mall': '購物中心',
        'spa': 'SPA',
        'stadium': '體育場',
        'storage': '倉儲',
        'store': '商店',
        'subway_station': '地鐵站',
        'supermarket': '超市',
        'synagogue': '猶太教堂',
        'taxi_stand': '計程車站',
        'tourist_attraction': '觀光景點',
        'train_station': '火車站',
        'transit_station': '大眾運輸站',
        'travel_agency': '旅行社',
        'university': '大學',
        'veterinary_care': '獸醫',
        'zoo': '動物園',
        'point_of_interest': '景點',
        'establishment': '場所'
      };

      // 地點類型翻譯函數
      function translatePlaceTypes(typesArray) {
        if (!typesArray || typesArray.length === 0) return '-';

        const translatedTypes = typesArray
          .map(type => placeTypeTranslations[type] || null) 
          .filter(translated => translated !== null && translated !== '場所');

        return translatedTypes.length > 0 ? translatedTypes.join(', ') : '其他'; 
      }

      // 分類標籤切換功能
      function showLocationCategory(category) {
        // 隱藏所有分類
        const categories = ['visited', 'want_to_visit', 'want_to_revisit', 'created'];
        categories.forEach(cat => {
          const element = document.getElementById(cat + '-locations');
          if (element) element.style.display = 'none';
        });
        
        // 顯示選中的分類
        const selectedElement = document.getElementById(category + '-locations');
        if (selectedElement) selectedElement.style.display = 'block';
        
        // 更新標籤樣式
        const tabs = document.querySelectorAll('.location-tab');
        tabs.forEach(tab => {
          tab.classList.remove('active', 'bg-blue-500', 'text-white');
          tab.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        // 激活選中的標籤
        const activeTab = event.target;
        activeTab.classList.remove('bg-gray-200', 'text-gray-700');
        activeTab.classList.add('active', 'bg-blue-500', 'text-white');
        
        // 重新添加地點卡片點擊事件
        setTimeout(() => {
          addLocationCardListeners();
        }, 100);
      }

      // 更新地點狀態
      function updateLocationStatus(locationId, newStatus) {
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
            const button = event.target.closest('button');
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
            
            // 更新統計數字
            updateLocationInteractionCounts(locationId);
            
            // 重新載入頁面以更新分類統計
            setTimeout(() => {
              location.reload();
            }, 500);
          } else {
            alert('更新失敗: ' + data.error);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('更新失敗，請稍後再試');
        });
      }
      
      // 更新特定地點卡片的統計數字顯示
      async function updateLocationInteractionCounts(locationId, event) {
        try {
          const response = await fetch('/api/location/' + locationId + '/interaction-counts');
          if (response.ok) {
            const counts = await response.json();
            
            // 更新本地數據
            locationInteractionCountsData[locationId] = counts;
            
            // 找到當前地點卡片的所有按鈕
            const locationCard = event ? event.target.closest('.location-card') : null;
            if (locationCard) {
              const visitedButton = locationCard.querySelector('button[onclick*="visited"]');
              const wantToVisitButton = locationCard.querySelector('button[onclick*="want_to_visit"]');
              const wantToRevisitButton = locationCard.querySelector('button[onclick*="want_to_revisit"]');
              
              if (visitedButton) {
                const span = visitedButton.querySelector('span:last-child');
                if (span) {
                  span.textContent = '(' + (counts.visited || 0) + ')';
                }
              }
              
              if (wantToVisitButton) {
                const span = wantToVisitButton.querySelector('span:last-child');
                if (span) {
                  span.textContent = '(' + (counts.want_to_visit || 0) + ')';
                }
              }
              
              if (wantToRevisitButton) {
                const span = wantToRevisitButton.querySelector('span:last-child');
                if (span) {
                  span.textContent = '(' + (counts.want_to_revisit || 0) + ')';
                }
              }
            }
          }
        } catch (error) {
          console.error('Error updating location interaction counts:', error);
        }
      }
      
      // 地點詳情管理
      let currentLocationDetail = null;
      
      // 獲取地點數據（從服務器獲取）
      async function getLocationById(locationId) {
        try {
          const response = await fetch('/api/locations/' + locationId + '/details');
          if (response.ok) {
            return await response.json();
          } else {
            console.error('Failed to fetch location details:', response.status);
            return null;
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
          return null;
        }
      }
      
      // 顯示地點詳情
      async function showLocationDetail(locationId) {
        // 獲取地點數據
        const location = await getLocationById(locationId);
        if (!location) {
          alert('無法獲取地點詳情，請稍後再試');
          return;
        }
        
        currentLocationDetail = location;
        
        // 桌機版：顯示側邊欄
        if (window.innerWidth >= 1024) {
          const sidebar = document.getElementById('location-detail-sidebar');
          const overlay = document.getElementById('location-detail-overlay');
          const content = document.getElementById('location-detail-content');
          
          content.innerHTML = generateLocationDetailHtml(location);
          sidebar.classList.remove('translate-x-full');
          overlay.style.display = 'block';
          
          // 點擊遮罩關閉
          overlay.onclick = hideLocationDetail;
        } else {
          // 手機版：顯示模態框
          const modal = document.getElementById('location-detail-modal');
          const modalContent = document.getElementById('location-detail-modal-content');
          
          modalContent.innerHTML = generateLocationDetailHtml(location);
          modal.classList.remove('hidden');
          
          // 動畫顯示
          setTimeout(() => {
            const modalInner = modal.querySelector('.bg-white');
            modalInner.classList.remove('translate-y-full');
          }, 10);
        }
      }
      
      // 隱藏地點詳情
      function hideLocationDetail() {
        currentLocationDetail = null;
        
        // 桌機版：隱藏側邊欄
        if (window.innerWidth >= 1024) {
          const sidebar = document.getElementById('location-detail-sidebar');
          const overlay = document.getElementById('location-detail-overlay');
          
          sidebar.classList.add('translate-x-full');
          overlay.style.display = 'none';
        } else {
          // 手機版：隱藏模態框
          const modal = document.getElementById('location-detail-modal');
          const modalInner = modal.querySelector('.bg-white');
          
          modalInner.classList.add('translate-y-full');
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 300);
        }
      }
      
      // 生成地點詳情 HTML
      function generateLocationDetailHtml(location) {
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
        
        // 獲取用戶狀態和互動統計
        const userStatus = location.userStatus || null;
        const interactionCounts = location.interactionCounts || { visited: 0, want_to_visit: 0, want_to_revisit: 0 };
        
        // 確定按鈕樣式
        const getButtonClass = (status, currentStatus) => {
          if (currentStatus === status) {
            if (status === 'visited') return 'bg-green-500 text-white';
            if (status === 'want_to_visit') return 'bg-blue-500 text-white';
            if (status === 'want_to_revisit') return 'bg-purple-500 text-white';
          }
          return 'bg-gray-200 text-gray-700 hover:bg-gray-100';
        };
        
        const imgSrc = location.thumbnail_url || 'https://placehold.co/600x450/png?text=No+Image';
        const imgAlt = location.name || '地點照片';
        const locationName = location.name || '未命名地點';
        const locationAddress = location.address || '無地址資訊';
        const firstType = displayTypes.split(',')[0] || '景點';
        const visitedClass = getButtonClass('visited', userStatus);
        const wantToVisitClass = getButtonClass('want_to_visit', userStatus);
        const wantToRevisitClass = getButtonClass('want_to_revisit', userStatus);
        const visitedCount = interactionCounts.visited || 0;
        const wantToVisitCount = interactionCounts.want_to_visit || 0;
        const wantToRevisitCount = interactionCounts.want_to_revisit || 0;
        const summaryHtml = location.editorial_summary ? 
          '<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-2">簡介</h3><p class="text-gray-700 leading-relaxed">' + 
          location.editorial_summary.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
          '</p></div>' : '';
        
        return '<div class="p-6">' +
          '<!-- 地點圖片 -->' +
          '<div class="relative aspect-[4/3] overflow-hidden rounded-lg mb-6">' +
          '<img src="' + imgSrc + '" alt="' + imgAlt + '" class="w-full h-full object-cover" ' +
          'onerror="this.src=\'https://placehold.co/600x450/png?text=No+Image\'">' +
          '<!-- 類型標籤 -->' +
          '<div class="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">' +
          firstType + '</div></div>' +
          '<!-- 地點標題 -->' +
          '<h2 class="text-2xl font-bold text-gray-900 mb-2">' + locationName.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h2>' +
          '<!-- 地址 -->' +
          '<p class="text-gray-600 mb-4">📍 ' + locationAddress.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
          '<!-- 類型 -->' +
          '<p class="text-sm text-gray-500 mb-4">類型: ' + displayTypes + '</p>' +
          '<!-- 簡介 -->' + summaryHtml +
          '<!-- 互動按鈕 -->' +
          '<div class="border-t border-gray-200 pt-6">' +
          '<h3 class="text-lg font-semibold text-gray-900 mb-4">您的狀態</h3>' +
          '<div class="flex flex-wrap gap-3">' +
          '<button onclick=\'updateLocationStatus("' + location.id + '", "visited")\' ' +
          'class="flex items-center space-x-2 px-4 py-2 rounded-full text-sm transition-colors ' + visitedClass + '">' +
          '<span>來過</span><span class="bg-white px-2 py-1 rounded-full text-xs">' + visitedCount + '</span></button>' +
          '<button onclick=\'updateLocationStatus("' + location.id + '", "want_to_visit")\' ' +
          'class="flex items-center space-x-2 px-4 py-2 rounded-full text-sm transition-colors ' + wantToVisitClass + '">' +
          '<span>想來</span><span class="bg-white px-2 py-1 rounded-full text-xs">' + wantToVisitCount + '</span></button>' +
          '<button onclick=\'updateLocationStatus("' + location.id + '", "want_to_revisit")\' ' +
          'class="flex items-center space-x-2 px-4 py-2 rounded-full text-sm transition-colors ' + wantToRevisitClass + '">' +
          '<span>想再來</span><span class="bg-white px-2 py-1 rounded-full text-xs">' + wantToRevisitCount + '</span></button>' +
          '</div></div></div>';
      }
      
      // 初始化事件監聽器
      document.addEventListener('DOMContentLoaded', function() {
        // 手機版關閉按鈕
        const closeButton = document.getElementById('close-location-detail');
        if (closeButton) {
          closeButton.addEventListener('click', hideLocationDetail);
        }
        
        // 為所有地點卡片添加點擊事件
        addLocationCardListeners();
      });
      
      // 動態添加地點卡片點擊事件（用於動態加載的內容）
      function addLocationCardListeners() {
        document.querySelectorAll('.location-card').forEach(card => {
          // 移除舊的事件監聽器
          card.removeEventListener('click', handleLocationCardClick);
          // 添加新的事件監聽器
          card.addEventListener('click', handleLocationCardClick);
        });
      }
      
      // 地點卡片點擊處理函數
      function handleLocationCardClick(e) {
        // 如果點擊的是互動按鈕，不觸發詳情顯示
        if (e.target.closest('button')) return;
        
        const locationId = this.dataset.locationId;
        if (locationId) {
          showLocationDetail(locationId);
        }
      }
    <\/script>
  `;

  return content;
}

/**
 * Generates only the main content HTML for the Add Place page.
 * Includes the search input and necessary JavaScript for Google Places Autocomplete.
 * @returns {string} HTML string for the main content.
 */
export function getAddPlacePageContent() {
    // Note: We are migrating from the deprecated Autocomplete class to PlaceAutocompleteElement
    return `
    <div class="bg-white w-full h-full flex flex-col overflow-hidden"> <!-- Full height container -->
        <h1 class="text-2xl font-bold mb-4 text-gray-800 flex-shrink-0 hidden">新增地點 (透過 Google 地標搜尋)</h1> <!-- Hidden H1 -->

        <!-- Search Input Area -->
        <div class="p-4 flex-shrink-0 bg-white border-b border-gray-200 z-10">
            <label for="place-input" class="block text-sm font-medium text-gray-700 mb-1">搜尋地點名稱或地址:</label>
            <input 
                type="text" 
                id="place-input" 
                name="place-search"
                placeholder="例如：澎湖跨海大橋 或 台北101"
                class="w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            >
        </div>

        <!-- Main Content Area -->
        <div class="flex flex-col md:flex-row flex-grow min-h-0 relative overflow-hidden"> <!-- Main container -->

            <!-- Map Container (Full width on mobile, 3/4 on desktop) -->
            <div id="map-container" class="w-full md:w-3/4 h-full relative"> <!-- Map container -->
                 <div id="map" class="w-full h-full"></div> <!-- Full size map -->
                 <div id="map-message-area" class="absolute bottom-4 left-4 text-sm text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm z-20">點擊地圖上的圖示以選擇地標，或使用上方搜尋框。</div> <!-- Floating message -->
            </div>

            <!-- Details Panel (Hidden on mobile by default, visible on desktop) -->
            <div id="details-panel" class="w-full md:w-1/4 h-full bg-white border-l border-gray-200 flex flex-col transform transition-all duration-300 ease-in-out" style="transform: translateY(100%); opacity: 0;"> <!-- Sliding panel -->
                
                <!-- Message Area -->
                <div id="message-area" class="p-4 text-sm h-6 flex-shrink-0 border-b border-gray-100"></div> <!-- Message area -->

                <!-- Location Details Display Area -->
                <div id="location-details-area" class="flex-grow overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style="display: none;"> <!-- Scrollable content area with custom scrollbar -->
                    <!-- Mobile Back Button -->
                    <div class="md:hidden flex items-center p-4 border-b border-gray-100 flex-shrink-0">
                        <button id="back-to-map-btn" class="flex items-center text-gray-600 hover:text-gray-800 font-medium">
                            <span class="text-xl mr-2">←</span>
                            <span>返回地圖</span>
                        </button>
                    </div>
                    
                    <div class="p-4" style="padding-bottom: calc(var(--nav-height) + 2rem);"> <!-- Dynamic bottom padding to avoid nav overlap -->
                        <h3 class="text-lg font-semibold mb-4 text-gray-800">地點資訊</h3>
                    <!-- Location Photo Display Area (Moved Inside) -->
                    <div id="location-photo-area" class="mb-4" style="display: none;"> 
                        <img id="location-photo" src="" alt="地點照片" class="w-full h-auto rounded max-h-48 object-cover border border-gray-200">
                    </div>
                    <p class="mb-1 text-sm"><strong>名稱:</strong> <span id="location-name">---</span></p>
                    <p class="mb-1 text-sm"><strong>地址:</strong> <span id="location-address">---</span></p>
                    <p class="mb-1 text-sm hidden"><strong>座標:</strong> <span id="location-coords">---</span></p> 
                    <p id="location-summary-paragraph" class="mt-2 text-sm text-gray-700" style="display: none;">
                        <strong>簡介:</strong> <span id="location-summary">---</span>
                    </p>
                    <p class="mb-1 text-sm"><strong>類型:</strong> <span id="location-types">---</span></p>
                    <p class="mb-1 text-sm"><strong>電話:</strong> <span id="location-phone">---</span></p>
                    <p class="mb-1 text-sm"><strong>網站:</strong> <span id="location-website">---</span></p>
                    <p class="mb-1 text-sm"><strong>評分:</strong> <span id="location-rating">---</span></p>
                    <p class="mb-1 text-sm"><strong>狀態:</strong> <span id="location-status">---</span></p>
                    <p class="mb-1 text-sm"><strong>來源:</strong> <span id="location-source">---</span></p>
                    
                    <!-- 新增：地點狀態選擇區域 -->
                    <div id="location-status-selection" class="mt-4 p-3 bg-gray-50 rounded-lg" style="display: none;">
                        <h4 class="text-sm font-semibold mb-2 text-gray-700">此地點已存在，請選擇您的狀態：</h4>
                        <div class="flex flex-col space-y-2">
                            <button id="status-visited" class="status-btn bg-gray-200 text-gray-700 hover:bg-green-100 px-3 py-2 rounded text-sm transition-colors">
                                <span>✓</span>
                                <span>來過</span>
                            </button>
                            <button id="status-want-to-visit" class="status-btn bg-gray-200 text-gray-700 hover:bg-blue-100 px-3 py-2 rounded text-sm transition-colors">
                                <span>❤</span>
                                <span>想來</span>
                            </button>
                            <button id="status-want-to-revisit" class="status-btn bg-gray-200 text-gray-700 hover:bg-purple-100 px-3 py-2 rounded text-sm transition-colors">
                                <span>🔄</span>
                                <span>想再來</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Action Button and Navigation Options Container -->
                <div class="flex-shrink-0 border-t border-gray-100 bg-white" style="padding-bottom: calc(var(--nav-height) + 1rem);">
                    <div class="p-4">
                        <button id="confirm-add-button" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors" disabled>
                            確認新增此地點
                        </button>

                        <!-- Navigation Options (Hidden by default) -->
                        <div id="navigation-options" class="mt-4 p-4 bg-gray-50 rounded-lg" style="display: none;">
                            <h4 class="text-sm font-semibold mb-3 text-gray-700">接下來要做什麼？</h4>
                            <div class="flex flex-col space-y-2">
                                <button id="continue-search-btn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    🔍 繼續搜尋地點
                                </button>
                                <button id="go-home-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                                    🏠 返回首頁
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </div>

    <style>
      /* Custom scrollbar styles */
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      /* Ensure content is scrollable */
      #location-details-area {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      }
    </style>

    <script>
      // --- Type Translation Logic (Duplicated for Client-Side Script Scope) --- 
      const placeTypeTranslations = {
          'bar': '酒吧',
          'restaurant': '餐廳',
          'cafe': '咖啡廳',
          'store': '商店',
          'supermarket': '超市',
          'convenience_store': '便利商店',
          'department_store': '百貨公司',
          'shopping_mall': '購物中心',
          'lodging': '住宿',
          'hotel': '飯店',
          'point_of_interest': '景點',
          'tourist_attraction': '旅遊景點',
          'park': '公園',
          'museum': '博物館',
          'library': '圖書館',
          'school': '學校',
          'hospital': '醫院',
          'train_station': '火車站',
          'bus_station': '公車站',
          'airport': '機場',
          'bank': '銀行',
          'post_office': '郵局',
          'gas_station': '加油站',
          'establishment': '場所' 
      };
      
      function translatePlaceTypes(typesArray) {
          if (!typesArray || typesArray.length === 0) return '-';
      
          const translatedTypes = typesArray
              .map(type => placeTypeTranslations[type] || null) 
              .filter(translated => translated !== null && translated !== '場所');
      
          return translatedTypes.length > 0 ? translatedTypes.join(', ') : '其他'; 
      }
      // --- END Duplicated Logic ---

      // Make sure declarations are at the top
      let mapsApiKey = null;
      let map; // Declare map globally in script scope
      let marker; // Declare marker globally
      let currentPlaceData = null; // Variable to store temporary place data

      // Function to initialize Google Maps script and Autocomplete
      async function initMap() { 
        try {
            // 1. Fetch API Key from our backend
            const configResponse = await fetch('/api/maps/config');
            if (!configResponse.ok) {
                throw new Error('Failed to fetch Maps config');
            }
            const config = await configResponse.json();
            mapsApiKey = config.apiKey;
            if (!mapsApiKey) {
                 throw new Error('Maps API Key not provided by backend.');
            }

            // 2. Load Google Maps JS API script dynamically
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=' + mapsApiKey + '&libraries=places,places.element&loading=async'; 
            script.async = true; // Keep async loading

            // --- NEW: Initialize AFTER script loads ---
            script.onload = () => {
                console.log('Google Maps API script loaded successfully.');
                initializeMapAndAutocomplete(); // Call the initialization function
            };
            script.onerror = () => {
                 console.error('Failed to load Google Maps API script.');
                 setMessage('錯誤：無法載入 Google Maps API。', 'error');
            };
            // --- END NEW ---

            // REMOVED: window.initAutocomplete = initAutocomplete; 
            document.head.appendChild(script);

        } catch (error) {
            console.error('Error initializing map script loading:', error); // Changed log message slightly
            setMessage('錯誤：無法開始載入地圖搜尋功能。 (' + error.message + ')', 'error');
        }
      }

      // --- NEW: Separate initialization function ---
      function initializeMapAndAutocomplete() {
          console.log('Attempting to initialize Map and Autocomplete...'); // Renamed Log

          // --- Initialize the Map FIRST ---
          const initialCenter = { lat: 23.5687, lng: 119.5775 }; 
          const mapDiv = document.getElementById('map');
          if (!mapDiv) {
              console.error('Map container element (#map) not found!');
              setMessage('錯誤：無法初始化地圖容器。', 'error');
          } else {
             map = new google.maps.Map(mapDiv, { 
                 center: initialCenter,
                 zoom: 12,
                 mapTypeControl: false,
                 clickableIcons: true // Enable clicking on POI icons
             });
             console.log('Map initialized.');
             
             // 載入已存在的地點並在地圖上顯示
             loadExistingLocationsOnMap();
             
             // 初始化桌面版面板狀態
             initializeDesktopPanel();
             
             // 調整容器高度
             adjustContainerHeight();
             
             // 調整詳情面板間距
             adjustDetailsPanelSpacing();
             
             // 驗證佈局系統
             setTimeout(() => {
                 validateLayout();
             }, 200);
             
             // --- NEW: POI Click Listener --- 
             map.addListener('click', (event) => {
                 if (event.placeId) {
                     // Prevent infowindow from opening on marker click if map has default markers
                     event.stop(); 
                     console.log('POI Clicked, Place ID:', event.placeId);
                     handlePoiClick(event.placeId);
                 } else {
                     // Clicked on the map, not a POI
                     console.log('Map clicked, but not on a POI.');
                     setMessage('請點選地圖上的圖示以選擇地標，或使用上方搜尋框。 ', 'warning'); 
                     // Clear details and marker if a non-POI is clicked
                     updateLocationDetails(null);
                     if (marker) marker.setMap(null);
                 }
             });
             console.log('POI click listener added.');
          }
          // --- End Map Initialization ---


          // --- Initialize Autocomplete (Using deprecated Autocomplete class) ---
          console.log('Attempting to find Autocomplete input element...'); // Modified Log
          const inputElement = document.getElementById('place-input'); // Get the <input>

          if (!inputElement) {
               console.error('Autocomplete input element (#place-input) not found!'); // Modified Log
               setMessage('錯誤：無法初始化搜尋輸入框。', 'error'); // Modified Message
               return;
          }
          console.log('Autocomplete input element Found:', inputElement); // Modified Log

          // Check if the places library is ready
          console.log('Checking if google.maps.places library is ready...'); // Modified Log
          if (google && google.maps && google.maps.places) {
               console.log('google.maps.places library IS ready. Initializing Autocomplete...'); // Modified Log
               
               // Create the Autocomplete instance attached to the input element
               // Requesting specific fields to ensure we get necessary data
               const autocomplete = new google.maps.places.Autocomplete(inputElement, { 
                   types: ['geocode', 'establishment'], // Optional: Restrict search types
                   fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'international_phone_number', 'website', 'rating', 'user_ratings_total', 'business_status'] // Specify fields
               }); 
               console.log('google.maps.places.Autocomplete initialized.');

               // Add the 'place_changed' listener to the autocomplete instance
               autocomplete.addListener('place_changed', async () => { // Make listener async
                   const place = autocomplete.getPlace();
                   if (place && place.place_id) {
                       console.log('Autocomplete place_changed, Place ID:', place.place_id);
                       await fetchAndDisplayPlaceDetails(place.place_id, 'Google 搜尋 (Autocomplete)'); // Call unified function
                   } else {
                       console.warn('Autocomplete event fired but getPlace() returned incomplete data:', place);
                       setMessage('地點資訊不完整，請重新選擇。', 'warning');
                       updateLocationDetails(null); 
                       if (marker) marker.setMap(null);
                   }
               }); 
               console.log('Autocomplete listener ADDED for place_changed.'); 

          } else {
               console.error('google.maps.places library not ready when trying to initialize Autocomplete.'); // Modified Log
               setMessage('錯誤：Google 地點程式庫尚未就緒。', 'error'); // Modified Message
          }
          console.log('Map and Autocomplete initialization process finished.'); 
      }
      // --- END MODIFIED FUNCTION ---

      // Helper function to set messages
      function setMessage(text, type = 'info') {
          const messageArea = document.getElementById('message-area');
          if (!messageArea) return;
          messageArea.textContent = text;
          
          // 保持一致的佈局樣式，只改變文字顏色
          const baseClasses = 'p-4 text-sm h-6 flex-shrink-0 border-b border-gray-100';
          let textColorClass = 'text-blue-600'; // Default/Info
          
          if (type === 'error') {
              textColorClass = 'text-red-600';
          } else if (type === 'success') {
              textColorClass = 'text-green-600';
          } else if (type === 'warning') {
              textColorClass = 'text-orange-600';
          }
          
          messageArea.className = baseClasses + ' ' + textColorClass;
      }

      // Function to update the location details display area
      function updateLocationDetails(data) {
          const detailsArea = document.getElementById('location-details-area');
          const confirmButton = document.getElementById('confirm-add-button');
          if (!detailsArea || !confirmButton) return;

          // Handle photo display
          const photoArea = document.getElementById('location-photo-area');
          const photoImg = document.getElementById('location-photo');
          const summaryParagraph = document.getElementById('location-summary-paragraph');
          const summarySpan = document.getElementById('location-summary');

          if (data) {
              // Show photo if available
              if (photoArea && photoImg && data.photoUrls && data.photoUrls.length > 0) {
                  photoImg.src = data.photoUrls[0]; // Show the first photo
                  photoArea.style.display = 'block';
              } else if (photoArea) {
                  photoArea.style.display = 'none'; // Hide if no photos
              }

              // Basic Info
              document.getElementById('location-name').textContent = data.name || 'N/A';
              document.getElementById('location-address').textContent = data.address || ' (無地址資訊) ';
              document.getElementById('location-coords').textContent = data.coords ? (data.coords.lat.toFixed(6) + ', ' + data.coords.lng.toFixed(6)) : 'N/A';
              document.getElementById('location-source').textContent = data.source || 'N/A';
              
              // Additional Details (check if they exist in the data object)
              document.getElementById('location-types').textContent = translatePlaceTypes(data.types);
              document.getElementById('location-phone').textContent = data.phone || '-';
              const websiteSpan = document.getElementById('location-website');
              if (data.website) {
                  // Use string concatenation for innerHTML
                  websiteSpan.innerHTML = '<a href="' + data.website + '" target="_blank" class="text-blue-600 hover:underline">' + data.website + '</a>';
              } else {
                  websiteSpan.textContent = '-';
              }
              // Use string concatenation for rating text
              document.getElementById('location-rating').textContent = data.rating ? (data.rating + ' (' + (data.ratingCount || 0) + ' 則評論)') : '-';
              document.getElementById('location-status').textContent = data.status || '-';

              // Show summary if available
              if (summaryParagraph && summarySpan && data.editorialSummary) {
                  summarySpan.textContent = data.editorialSummary;
                  summaryParagraph.style.display = 'block';
              } else if (summaryParagraph) {
                  summarySpan.textContent = '---';
                  summaryParagraph.style.display = 'none'; // Hide if no summary
              }

              detailsArea.style.display = 'block';
              confirmButton.disabled = false;
              currentPlaceData = data.payload; // Store the data needed for backend API call
              
              // 顯示面板
              slidePanelUp();
              
              // 確保滾動區域正確初始化
              setTimeout(() => {
                  if (detailsArea.scrollHeight > detailsArea.clientHeight) {
                      detailsArea.style.overflowY = 'auto';
                  }
              }, 100);
          } else {
              // Hide photo area when clearing details
              if (photoArea) {
                  photoArea.style.display = 'none';
              }
              if (photoImg) {
                  photoImg.src = ''; // Clear image source
              }
              // Clear all fields when hiding
              document.getElementById('location-name').textContent = '---';
              document.getElementById('location-address').textContent = '---';
              document.getElementById('location-coords').textContent = '---';
              // Clear summary when clearing details
              if (summaryParagraph) { 
                  summarySpan.textContent = '---';
                  summaryParagraph.style.display = 'none'; 
              }
              document.getElementById('location-types').textContent = '---';
              document.getElementById('location-phone').textContent = '---';
              document.getElementById('location-website').textContent = '---';
              document.getElementById('location-rating').textContent = '---';
              document.getElementById('location-status').textContent = '---';
              document.getElementById('location-source').textContent = '---';
              
              detailsArea.style.display = 'none';
              confirmButton.disabled = true;
              currentPlaceData = null;
              
              // 重置狀態變數
              selectedStatus = null;
              existingLocationId = null;
              hideLocationStatusSelection();
              hideNavigationOptions();
              
              // 隱藏面板
              slidePanelDown();
          }
          // Conditionally set message
          if (data) {
              setMessage('已選擇地點，請確認資訊後點擊按鈕新增。', 'info');
          } // When data is null (clearing), don't set this default message.
      }

      // --- REUSABLE FUNCTION to fetch details and update UI ---
      async function fetchAndDisplayPlaceDetails(placeId, sourceDescription) {
          if (!placeId) return;

          console.log('--- Fetching and Displaying Details for Place ID:', placeId);
          updateLocationDetails(null); // Clear previous details
          if (marker) marker.setMap(null); // Clear previous marker
          setMessage('正在載入地標資訊...', 'info'); 

          try {
              const apiUrl = '/api/locations/details-by-placeid/' + placeId;
              const response = await fetch(apiUrl);

              if (response.ok) {
                  const result = await response.json(); 
                  console.log('Details fetched successfully:', result);

                  const displayData = {
                      name: result.name,
                      address: result.address,
                      coords: result.latitude && result.longitude 
                              ? { lat: result.latitude, lng: result.longitude } 
                              : null, 
                      types: result.googleTypes || [], 
                      phone: result.phone_number || null,
                      website: result.website,
                      rating: result.google_rating,
                      ratingCount: result.google_user_ratings_total,
                      status: result.business_status || null,
                      photoUrls: result.photoUrls || [],
                      editorialSummary: result.editorialSummary || null,
                      source: sourceDescription || '未知來源', 
                      payload: { googlePlaceId: result.googlePlaceId },
                      existingLocation: result.existingLocation || null // 新增：檢查是否已存在
                  };

                  updateLocationDetails(displayData);

                  if (displayData.coords) {
                      if (marker) marker.setMap(null); 
                      marker = new google.maps.Marker({
                          map: map,
                          position: displayData.coords,
                          title: displayData.name
                      });
                      map.setCenter(displayData.coords);
                      map.setZoom(17); 
                  } else {
                      console.warn('Place details missing coordinates:', result);
                  }

                  // 檢查地點是否已存在
                  if (displayData.existingLocation) {
                      setMessage('此地點已存在於資料庫中，請選擇您的狀態。', 'warning');
                      showLocationStatusSelection(displayData.existingLocation);
                  } else {
                      setMessage('已選擇地標，請確認資訊後點擊按鈕新增。', 'success');
                      hideLocationStatusSelection();
                  }

              } else {
                  const errorResult = await response.json().catch(() => ({ error: 'HTTP error ' + response.status }));
                  console.error('Details API call failed:', response.status, errorResult);
                  setMessage('無法載入地標資訊。 (' + (errorResult.error || response.statusText) + ')', 'error');
                  updateLocationDetails(null);
              }
          } catch (error) {
              console.error('Error calling details API:', error);
              setMessage('載入地標資訊時發生網路錯誤。', 'error');
              updateLocationDetails(null);
          }
      }
      // --- END REUSABLE FUNCTION ---

      // --- Map POI Click Handler (Calls reusable function) ---
      async function handlePoiClick(placeId) {
         await fetchAndDisplayPlaceDetails(placeId, '地圖點擊 (地標)'); // Just call the reusable function
      }

      // 顯示地點狀態選擇
      function showLocationStatusSelection(existingLocation) {
          const statusSelection = document.getElementById('location-status-selection');
          const confirmButton = document.getElementById('confirm-add-button');
          
          if (statusSelection) {
              statusSelection.style.display = 'block';
              
              // 設置現有地點ID
              existingLocationId = existingLocation.id;
              
              // 更新按鈕文字
              if (confirmButton) {
                  confirmButton.textContent = '更新我的狀態';
                  confirmButton.disabled = false;
              }
              
              // 添加狀態按鈕事件監聽器
              addStatusButtonListeners(existingLocation.id);
          }
      }

      // 隱藏地點狀態選擇
      function hideLocationStatusSelection() {
          const statusSelection = document.getElementById('location-status-selection');
          const confirmButton = document.getElementById('confirm-add-button');
          
          if (statusSelection) {
              statusSelection.style.display = 'none';
          }
          
          if (confirmButton) {
              confirmButton.textContent = '確認新增此地點';
          }
      }

      // 顯示導航選項
      function showNavigationOptions() {
          const navigationOptions = document.getElementById('navigation-options');
          if (navigationOptions) {
              navigationOptions.style.display = 'block';
          }
      }

      // 隱藏導航選項
      function hideNavigationOptions() {
          const navigationOptions = document.getElementById('navigation-options');
          if (navigationOptions) {
              navigationOptions.style.display = 'none';
          }
      }

      // 滑動面板控制
      function slidePanelUp() {
          const detailsPanel = document.getElementById('details-panel');
          const mapContainer = document.getElementById('map-container');
          
          if (detailsPanel) {
              if (isMobile()) {
                  detailsPanel.style.transform = 'translateY(0)';
                  detailsPanel.style.opacity = '1';
                  detailsPanel.style.zIndex = '50';
                  
                  // 確保地圖容器保持可見但被遮擋
                  if (mapContainer) {
                      mapContainer.style.zIndex = '10';
                  }
              } else {
                  // 桌面版：確保面板可見
                  detailsPanel.style.transform = 'translateX(0)';
                  detailsPanel.style.opacity = '1';
                  detailsPanel.style.zIndex = '20';
              }
          }
      }

      function slidePanelDown() {
          const detailsPanel = document.getElementById('details-panel');
          const mapContainer = document.getElementById('map-container');
          
          if (detailsPanel) {
              if (isMobile()) {
                  detailsPanel.style.transform = 'translateY(100%)';
                  detailsPanel.style.opacity = '0';
                  detailsPanel.style.zIndex = '10';
                  
                  // 恢復地圖容器的可見性
                  if (mapContainer) {
                      mapContainer.style.zIndex = '20';
                      mapContainer.style.display = 'block';
                  }
              } else {
                  // 桌面版：保持面板可見，但隱藏內容
                  detailsPanel.style.transform = 'translateX(0)';
                  detailsPanel.style.opacity = '1';
                  detailsPanel.style.zIndex = '20';
              }
          }
      }

      // 初始化桌面版面板狀態
      function initializeDesktopPanel() {
          if (!isMobile()) {
              const detailsPanel = document.getElementById('details-panel');
              if (detailsPanel) {
                  detailsPanel.style.transform = 'translateX(0)';
                  detailsPanel.style.opacity = '1';
                  detailsPanel.style.zIndex = '20';
                  // 確保桌面版面板始終可見
                  detailsPanel.classList.add('md:block');
              }
          } else {
              // 移動版：確保面板隱藏
              const detailsPanel = document.getElementById('details-panel');
              const mapContainer = document.getElementById('map-container');
              
              if (detailsPanel) {
                  detailsPanel.style.transform = 'translateY(100%)';
                  detailsPanel.style.opacity = '0';
                  detailsPanel.style.zIndex = '10';
              }
              
              if (mapContainer) {
                  mapContainer.style.zIndex = '20';
                  mapContainer.style.display = 'block';
              }
          }
      }

      // 檢查是否為移動設備
      function isMobile() {
          return window.innerWidth < 768; // md breakpoint
      }

      // 驗證全局佈局系統
      function validateLayout() {
          const header = document.querySelector('header');
          const nav = document.querySelector('nav');
          const main = document.querySelector('main');
          const pageContainer = document.querySelector('.page-container, .fullscreen-container');
          
          const headerHeight = header ? header.offsetHeight : 0;
          const navHeight = nav ? nav.offsetHeight : 0;
          const mainHeight = main ? main.offsetHeight : 0;
          const containerHeight = pageContainer ? pageContainer.offsetHeight : 0;
          const windowHeight = window.innerHeight;
          
          // 檢查 CSS 變數
          const cssHeaderHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
          const cssNavHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;
          const cssMainHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--main-available-height')) || 0;
          
          console.log('[Global Layout Validation]', {
              // 實際元素高度
              headerHeight,
              navHeight,
              mainHeight,
              containerHeight,
              windowHeight,
              totalHeight: headerHeight + navHeight + mainHeight,
              
              // CSS 變數值
              cssHeaderHeight,
              cssNavHeight,
              cssMainHeight,
              
              // 驗證結果
              expectedHeaderHeight: 64,
              expectedNavHeight: 64,
              headerMatch: headerHeight === 64,
              navMatch: navHeight === 64,
              cssMatch: cssHeaderHeight === 64 && cssNavHeight === 64,
              layoutValid: Math.abs((headerHeight + navHeight + mainHeight) - windowHeight) < 5, // 允許 5px 誤差
              
              // 佈局類型
              layoutType: pageContainer ? (pageContainer.classList.contains('fullscreen-container') ? 'fullscreen' : 'standard') : 'unknown'
          });
          
          return {
              headerHeight,
              navHeight,
              mainHeight,
              containerHeight,
              windowHeight,
              cssHeaderHeight,
              cssNavHeight,
              cssMainHeight,
              isValid: Math.abs((headerHeight + navHeight + mainHeight) - windowHeight) < 5
          };
      }

      // 調整容器高度以適應全局佈局系統
      function adjustContainerHeight() {
          const mapContainer = document.getElementById('map-container');
          if (mapContainer) {
              // 使用 CSS 變數獲取精確高度
              const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 64;
              const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;
              const totalFixedHeight = headerHeight + navHeight;
              const availableHeight = window.innerHeight - totalFixedHeight;
              
              // 設置精確的高度
              mapContainer.style.height = availableHeight + 'px';
              
              // 確保地圖容器正確顯示
              const mapElement = document.getElementById('map');
              if (mapElement && window.google && window.google.maps) {
                  setTimeout(() => {
                      window.google.maps.event.trigger(mapElement, 'resize');
                  }, 100);
              }
              
              console.log('[Layout] Adjusted map container height:', {
                  headerHeight,
                  navHeight,
                  totalFixedHeight,
                  availableHeight,
                  windowHeight: window.innerHeight
              });
          }
      }
      
      // 調整詳情面板的底部間距
      function adjustDetailsPanelSpacing() {
          const detailsPanel = document.getElementById('details-panel');
          const actionContainer = detailsPanel ? detailsPanel.querySelector('.flex-shrink-0') : null;
          const contentArea = document.getElementById('location-details-area');
          
          if (actionContainer) {
              const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;
              actionContainer.style.paddingBottom = (navHeight + 16) + 'px'; // 64px nav + 16px extra
          }
          
          if (contentArea) {
              const contentDiv = contentArea.querySelector('.p-4');
              if (contentDiv) {
                  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;
                  contentDiv.style.paddingBottom = (navHeight + 32) + 'px'; // 64px nav + 32px extra
              }
          }
          
          console.log('[Layout] Adjusted details panel spacing');
      }

      // 載入已存在的地點並在地圖上顯示
      async function loadExistingLocationsOnMap() {
          try {
              const response = await fetch('/api/locations/existing');
              if (response.ok) {
                  const locations = await response.json();
                  
                  // 清除現有的標記
                  existingLocationMarkers.forEach(marker => marker.setMap(null));
                  existingLocationMarkers = [];
                  
                  // 為每個已存在的地點創建標記
                  locations.forEach(location => {
                      if (location.latitude && location.longitude) {
                          const marker = new google.maps.Marker({
                              position: { lat: location.latitude, lng: location.longitude },
                              map: map,
                              title: location.name,
                              icon: {
                                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#4F46E5" stroke="white" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">✓</text></svg>'),
                                  scaledSize: new google.maps.Size(24, 24),
                                  anchor: new google.maps.Point(12, 12)
                              }
                          });
                          
                          // 添加點擊事件
                          marker.addListener('click', () => {
                              handleExistingLocationClick(location);
                          });
                          
                          existingLocationMarkers.push(marker);
                      }
                  });
                  
                  console.log('[Map] Loaded ' + existingLocationMarkers.length + ' existing locations on map');
              }
          } catch (error) {
              console.error('Error loading existing locations:', error);
          }
      }

      // 處理已存在地點的點擊
      function handleExistingLocationClick(location) {
          console.log('Existing location clicked:', location);
          
          // 更新地點詳情顯示
          const displayData = {
              name: location.name,
              address: location.address,
              coords: { lat: location.latitude, lng: location.longitude },
              types: location.google_types ? JSON.parse(location.google_types) : [],
              phone: location.phone_number,
              website: location.website,
              rating: location.google_rating,
              ratingCount: location.google_user_ratings_total,
              status: location.business_status,
              photoUrls: location.thumbnail_url ? [location.thumbnail_url] : [],
              editorialSummary: location.editorial_summary,
              source: '已建立的地標',
              payload: { googlePlaceId: location.google_place_id },
              existingLocation: location
          };
          
          updateLocationDetails(displayData);
          
          // 設置現有地點ID
          existingLocationId = location.id;
          
          // 顯示狀態選擇
          showLocationStatusSelection(location);
          
          // 更新地圖中心
          map.setCenter({ lat: location.latitude, lng: location.longitude });
          map.setZoom(17);
          
          // 清除臨時標記
          if (marker) marker.setMap(null);
          
          // 顯示面板
          slidePanelUp();
          
          setMessage('此地點已存在於資料庫中，請選擇您的狀態。', 'warning');
      }

      // 添加狀態按鈕事件監聽器
      function addStatusButtonListeners(locationId) {
          const statusButtons = document.querySelectorAll('.status-btn');
          
          statusButtons.forEach(button => {
              button.addEventListener('click', function() {
                  // 重置所有按鈕樣式
                  statusButtons.forEach(btn => {
                      btn.classList.remove('bg-green-500', 'bg-blue-500', 'bg-purple-500', 'text-white');
                      btn.classList.add('bg-gray-200', 'text-gray-700');
                  });
                  
                  // 設置選中按鈕樣式
                  this.classList.remove('bg-gray-200', 'text-gray-700');
                  
                  if (this.id === 'status-visited') {
                      this.classList.add('bg-green-500', 'text-white');
                      selectedStatus = 'visited';
                  } else if (this.id === 'status-want-to-visit') {
                      this.classList.add('bg-blue-500', 'text-white');
                      selectedStatus = 'want_to_visit';
                  } else if (this.id === 'status-want-to-revisit') {
                      this.classList.add('bg-purple-500', 'text-white');
                      selectedStatus = 'want_to_revisit';
                  }
              });
          });
      }

      // 全局變數存儲選中的狀態
      let selectedStatus = null;
      let existingLocationId = null;
      let existingLocationMarkers = []; // 存儲已存在地點的標記

      // --- Confirm Button Handler --- 
      // Moved definition before the setTimeout call
      async function handleConfirmAdd() {
          const confirmButton = document.getElementById('confirm-add-button');
          confirmButton.disabled = true; // Disable button during request

          // 檢查是否是更新現有地點的狀態
          if (existingLocationId && selectedStatus) {
              setMessage('處理中：正在更新您的狀態...', 'info');
              
              try {
                  const response = await fetch('/api/location/status', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                          locationId: existingLocationId,
                          status: selectedStatus
                      })
                  });
                  
                  const result = await response.json();
                  
                  if (response.ok && result.success) {
                      setMessage('狀態更新成功！', 'success');
                      showNavigationOptions();
                  } else {
                      throw new Error(result.error || '更新失敗');
                  }
              } catch (error) {
                  console.error('Error updating location status:', error);
                  setMessage('錯誤：無法更新狀態。 (' + error.message + ')', 'error');
                  confirmButton.disabled = false;
              }
              return;
          }

          // 原有的新增地點邏輯
          if (!currentPlaceData) {
              console.error('Confirm button clicked but no currentPlaceData to send.');
              setMessage('錯誤：沒有可新增的地點資訊。', 'error');
              confirmButton.disabled = false;
              return;
          }
          
          setMessage('處理中：正在新增地點到資料庫...', 'info');

          try {
              const response = await fetch('/api/locations/import/google-place', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(currentPlaceData) // Send the stored data
              });
              const result = await response.json();

              if (!response.ok) {
                  throw new Error(result.error || ('HTTP error ' + response.status)); 
              }
              
              console.log('Backend response (Confirm Add):', result);
              setMessage('已将增加地點加入！', 'success');
              showNavigationOptions();

          } catch (error) {
              console.error('Error importing place via Confirm Button:', error);
              setMessage('錯誤：無法加入地點。 (' + error.message + ')', 'error');
              confirmButton.disabled = false; // Re-enable button on error
          }
      }

      // Start the process when the script runs
      initMap();
      
      // Add listener for the confirm button AFTER the DOM is loaded
      // Using setTimeout 0 is a common trick to delay execution until after current stack clears
      setTimeout(() => {
           const confirmButton = document.getElementById('confirm-add-button');
           if (confirmButton) {
               confirmButton.addEventListener('click', handleConfirmAdd);
           } else {
               console.error('Confirm button not found after timeout.');
           }

           // 添加導航按鈕事件監聽器
           const continueSearchBtn = document.getElementById('continue-search-btn');
           const goHomeBtn = document.getElementById('go-home-btn');
           
           if (continueSearchBtn) {
               continueSearchBtn.addEventListener('click', () => {
                   // 重置界面
                   updateLocationDetails(null);
                   hideNavigationOptions();
                   // 清空搜尋框
                   const searchInput = document.getElementById('place-input');
                   if (searchInput) {
                       searchInput.value = '';
                   }
                   setMessage('請搜尋或點擊地圖上的地標來選擇地點。', 'info');
               });
           }
           
           if (goHomeBtn) {
               goHomeBtn.addEventListener('click', () => {
                   window.location.href = '/';
               });
           }

           // 添加返回地圖按鈕事件監聽器
           const backToMapBtn = document.getElementById('back-to-map-btn');
           if (backToMapBtn) {
               backToMapBtn.addEventListener('click', () => {
                   slidePanelDown();
                   
                   // 確保地圖容器可見並重新初始化
                   const mapContainer = document.getElementById('map-container');
                   const map = document.getElementById('map');
                   
                   if (mapContainer) {
                       mapContainer.style.display = 'block';
                       mapContainer.style.zIndex = '20';
                   }
                   
                   // 重新觸發地圖的 resize 事件以確保正確顯示
                   if (map && window.google && window.google.maps) {
                       setTimeout(() => {
                           window.google.maps.event.trigger(map, 'resize');
                       }, 300);
                   }
               });
           }

           // 添加窗口大小改變監聽器
           window.addEventListener('resize', () => {
               setTimeout(() => {
                   initializeDesktopPanel();
                   adjustContainerHeight();
                   adjustDetailsPanelSpacing();
                   validateLayout();
               }, 100);
           });
      }, 0);
      
    <\/script>
`;
}

// --- Full Page Generators (using wrapPageHtml) --- 

export function getHomePageHtml(user, bundledCss, generalLocations = [], userLocationCounts = null, locationInteractionCounts = {}, userLocationStatuses = {}) {
  console.log('[getHomePageHtml] User object:', user ? { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } : 'null');
  const content = getHomePageContent(generalLocations, userLocationCounts, locationInteractionCounts, userLocationStatuses);
  
  // 提取關鍵圖片用於預載入
  const criticalImages = extractCriticalImages(generalLocations, 3);
  const preloadTags = generateImagePreloadTags(criticalImages);
  
  // 將預載入標籤添加到 HTML head
  let html = wrapPageHtml('Home', content, user, bundledCss);
  if (preloadTags) {
    html = html.replace('</head>', `    ${preloadTags}\n</head>`);
  }
  
  return html;
}

// 輔助函數：提取關鍵圖片
function extractCriticalImages(locations = [], maxImages = 3) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  const imageUrls = [];
  const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';

  for (let i = 0; i < Math.min(locations.length, maxImages); i++) {
    const location = locations[i];
    const imageUrl = location?.thumbnail_url || location?.photo_url || null;
    
    if (imageUrl && imageUrl !== defaultImage && !imageUrl.includes('placehold.co')) {
      imageUrls.push(imageUrl);
    }
  }

  return imageUrls;
}

// 輔助函數：生成圖片預載入標籤
function generateImagePreloadTags(imageUrls = []) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return '';
  }

  const maxPreload = 3;
  const urlsToPreload = imageUrls.slice(0, maxPreload);

  return urlsToPreload
    .map(url => `<link rel="preload" as="image" href="${url.replace(/"/g, '&quot;')}" fetchpriority="high">`)
    .join('\n    ');
}

export function getGoogleInfoPageHtml(user, bundledCss) {
  const content = getGoogleInfoContent(user);
  return wrapPageHtml('Google Info', content, user, bundledCss);
}

export function getProfilePageHtml(user, bundledCss, userLocations = [], userLocationCounts = null, locationInteractionCounts = {}, userLocationStatuses = {}) {
  const content = getProfilePageContent(user, userLocations, userLocationCounts, locationInteractionCounts, userLocationStatuses);
  return wrapPageHtml('Profile', content, user, bundledCss);
}

export function getAddPlacePageHtml(user, bundledCss) {
  const content = getAddPlacePageContent();
  
  // 使用全局佈局系統，但覆蓋 main 內容為全螢幕
  return `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Place - Hopenghu</title>
    <style>
      /* Inject bundled Tailwind CSS */
      ${bundledCss}
      
      /* ===== GLOBAL LAYOUT SYSTEM ===== */
      
      /* CSS Reset for consistent box model */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      /* Layout System Variables */
      :root {
        --header-height: 64px;
        --nav-height: 64px;
        --total-fixed-height: calc(var(--header-height) + var(--nav-height));
        --main-available-height: calc(100vh - var(--total-fixed-height));
      }
      
      /* Global Layout Structure */
      html, body {
        height: 100%;
        overflow-x: hidden;
      }
      
      body { 
        display: flex; 
        flex-direction: column; 
        background-color: #f3f4f6;
        color: #1f2937;
      }
      
      /* Fixed Header - Always at top */
      header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: var(--header-height);
        background: white;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Fixed Navigation - Always at bottom */
      nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--nav-height);
        background: white;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      
      /* Main Content Area - Between header and nav */
      main {
        flex: 1;
        margin-top: var(--header-height);
        margin-bottom: var(--nav-height);
        min-height: var(--main-available-height);
        width: 100%;
        overflow: hidden; /* Prevent scrolling for add-place */
      }
      
      /* Full Screen Layout for add-place page */
      .fullscreen-container {
        width: 100%;
        height: var(--main-available-height);
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      
      /* Map container takes full available height */
      .map-container { 
        height: var(--main-available-height);
        width: 100%;
      }
      
      /* Details panel bottom spacing to avoid nav overlap */
      #details-panel .flex-shrink-0 {
        padding-bottom: calc(var(--nav-height) + 1rem);
      }
      
      /* Content area bottom spacing */
      #location-details-area .p-4 {
        padding-bottom: calc(var(--nav-height) + 2rem) !important;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        :root {
          --header-height: 64px;
          --nav-height: 64px;
        }
      }
      
      /* ===== END GLOBAL LAYOUT SYSTEM ===== */
    </style>
</head>
<body>
    ${getFixedHeaderHtml()}
    <main>
      <div class="fullscreen-container">
        ${content} 
      </div>
    </main>
    ${getBottomNavHtml(user)}
    ${getBottomNavScript()}
</body>
</html>
`;
}

export function getAdminInvitationsPageHtml(user, bundledCss, initialLocations = []) {
    const pageTitle = "管理商家邀請 - HOPENGHU";
    const locationsListHtml = initialLocations.map(loc => `
        <div class="location-item p-4 border mb-4 rounded-lg shadow">
            <h3 class="text-xl font-semibold">${loc.name || '未命名地點'}</h3>
            <p class="text-sm text-gray-600">${loc.address || '無地址資訊'}</p>
            ${loc.claimed_by_user_id
                ? `<p class="text-sm text-green-600">已由用戶 ${loc.claimed_by_user_id} 認領 (Email: ${loc.owner_email || '未知'})</p>`
                : `<p class="text-sm text-blue-600">尚未認領</p>`
            }
            ${!loc.claimed_by_user_id ? `
                <div class="mt-2">
                    <label for="merchant-email-${loc.id}" class="block text-sm font-medium text-gray-700">商家 Email:</label>
                    <input type="email" id="merchant-email-${loc.id}" name="merchant-email-${loc.id}" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="merchant@example.com">
                    <button onclick='handleInvite("${loc.id}")' class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        產生邀請連結
                    </button>
                </div>` : ''
            }
        </div>
    `).join('') || '<p>目前沒有地點可供邀請，請先 <a href="/add-place" class="text-indigo-600 hover:text-indigo-800">新增地點</a>。</p>';

    const content = `
        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">管理商家邀請</h1>
                <a href="/add-place" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    ＋ 新增地點
                </a>
            </div>

            <div id="invitation-message" class="mb-4 p-3 rounded-md bg-blue-100 text-blue-700" style="display: none;"></div>
            <div id="error-message" class="mb-4 p-3 rounded-md bg-red-100 text-red-700" style="display: none;"></div>

            <div id="locations-list">
                ${locationsListHtml}
            </div>
        </div>

        <script>
            // REMOVED: function getAuthToken() { ... }

            async function handleInvite(locationId) {
                const emailInput = document.getElementById('merchant-email-' + locationId);
                const merchantEmail = emailInput.value.trim();
                const invitationMessageEl = document.getElementById('invitation-message');
                const errorMessageEl = document.getElementById('error-message');

                invitationMessageEl.style.display = 'none';
                errorMessageEl.style.display = 'none';
                invitationMessageEl.textContent = '';
                errorMessageEl.textContent = '';

                if (!merchantEmail || !merchantEmail.includes('@')) {
                    errorMessageEl.textContent = '請輸入有效的商家 Email。';
                    errorMessageEl.style.display = 'block';
                    return;
                }

                // REMOVED: authToken check
                // if (!authToken) { ... }

                try {
                    // The browser will automatically send the session cookie.
                    // No Authorization header is needed for cookie-based sessions on the same domain.
                    const response = await fetch('/api/admin/locations/generate-claim-link', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // REMOVED: 'Authorization': 'Bearer ' + authToken
                        },
                        body: JSON.stringify({
                            location_id: locationId,
                            merchant_email: merchantEmail
                        })
                    });

                    const result = await response.json();

                    if (response.ok && result.claim_url) {
                        invitationMessageEl.innerHTML = '邀請連結已產生: <br><a href="' + result.claim_url + '" target="_blank" class="font-bold hover:underline">' + result.claim_url + '</a><br>(請複製此連結並傳送給商家: ' + result.merchant_email + ')';
                        invitationMessageEl.style.display = 'block';
                        emailInput.value = ''; // Clear input on success
                    } else {
                        // Check if the error is due to unauthorized access (e.g., session expired or invalid)
                        if (response.status === 401 || response.status === 403) {
                             errorMessageEl.textContent = '產生邀請連結失敗: 管理員未登入或權限不足。請重新整理頁面或登入。 (' + (result.error || 'Unauthorized') + ')';
                        } else {
                             errorMessageEl.textContent = '產生邀請連結失敗: ' + (result.error || '未知錯誤，請檢查伺服器日誌。') + ' (狀態碼: ' + response.status + ')';
                        }
                        errorMessageEl.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Error calling generate-claim-link API:', error);
                    errorMessageEl.textContent = '呼叫 API 時發生網路或程式錯誤: ' + error.message;
                    errorMessageEl.style.display = 'block';
                }
            }

            // Optional: Function to refresh locations list if needed in the future
            // async function refreshLocations() {
            //    try {
            //        // REMOVED: const authToken = getAuthToken();
            //        // REMOVED: if (!authToken) { /* handle not logged in */ return; }
            //        const response = await fetch('/api/admin/locations-for-invitation', {
            //            // REMOVED: headers: { 'Authorization': 'Bearer ' + authToken }
            //        });
            //        if (response.ok) {
            //            const locations = await response.json();
            //            // Re-render the list (simplified here)
            //            // document.getElementById('locations-list').innerHTML = ... (rebuild locationsListHtml)
            //            console.log("Locations refreshed");
            //        }
            //    } catch (error) {
            //        console.error('Error refreshing locations:', error);
            //    }
            // }
        <\/script>
    `;
    return wrapPageHtml(pageTitle, content, user, bundledCss); // Assuming wrapPageHtml injects CSS and handles nav
}

// --- NEW: Claim Location Page --- (Used by worker.js)
/**
 * Generates the HTML for the claim location page.
 * @param {object|null} user - The currently logged-in user, or null.
 * @param {string} bundledCss - The bundled CSS string.
 * @param {object} pageData - An object containing the result of the claim attempt.
 *                            Expected properties: success, success_with_warning, error, message, locationName.
 * @returns {string} Full HTML page string.
 */
export function getClaimLocationPageHtml(user, bundledCss, pageData = {}) {
    let contentHtml = '<div class="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-md">';
    
    console.log("[getClaimLocationPageHtml] Received pageData:", JSON.stringify(pageData));

    if (pageData.success) {
        contentHtml += `
            <h1 class="text-2xl font-semibold text-green-600 mb-4">🎉 地點認領成功！</h1>
            <p class="text-gray-700 mb-6">恭喜！地點 <strong>${pageData.locationName ? String(pageData.locationName).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '此地點'}</strong> 已成功由您認領。</p>
            <p class="mb-4">您可以前往您的 <a href="/profile" class="text-blue-600 hover:underline">個人資料頁面</a> 查看您已認領的地點。</p>
            <a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out no-underline">返回首頁</a>
        `;
    } else if (pageData.success_with_warning) {
        contentHtml += `
            <h1 class="text-2xl font-semibold text-yellow-500 mb-4">⚠️ 地點已認領，但有注意事項</h1>
            <p class="text-gray-700 mb-2">地點 <strong>${pageData.locationName ? String(pageData.locationName).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '此地點'}</strong> 已成功由您認領。</p>
            <p class="text-yellow-700 bg-yellow-100 border border-yellow-300 p-3 rounded mb-6">${pageData.message ? String(pageData.message).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '更新邀請狀態時遇到一些問題，請聯繫管理員。'}</p>
            <p class="mb-4">您可以前往您的 <a href="/profile" class="text-blue-600 hover:underline">個人資料頁面</a> 查看。</p>
            <a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out no-underline">返回首頁</a>
        `;
    } else if (pageData.error) {
        let title = "請求處理失敗";
        let userActionHtml = `<a href="/" class="text-blue-500 hover:underline">返回首頁</a>`;

        switch (pageData.error) {
            case 'missing_token':
                title = "❌ 缺少權杖";
                break;
            case 'invalid_token':
                title = "🔑 權杖無效";
                break;
            case 'expired':
                title = "⏳ 權杖已過期";
                userActionHtml = `請聯繫管理員以獲取新的認領連結。或者 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>。`;
                break;
            case 'already_used':
                title = "🔗 權杖已使用";
                userActionHtml = `如果您認為這是錯誤，請聯繫管理員。或者 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>。`;
                break;
            case 'email_mismatch':
                title = "📧 電子郵件不符";
                if (user) {
                     userActionHtml = `
                        <p class="mb-2">您目前登入的帳號是 <strong>${String(user.email).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>。</p>
                        <form action="/api/auth/logout" method="POST" class="inline">
                            <button type="submit" class="text-blue-500 hover:underline">登出</button>
                        </form>
                        然後使用正確的 Google 帳號重新登入並嘗試認領。
                        或者 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>。
                    `;
                } else {
                     userActionHtml = `請 <a href="/api/auth/google" class="text-blue-500 hover:underline">登入</a> 正確的 Google 帳號後再試一次，或 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>。`;
                }
                break;
            case 'claim_failed':
                title = "🚫 認領失敗";
                userActionHtml = `請稍後再試，或聯繫管理員。或者 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>。`;
                break;
            case 'server_error':
            default:
                title = "⚙️ 伺服器錯誤";
                userActionHtml = `請稍後再試，或聯繫管理員。或者 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>。`;
                break;
        }

        contentHtml += `
            <h1 class="text-2xl font-semibold text-red-600 mb-4">${title}</h1>
            <p class="text-gray-700 bg-red-100 border border-red-300 p-3 rounded mb-6">${pageData.message ? String(pageData.message).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '發生未知的錯誤。'}</p>
            <div class="mt-6">
                ${userActionHtml}
            </div>
        `;
    } else {
        // Fallback for unexpected pageData structure or if called without pageData (e.g. direct navigation attempt without token process)
        contentHtml += `
            <h1 class="text-2xl font-semibold text-blue-600 mb-4">處理認領請求</h1>
            <p class="text-gray-700 mb-6">正在處理您的地點認領請求...</p>
            <p class="text-gray-500 text-sm">如果您直接來到此頁面，您可能需要透過管理員提供的認領連結進入。</p>
            <div class="mt-6">
                 <a href="/" class="text-blue-500 hover:underline">返回首頁</a>
            </div>
        `;
    }

    contentHtml += '</div>';
    return wrapPageHtml('認領地點', contentHtml, user, bundledCss);
}

