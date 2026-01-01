// Search Page - 搜尋頁面
// 基於「人、事、時、地、物」哲學架構

import { pageTemplate } from '../components/layout.js';
import { SearchService } from '../services/SearchService.js';
import { Location } from '../models/Location.js';
import { ImagePreview } from '../components/ImagePreview.js';

export async function renderSearchPage(request, env, session, user, nonce, cssContent) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const sortBy = url.searchParams.get('sort_by') || 'relevance';
    const types = url.searchParams.get('types') ? url.searchParams.get('types').split(',') : [];
    const minRating = url.searchParams.get('min_rating') ? parseFloat(url.searchParams.get('min_rating')) : undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const searchService = new SearchService(env.DB);
    
    // 執行搜尋
    const results = await searchService.searchLocations(
      query,
      { types, minRating },
      { sortBy, sortOrder: 'DESC' },
      limit,
      offset
    );

    // 獲取篩選選項
    const filters = await searchService.getSearchFilters();

    // 獲取熱門搜尋關鍵字
    const popularTerms = await searchService.getPopularSearchTerms(10);

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

    // 創建圖片預覽組件（使用 ImagePreview）
    const createImagePreview = (src, alt) => {
      const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';
      const imageUrl = src && src !== 'null' && src !== 'undefined' ? src : defaultImage;
      return new ImagePreview({
        imageUrl: imageUrl,
        thumbnailUrl: imageUrl,
        alt: alt || '地點照片',
        nonce: nonce
      }).render();
    };

    const content = `
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">搜尋地點</h1>
            
            <!-- Search Form -->
            <form method="GET" action="/search" class="mb-4">
              <div class="flex gap-2">
                <input 
                  type="text" 
                  name="q" 
                  value="${query.replace(/"/g, '&quot;')}" 
                  placeholder="搜尋地點名稱、地址..." 
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autocomplete="off"
                >
                <button 
                  type="submit" 
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  搜尋
                </button>
              </div>
            </form>

            <!-- Filters -->
            <div class="flex flex-wrap gap-2 mb-4">
              <select name="sort_by" onchange="updateSearch()" class="px-3 py-1 border border-gray-300 rounded text-sm">
                <option value="relevance" ${sortBy === 'relevance' ? 'selected' : ''}>相關性</option>
                <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>評分</option>
                <option value="popularity" ${sortBy === 'popularity' ? 'selected' : ''}>熱門度</option>
                <option value="name" ${sortBy === 'name' ? 'selected' : ''}>名稱</option>
              </select>
              
              ${minRating !== undefined ? `
                <input 
                  type="number" 
                  name="min_rating" 
                  value="${minRating}" 
                  min="0" 
                  max="5" 
                  step="0.1" 
                  placeholder="最低評分" 
                  onchange="updateSearch()"
                  class="px-3 py-1 border border-gray-300 rounded text-sm w-24"
                >
              ` : ''}
            </div>

            <!-- Popular Terms -->
            ${!query && popularTerms.length > 0 ? `
              <div class="mt-4">
                <p class="text-sm text-gray-600 mb-2">熱門搜尋：</p>
                <div class="flex flex-wrap gap-2">
                  ${popularTerms.map(term => `
                    <a href="/search?q=${encodeURIComponent(term)}" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
                      ${term}
                    </a>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Results -->
        <div class="max-w-6xl mx-auto px-4 py-6">
          ${query ? `
            <div class="mb-4 text-gray-600">
              找到 <strong>${results.total}</strong> 個結果
            </div>
          ` : ''}

          ${results.locations.length === 0 ? `
            <div class="text-center py-12 bg-white rounded-lg shadow">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p class="mt-4 text-gray-500">${query ? '沒有找到符合條件的地點' : '請輸入搜尋關鍵字'}</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${results.locations.map(location => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                    ${createImagePreview(
                      location.thumbnail_url,
                      location.name || '地點照片'
                    )}
                  </div>
                  <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">
                      <a href="/location/${location.id}" class="hover:text-blue-600">
                        ${location.name || '未知地點'}
                      </a>
                    </h3>
                    <p class="text-sm text-gray-600 mb-2">${location.address || ''}</p>
                    <div class="flex items-center justify-between mt-3">
                      ${location.google_rating ? `
                        <div class="flex items-center gap-1">
                          <span class="text-yellow-500">⭐</span>
                          <span class="text-sm font-medium">${location.google_rating.toFixed(1)}</span>
                          ${location.google_user_ratings_total ? `
                            <span class="text-xs text-gray-500">(${location.google_user_ratings_total})</span>
                          ` : ''}
                        </div>
                      ` : ''}
                      <a href="/location/${location.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看詳情 →
                      </a>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Pagination -->
            ${results.total > limit ? `
              <div class="mt-6 flex justify-center gap-2">
                ${page > 1 ? `
                  <a href="/search?q=${encodeURIComponent(query)}&page=${page - 1}&sort_by=${sortBy}" class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    上一頁
                  </a>
                ` : ''}
                <span class="px-4 py-2 text-gray-600">
                  第 ${page} 頁，共 ${Math.ceil(results.total / limit)} 頁
                </span>
                ${results.hasMore ? `
                  <a href="/search?q=${encodeURIComponent(query)}&page=${page + 1}&sort_by=${sortBy}" class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    下一頁
                  </a>
                ` : ''}
              </div>
            ` : ''}
          `}
        </div>
      </div>

      <script nonce="${nonce}">
        function updateSearch() {
          const form = document.querySelector('form');
          const sortBy = document.querySelector('[name="sort_by"]').value;
          const minRating = document.querySelector('[name="min_rating"]')?.value;
          const query = document.querySelector('[name="q"]').value;
          
          let url = '/search?q=' + encodeURIComponent(query) + '&sort_by=' + sortBy;
          if (minRating) {
            url += '&min_rating=' + minRating;
          }
          
          window.location.href = url;
        }
      </script>
      ${ImagePreview.getScript(nonce)}
    `;

    return pageTemplate({
      title: query ? `搜尋「${query}」- 澎湖時光機` : '搜尋地點 - 澎湖時光機',
      content,
      user,
      nonce,
      cssContent
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

