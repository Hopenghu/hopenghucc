// Favorites Page - 收藏列表頁面
// 基於「人、事、時、地、物」哲學架構

import { pageTemplate } from '../components/layout.js';
import { FavoritesService } from '../services/FavoritesService.js';

export async function renderFavoritesPage(request, env, session, user, nonce, cssContent) {
  if (!user || !user.id) {
    // 未登入，重定向到首頁
    return Response.redirect(new URL(request.url).origin + '/', 302);
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const favoritesService = new FavoritesService(env.DB);
    const result = await favoritesService.getUserFavorites(user.id, limit, offset);

    // 創建圖片回退函數
    const createImageWithFallback = (src, alt, className) => {
      const defaultImage = 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';
      if (!src || src === 'null' || src === 'undefined') {
        return `<img src="${defaultImage}" alt="${alt || '地點照片'}" class="${className}" loading="lazy">`;
      }
      return `<img src="${src}" alt="${alt || '地點照片'}" class="${className}" loading="lazy" onerror="this.src='${defaultImage}'">`;
    };

    const content = `
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-gray-900">我的收藏</h1>
            <p class="text-gray-600 mt-2">您收藏的 ${result.total} 個地點</p>
          </div>
        </div>

        <!-- Favorites List -->
        <div class="max-w-6xl mx-auto px-4 py-6">
          ${result.locations.length === 0 ? `
            <div class="text-center py-12 bg-white rounded-lg shadow">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p class="mt-4 text-gray-500">還沒有收藏任何地點</p>
              <p class="text-sm mt-2 text-gray-400">開始探索澎湖，收藏您喜歡的地點吧！</p>
              <a href="/footprints" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                探索地點
              </a>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${result.locations.map(location => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div class="aspect-w-16 aspect-h-9 bg-gray-200">
                    ${createImageWithFallback(
                      location.thumbnail_url,
                      location.name,
                      'w-full h-48 object-cover'
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
                      <div class="flex gap-2">
                        <button 
                          class="favorite-btn text-red-500 hover:text-red-700"
                          data-location-id="${location.id}"
                          data-is-favorited="true"
                          title="取消收藏"
                        >
                          <svg class="w-5 h-5 fill-current" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                          </svg>
                        </button>
                        <a href="/location/${location.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          查看詳情 →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Pagination -->
            ${result.total > limit ? `
              <div class="mt-6 flex justify-center gap-2">
                ${page > 1 ? `
                  <a href="/favorites?page=${page - 1}" class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    上一頁
                  </a>
                ` : ''}
                <span class="px-4 py-2 text-gray-600">
                  第 ${page} 頁，共 ${Math.ceil(result.total / limit)} 頁
                </span>
                ${result.hasMore ? `
                  <a href="/favorites?page=${page + 1}" class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    下一頁
                  </a>
                ` : ''}
              </div>
            ` : ''}
          `}
        </div>
      </div>

      <script nonce="${nonce}">
        // 收藏按鈕功能
        document.addEventListener('DOMContentLoaded', function() {
          const favoriteButtons = document.querySelectorAll('.favorite-btn');
          
          favoriteButtons.forEach(button => {
            button.addEventListener('click', async function() {
              const locationId = this.getAttribute('data-location-id');
              const isFavorited = this.getAttribute('data-is-favorited') === 'true';
              
              try {
                const response = await fetch('/api/favorites/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ location_id: locationId })
                });
                
                const data = await response.json();
                
                if (data.success) {
                  // 更新按鈕狀態
                  if (data.is_favorited) {
                    this.setAttribute('data-is-favorited', 'true');
                    this.classList.add('text-red-500');
                    this.classList.remove('text-gray-400');
                    this.setAttribute('title', '取消收藏');
                    if (window.showToast) {
                      window.showToast('已收藏！', 'success');
                    }
                  } else {
                    this.setAttribute('data-is-favorited', 'false');
                    this.classList.remove('text-red-500');
                    this.classList.add('text-gray-400');
                    this.setAttribute('title', '加入收藏');
                    
                    // 如果不在收藏頁面，移除卡片
                    if (window.location.pathname === '/favorites') {
                      this.closest('.bg-white.rounded-lg').remove();
                    }
                    if (window.showToast) {
                      window.showToast('已取消收藏', 'success');
                    }
                  }
                } else {
                  if (window.showToast) {
                    window.showToast('操作失敗：' + (data.error || '未知錯誤'), 'error');
                  } else {
                    alert('操作失敗：' + (data.error || '未知錯誤'));
                  }
                }
              } catch (error) {
                console.error('收藏操作失敗:', error);
                if (window.showToast) {
                  window.showToast('操作失敗，請稍後再試', 'error');
                } else {
                  alert('操作失敗，請稍後再試');
                }
              }
            });
          });
        });
      </script>
    `;

    return pageTemplate({
      title: '我的收藏 - 澎湖時光機',
      content,
      user,
      nonce,
      cssContent
    });
  } catch (error) {
    console.error('[Favorites] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

