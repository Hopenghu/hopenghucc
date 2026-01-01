// Recommendations Page - 推薦頁面
// 基於「人、事、時、地、物」哲學架構

import { pageTemplate } from '../components/layout.js';
import { RecommendationService } from '../services/RecommendationService.js';
import { LocationService } from '../services/locationService.js';
import { ImagePreview } from '../components/ImagePreview.js';

export async function renderRecommendationsPage(request, env, session, user, nonce, cssContent) {
  if (!user || !user.id) {
    // 未登入，重定向到首頁
    return Response.redirect(new URL(request.url).origin + '/', 302);
  }

  try {
    const recommendationService = new RecommendationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );
    const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
    
    // 獲取個人化推薦
    const recommendations = await recommendationService.recommendLocationsByStories(user.id, 12);
    
    // 獲取熱門地點（作為備選）
    const popularLocations = recommendations.length < 6 
      ? await recommendationService.getPopularLocations(12 - recommendations.length)
      : [];

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

    const allRecommendations = [...recommendations, ...popularLocations];

    const content = `
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-gray-900">為您推薦</h1>
            <p class="text-gray-600 mt-2">根據您的故事和偏好，為您推薦澎湖的精彩地點</p>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="max-w-6xl mx-auto px-4 py-6">
          ${allRecommendations.length === 0 ? `
            <div class="text-center py-12 bg-white rounded-lg shadow">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p class="mt-4 text-gray-500">還沒有足夠的資料來為您推薦</p>
              <p class="text-sm mt-2 text-gray-400">開始探索澎湖，記錄您的足跡，我們會為您推薦更多精彩地點！</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${allRecommendations.map(location => `
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
                    ${location.recommendation_reason ? `
                      <div class="mb-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          💡 ${location.recommendation_reason}
                        </span>
                      </div>
                    ` : ''}
                    ${location.recommendation_score ? `
                      <div class="mb-2">
                        <span class="text-xs text-gray-500">推薦分數: ${location.recommendation_score.toFixed(1)}</span>
                      </div>
                    ` : ''}
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
          `}
        </div>
      </div>
      ${ImagePreview.getScript(nonce)}
    `;

    return pageTemplate({
      title: '為您推薦 - 澎湖時光機',
      content,
      user,
      nonce,
      cssContent
    });
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

