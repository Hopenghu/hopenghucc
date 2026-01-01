// Location Detail Page - 地點詳情頁面
// 基於「人、事、時、地、物」哲學架構

import { pageTemplate } from '../components/layout.js';
import { LocationModule } from '../services/LocationModule.js';
import { FavoritesService } from '../services/FavoritesService.js';
import { BusinessVerificationService } from '../services/BusinessVerificationService.js';
import { LocationDetailService } from '../services/LocationDetailService.js';
import { RatingComponent } from '../components/RatingComponent.js';
import { CommentsComponent } from '../components/CommentsComponent.js';
import { ImagePreview } from '../components/ImagePreview.js';
import { ErrorResponseBuilder, ServiceHealthChecker, withErrorHandling } from '../utils/errorHandler.js';

async function _renderLocationDetailPage(request, env, session, user, nonce, cssContent) {
  // 檢查數據庫連接
  const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
  if (!dbHealth.healthy) {
    console.error('[LocationDetail] Database not available:', dbHealth.error);
    return ErrorResponseBuilder.buildDatabaseErrorPage({
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const locationId = pathParts[pathParts.length - 1];

    if (!locationId) {
      return Response.redirect(new URL(request.url).origin + '/footprints', 302);
    }

    const locationModule = new LocationModule(env.DB, env.GOOGLE_MAPS_API_KEY);
    const locationDetailService = new LocationDetailService(env.DB);
    const verificationService = new BusinessVerificationService(env.DB);

    // 使用優化的批量查詢獲取地點詳情數據
    const [detailData, verificationData] = await Promise.all([
      locationDetailService.getLocationDetailData(locationId, user?.id || null),
      locationDetailService.getVerificationData(locationId, user?.id || null)
    ]);

    const location = detailData.location;
    if (!location) {
      return new Response('Location not found', { status: 404 });
    }

    // 將 Location 對象轉換為 JSON（如果需要）
    const locationObj = locationModule.getLocationById ? 
      await locationModule.getLocationById(locationId, user?.id || null) : 
      location;

    // 從批量查詢結果中提取數據
    const isFavorited = detailData.isFavorited;
    const favoriteCount = detailData.favoriteCount;
    const ratingInfo = detailData.ratingInfo;
    const userRating = ratingInfo.userRating;
    const commentsResult = {
      comments: detailData.comments,
      total: detailData.comments.length // 這裡可以改進為獲取總數
    };

    // 驗證數據
    const verificationStatus = verificationData.verificationStatus;
    const userVerification = verificationData.userVerification;
    const isUserVerified = verificationData.isUserVerified;

    // 創建評分組件
    const ratingComponent = new RatingComponent({
      locationId: locationId,
      userRating: userRating,
      averageRating: ratingInfo.averageRating,
      ratingCount: ratingInfo.ratingCount,
      ratingDistribution: ratingInfo.distribution,
      nonce: nonce
    });

    // 創建評論組件
    const commentsComponent = new CommentsComponent({
      locationId: locationId,
      comments: commentsResult.comments,
      total: commentsResult.total,
      limit: commentsResult.limit,
      offset: commentsResult.offset,
      hasMore: commentsResult.hasMore,
      nonce: nonce
    });

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

    const locationTypes = location.googleTypes 
      ? (Array.isArray(location.googleTypes) ? location.googleTypes : JSON.parse(location.googleTypes || '[]'))
      : [];

    const content = `
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-4xl mx-auto px-4 py-4">
            <a href="/footprints" class="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
              ← 返回地點列表
            </a>
          </div>
        </div>

        <!-- Location Detail -->
        <div class="max-w-4xl mx-auto px-4 py-6">
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <!-- Location Image -->
            <div class="relative aspect-w-16 aspect-h-9 bg-gray-200">
              ${new ImagePreview({
                imageUrl: location.thumbnail_url || 'https://placehold.co/800x450/6B7280/FFFFFF?text=Location+Image',
                thumbnailUrl: location.thumbnail_url || 'https://placehold.co/800x450/6B7280/FFFFFF?text=Location+Image',
                alt: location.name || '地點照片',
                nonce: nonce
              }).render()}
              ${location.user_location_status ? `
                <div class="absolute top-4 right-4">
                  <span class="px-3 py-1 rounded-full text-sm font-medium ${
                    location.user_location_status === 'visited' ? 'bg-green-100 text-green-800' :
                    location.user_location_status === 'want_to_visit' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }">
                    ${
                      location.user_location_status === 'visited' ? '來過' :
                      location.user_location_status === 'want_to_visit' ? '想來' :
                      '想再來'
                    }
                  </span>
                </div>
              ` : ''}
            </div>

            <!-- Location Info -->
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">${location.name || '未知地點'}</h1>
                  <p class="text-gray-600 mb-2">📍 ${location.address || '無地址資訊'}</p>
                  <p class="text-sm text-gray-500">類型: ${translatePlaceTypes(locationTypes)}</p>
                </div>
                ${user ? `
                  <button 
                    class="favorite-btn ml-4 ${isFavorited ? 'text-red-500' : 'text-gray-400'} hover:text-red-600 transition-colors"
                    data-location-id="${locationId}"
                    data-is-favorited="${isFavorited}"
                    title="${isFavorited ? '取消收藏' : '加入收藏'}"
                  >
                    <svg class="w-6 h-6 fill-current" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                    </svg>
                  </button>
                ` : ''}
              </div>

              ${location.editorial_summary ? `
                <div class="mb-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">簡介</h3>
                  <p class="text-gray-700 leading-relaxed">${location.editorial_summary}</p>
                </div>
              ` : ''}

              <!-- 商家驗證狀態 -->
              <div class="mb-6 border-t border-gray-200 pt-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">商家驗證</h3>
                ${verificationStatus ? `
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ 已驗證
                    </span>
                    <span class="text-sm text-gray-600">
                      驗證者：${verificationStatus.user_name || verificationStatus.user_email || '未知'}
                    </span>
                  </div>
                ` : `
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      未驗證
                    </span>
                  </div>
                `}
                ${user && user.id ? `
                  ${userVerification ? `
                    <div class="mt-3">
                      <p class="text-sm text-gray-600 mb-2">
                        您的驗證申請狀態：
                        <span class="font-medium ${
                          userVerification.status === 'approved' ? 'text-green-600' :
                          userVerification.status === 'rejected' ? 'text-red-600' :
                          'text-yellow-600'
                        }">
                          ${
                            userVerification.status === 'approved' ? '已批准' :
                            userVerification.status === 'rejected' ? '已拒絕' :
                            '待審核'
                          }
                        </span>
                      </p>
                      ${userVerification.rejection_reason ? `
                        <p class="text-sm text-red-600 mt-1">拒絕原因：${userVerification.rejection_reason}</p>
                      ` : ''}
                    </div>
                  ` : !isUserVerified ? `
                    <button 
                      id="request-verification-btn"
                      onclick="requestBusinessVerification('${locationId}', '${location.google_place_id || ''}')"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      申請商家驗證
                    </button>
                  ` : ''}
                ` : `
                  <p class="text-sm text-gray-500">請登入後申請商家驗證</p>
                `}
              </div>

              <!-- Google Rating -->
              ${location.google_rating ? `
                <div class="mb-6 flex items-center gap-2">
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">⭐</span>
                    <span class="text-lg font-semibold">${location.google_rating.toFixed(1)}</span>
                  </div>
                  ${location.google_user_ratings_total ? `
                    <span class="text-sm text-gray-500">(${location.google_user_ratings_total} 個 Google 評分)</span>
                  ` : ''}
                </div>
              ` : ''}

              <!-- Status Buttons -->
              ${user ? `
                <div class="border-t border-gray-200 pt-6 mb-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">我的狀態</h3>
                  <div class="flex flex-wrap gap-3">
                    <button 
                      onclick="updateLocationStatus('${locationId}', 'visited')"
                      class="px-4 py-2 rounded-full text-sm transition-colors ${
                        location.user_location_status === 'visited' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }"
                    >
                      來過
                    </button>
                    <button 
                      onclick="updateLocationStatus('${locationId}', 'want_to_visit')"
                      class="px-4 py-2 rounded-full text-sm transition-colors ${
                        location.user_location_status === 'want_to_visit' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }"
                    >
                      想來
                    </button>
                    <button 
                      onclick="updateLocationStatus('${locationId}', 'want_to_revisit')"
                      class="px-4 py-2 rounded-full text-sm transition-colors ${
                        location.user_location_status === 'want_to_revisit' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }"
                    >
                      想再來
                    </button>
                  </div>
                </div>
              ` : ''}

              <!-- Rating Component -->
              ${user ? ratingComponent.render() : ''}

              <!-- Comments Component -->
              ${commentsComponent.render()}
            </div>
          </div>
        </div>
      </div>

      <script nonce="${nonce}">
        // 收藏功能
        document.addEventListener('DOMContentLoaded', function() {
          const favoriteBtn = document.querySelector('.favorite-btn');
          if (favoriteBtn) {
            favoriteBtn.addEventListener('click', async function() {
              const locationId = this.getAttribute('data-location-id');
              
              try {
                const response = await fetch('/api/favorites/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ location_id: locationId })
                });
                
                const data = await response.json();
                
                if (data.success) {
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
          }
        });

        // 申請商家驗證
        async function requestBusinessVerification(locationId, googlePlaceId) {
          if (!${user ? 'true' : 'false'}) {
            if (window.showToast) {
              window.showToast('請先登入才能申請商家驗證', 'warning');
            } else {
              alert('請先登入才能申請商家驗證');
            }
            window.location.href = '/login';
            return;
          }

          try {
            const response = await fetch('/api/business/verify/request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                location_id: locationId,
                google_place_id: googlePlaceId || null
              })
            });

            const data = await response.json();

            if (data.success) {
              if (window.showToast) {
                window.showToast(data.message || '驗證申請已提交，等待管理員審核', 'success');
              } else {
                alert(data.message || '驗證申請已提交，等待管理員審核');
              }
              // 重新載入頁面以更新驗證狀態
              setTimeout(() => location.reload(), 1500);
            } else {
              if (window.showToast) {
                window.showToast('申請失敗：' + (data.error || data.message || '未知錯誤'), 'error');
              } else {
                alert('申請失敗：' + (data.error || data.message || '未知錯誤'));
              }
            }
          } catch (error) {
            console.error('申請商家驗證失敗:', error);
            if (window.showToast) {
              window.showToast('申請失敗，請稍後再試', 'error');
            } else {
              alert('申請失敗，請稍後再試');
            }
          }
        }

        // 更新地點狀態
        function updateLocationStatus(locationId, newStatus) {
          fetch('/api/location/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              locationId: locationId,
              status: newStatus
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              if (window.showToast) {
                let statusText = '';
                if (newStatus === 'visited') statusText = '來過';
                else if (newStatus === 'want_to_visit') statusText = '想來';
                else if (newStatus === 'want_to_revisit') statusText = '想再來';
                if (statusText) {
                  window.showToast('地點狀態已更新為「' + statusText + '」', 'success');
                }
              }
              location.reload();
            } else {
              if (window.showToast) {
                window.showToast('更新失敗: ' + data.error, 'error');
              } else {
                alert('更新失敗: ' + data.error);
              }
            }
          })
          .catch(error => {
            console.error('Error:', error);
            if (window.showToast) {
              window.showToast('更新失敗，請稍後再試', 'error');
            } else {
              alert('更新失敗，請稍後再試');
            }
          });
        }

        // 載入評分資訊
        window.loadLocationRating = async function(locationId) {
          try {
            const response = await fetch('/api/favorites/rating?location_id=' + locationId);
            const data = await response.json();
            
            if (data.success) {
              // 更新評分顯示
              const ratingComponent = document.querySelector('.rating-component');
              if (ratingComponent && window.updateRatingDisplay) {
                window.updateRatingDisplay(data.rating);
              } else {
                location.reload();
              }
            }
          } catch (error) {
            console.error('載入評分失敗:', error);
          }
        };

        // 載入評論
        window.loadLocationComments = async function(locationId) {
          try {
            const response = await fetch('/api/favorites/comments?location_id=' + locationId + '&limit=10&offset=0');
            const data = await response.json();
            
            if (data.success) {
              location.reload();
            }
          } catch (error) {
            console.error('載入評論失敗:', error);
          }
        };
      </script>
      ${user ? ratingComponent.getScript() : ''}
      ${commentsComponent.getScript()}
      ${ImagePreview.getScript(nonce)}
    `;

    return pageTemplate({
      title: `${location.name || '地點詳情'} - 澎湖時光機`,
      content,
      user,
      nonce,
      cssContent
    });
  } catch (error) {
    console.error('[LocationDetail] Error:', error);
    // 使用統一的錯誤處理
    if (error.message && error.message.includes('no such table')) {
      return ErrorResponseBuilder.buildErrorPage({
        title: '數據庫表不存在',
        message: '系統正在初始化，請稍後再試。',
        statusCode: 503,
        suggestion: '如果問題持續存在，請聯繫管理員運行數據庫遷移。',
        user: user,
        nonce: nonce,
        cssContent: cssContent
      });
    }
    return ErrorResponseBuilder.buildErrorPage({
      title: '載入地點詳情失敗',
      message: error.message || '無法載入地點詳情，請稍後再試。',
      statusCode: 500,
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }
}

// 使用錯誤處理裝飾器包裝
export const renderLocationDetailPage = withErrorHandling(_renderLocationDetailPage, {
  user: null,
  nonce: '',
  cssContent: ''
});

