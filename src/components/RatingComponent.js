// RatingComponent - 評分組件
// 基於「人、事、時、地、物」哲學架構

export class RatingComponent {
  constructor(options = {}) {
    this.locationId = options.locationId;
    this.userRating = options.userRating || null;
    this.averageRating = options.averageRating || null;
    this.ratingCount = options.ratingCount || 0;
    this.ratingDistribution = options.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.onRatingChange = options.onRatingChange || null;
    this.nonce = options.nonce || '';
  }

  /**
   * 渲染評分組件
   * @returns {string} HTML 字串
   */
  render() {
    return `
      <div class="rating-component border-t border-gray-200 pt-6 mt-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">評分與評論</h3>
        
        <!-- 平均評分顯示 -->
        ${this.renderAverageRating()}
        
        <!-- 評分分佈 -->
        ${this.ratingCount > 0 ? this.renderRatingDistribution() : ''}
        
        <!-- 用戶評分 -->
        ${this.renderUserRating()}
      </div>
    `;
  }

  /**
   * 渲染平均評分
   * @returns {string}
   */
  renderAverageRating() {
    if (!this.averageRating && this.ratingCount === 0) {
      return `
        <div class="mb-4">
          <p class="text-gray-600">還沒有評分</p>
          <p class="text-sm text-gray-500 mt-1">成為第一個評分的人吧！</p>
        </div>
      `;
    }

    return `
      <div class="mb-4 flex items-center gap-4">
        <div class="text-center">
          <div class="text-4xl font-bold text-gray-900">${this.averageRating?.toFixed(1) || '0.0'}</div>
          <div class="flex items-center justify-center mt-1 gap-1">
            ${this.renderStars(this.averageRating, false)}
          </div>
          <div class="text-sm text-gray-500 mt-1">${this.ratingCount} 個評分</div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染評分分佈
   * @returns {string}
   */
  renderRatingDistribution() {
    const maxCount = Math.max(...Object.values(this.ratingDistribution));
    
    return `
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">評分分佈</h4>
        <div class="space-y-2">
          ${[5, 4, 3, 2, 1].map(rating => {
            const count = this.ratingDistribution[rating] || 0;
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return `
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600 w-8">${rating} 星</span>
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div class="bg-yellow-400 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <span class="text-sm text-gray-500 w-12 text-right">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 渲染用戶評分
   * @returns {string}
   */
  renderUserRating() {
    return `
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">我的評分</h4>
        <div class="flex items-center gap-3">
          <div class="flex gap-1" id="rating-stars-${this.locationId}">
            ${[1, 2, 3, 4, 5].map(star => `
              <button 
                class="rating-star-btn text-2xl transition-all duration-200 ${this.getStarClass(star)}"
                data-rating="${star}"
                data-location-id="${this.locationId}"
                title="${star} 星"
                aria-label="${star} 星評分"
              >
                ★
              </button>
            `).join('')}
          </div>
          ${this.userRating ? `
            <span class="text-sm text-gray-600 font-medium">您給了 ${this.userRating.rating} 星</span>
          ` : `
            <span class="text-sm text-gray-500">點擊星星進行評分</span>
          `}
        </div>
        ${this.userRating && this.userRating.comment ? `
          <div class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-700">${this.userRating.comment.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 渲染星星（用於顯示平均評分）
   * @param {number} rating - 評分
   * @param {boolean} interactive - 是否可互動
   * @returns {string}
   */
  renderStars(rating, interactive = false) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += '<span class="text-yellow-400 text-xl">★</span>';
    }
    if (hasHalfStar) {
      stars += '<span class="text-yellow-400 opacity-50 text-xl">★</span>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<span class="text-gray-300 text-xl">★</span>';
    }
    return stars;
  }

  /**
   * 獲取星星的 CSS 類別
   * @param {number} star - 星星編號（1-5）
   * @returns {string}
   */
  getStarClass(star) {
    if (!this.userRating) {
      return 'text-gray-300 hover:text-yellow-400';
    }
    return star <= this.userRating.rating 
      ? 'text-yellow-400' 
      : 'text-gray-300 hover:text-yellow-400';
  }

  /**
   * 獲取評分組件的 JavaScript 代碼
   * @returns {string}
   */
  getScript() {
    return `
      <script nonce="${this.nonce}">
        // 評分功能
        document.addEventListener('DOMContentLoaded', function() {
          const ratingButtons = document.querySelectorAll('.rating-star-btn[data-location-id="${this.locationId}"]');
          
          ratingButtons.forEach(button => {
            button.addEventListener('click', async function() {
              const rating = parseInt(this.getAttribute('data-rating'));
              const locationId = this.getAttribute('data-location-id');
              
              try {
                const response = await fetch('/api/favorites/rating', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    location_id: locationId,
                    rating: rating
                  })
                });
                
                const data = await response.json();
                
                if (data.success) {
                  // 更新星星顯示
                  const allStars = document.querySelectorAll('.rating-star-btn[data-location-id="' + locationId + '"]');
                  allStars.forEach((star, index) => {
                    if (index < rating) {
                      star.classList.remove('text-gray-300');
                      star.classList.add('text-yellow-400');
                    } else {
                      star.classList.remove('text-yellow-400');
                      star.classList.add('text-gray-300');
                    }
                  });
                  
                  // 重新載入評分資訊
                  if (window.loadLocationRating) {
                    await window.loadLocationRating(locationId);
                  }
                  
                  // 顯示成功訊息
                  if (window.showToast) {
                    window.showToast('評分已更新', 'success');
                  } else if (window.showNotification) {
                    window.showNotification('評分已更新', 'success');
                  } else {
                    alert('評分已更新');
                  }
                } else {
                  if (window.showToast) {
                    window.showToast('評分失敗：' + (data.error || '未知錯誤'), 'error');
                  } else {
                    alert('評分失敗：' + (data.error || '未知錯誤'));
                  }
                }
              } catch (error) {
                console.error('評分操作失敗:', error);
                if (window.showToast) {
                  window.showToast('評分失敗，請稍後再試', 'error');
                } else {
                  alert('評分失敗，請稍後再試');
                }
              }
            });
            
            // 懸停效果
            button.addEventListener('mouseenter', function() {
              const rating = parseInt(this.getAttribute('data-rating'));
              const allStars = document.querySelectorAll('.rating-star-btn[data-location-id="' + this.getAttribute('data-location-id') + '"]');
              allStars.forEach((star, index) => {
                if (index < rating) {
                  star.classList.add('text-yellow-400');
                  star.classList.remove('text-gray-300');
                }
              });
            });
            
            button.addEventListener('mouseleave', function() {
              const locationId = this.getAttribute('data-location-id');
              const userRating = ${this.userRating ? this.userRating.rating : 'null'};
              const allStars = document.querySelectorAll('.rating-star-btn[data-location-id="' + locationId + '"]');
              allStars.forEach((star, index) => {
                if (userRating && index < userRating) {
                  star.classList.add('text-yellow-400');
                  star.classList.remove('text-gray-300');
                } else {
                  star.classList.remove('text-yellow-400');
                  star.classList.add('text-gray-300');
                }
              });
            });
          });
        });
      </script>
    `;
  }
}

