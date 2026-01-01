// CommentsComponent - 評論組件
// 基於「人、事、時、地、物」哲學架構

export class CommentsComponent {
  constructor(options = {}) {
    this.locationId = options.locationId;
    this.comments = options.comments || [];
    this.total = options.total || 0;
    this.limit = options.limit || 20;
    this.offset = options.offset || 0;
    this.hasMore = options.hasMore || false;
    this.onCommentAdded = options.onCommentAdded || null;
    this.nonce = options.nonce || '';
  }

  /**
   * 渲染評論組件
   * @returns {string} HTML 字串
   */
  render() {
    return `
      <div class="comments-component border-t border-gray-200 pt-6 mt-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          評論 (${this.total})
        </h3>
        
        <!-- 添加評論表單 -->
        ${this.renderCommentForm()}
        
        <!-- 評論列表 -->
        ${this.renderCommentsList()}
        
        <!-- 載入更多 -->
        ${this.hasMore ? this.renderLoadMore() : ''}
      </div>
    `;
  }

  /**
   * 渲染評論表單
   * @returns {string}
   */
  renderCommentForm() {
    return `
      <div class="mb-6 bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-700 mb-3">發表評論</h4>
        <form id="comment-form-${this.locationId}" class="space-y-3">
          <textarea 
            id="comment-content-${this.locationId}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows="3"
            placeholder="分享您對這個地點的想法、體驗或建議..."
            required
          ></textarea>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">您的評論將公開顯示</span>
            <button 
              type="submit"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              發布評論
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * 渲染評論列表
   * @returns {string}
   */
  renderCommentsList() {
    if (this.comments.length === 0) {
      return `
        <div class="text-center py-8 text-gray-500">
          <p>還沒有評論</p>
          <p class="text-sm mt-2">成為第一個評論的人吧！</p>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        ${this.comments.map(comment => this.renderComment(comment)).join('')}
      </div>
    `;
  }

  /**
   * 渲染單個評論
   * @param {object} comment - 評論物件
   * @returns {string}
   */
  renderComment(comment) {
    const formatTime = (timeString) => {
      if (!timeString) return '未知時間';
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSeconds < 60) return '剛剛';
      if (diffMinutes < 60) return `${diffMinutes} 分鐘前`;
      if (diffHours < 24) return `${diffHours} 小時前`;
      if (diffDays === 0) return '今天';
      if (diffDays === 1) return '昨天';
      if (diffDays < 7) return `${diffDays} 天前`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
      return `${Math.floor(diffDays / 365)} 年前`;
    };

    return `
      <div class="comment-item bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start gap-3">
          ${comment.userAvatarUrl ? `
            <img 
              src="${comment.userAvatarUrl}" 
              alt="${comment.userName || '用戶'}"
              class="w-10 h-10 rounded-full object-cover flex-shrink-0"
            >
          ` : `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span class="text-white text-sm font-medium">${(comment.userName || '用')[0].toUpperCase()}</span>
            </div>
          `}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium text-gray-900">${comment.userName || '匿名用戶'}</span>
              <span class="text-xs text-gray-500">${formatTime(comment.createdAt)}</span>
            </div>
            <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">${comment.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染載入更多按鈕
   * @returns {string}
   */
  renderLoadMore() {
    return `
      <div class="mt-4 text-center">
        <button 
          id="load-more-comments-${this.locationId}"
          class="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          載入更多評論
        </button>
      </div>
    `;
  }

  /**
   * 獲取評論組件的 JavaScript 代碼
   * @returns {string}
   */
  getScript() {
    return `
      <script nonce="${this.nonce}">
        // 評論功能
        document.addEventListener('DOMContentLoaded', function() {
          const commentForm = document.getElementById('comment-form-${this.locationId}');
          const commentContent = document.getElementById('comment-content-${this.locationId}');
          const loadMoreBtn = document.getElementById('load-more-comments-${this.locationId}');
          
          // 提交評論
          if (commentForm) {
            commentForm.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const content = commentContent.value.trim();
              if (!content) {
                if (window.showToast) {
                  window.showToast('請輸入評論內容', 'warning');
                } else {
                  alert('請輸入評論內容');
                }
                return;
              }
              
              try {
                const response = await fetch('/api/favorites/comment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    location_id: '${this.locationId}',
                    content: content
                  })
                });
                
                const data = await response.json();
                
                if (data.success) {
                  // 清空表單
                  commentContent.value = '';
                  
                  // 重新載入評論
                  if (window.loadLocationComments) {
                    await window.loadLocationComments('${this.locationId}');
                  } else {
                    location.reload();
                  }
                  
                  // 顯示成功訊息
                  if (window.showToast) {
                    window.showToast('評論已發布', 'success');
                  } else if (window.showNotification) {
                    window.showNotification('評論已發布', 'success');
                  } else {
                    alert('評論已發布');
                  }
                } else {
                  if (window.showToast) {
                    window.showToast('發布失敗：' + (data.error || '未知錯誤'), 'error');
                  } else {
                    alert('發布失敗：' + (data.error || '未知錯誤'));
                  }
                }
              } catch (error) {
                console.error('評論發布失敗:', error);
                if (window.showToast) {
                  window.showToast('發布失敗，請稍後再試', 'error');
                } else {
                  alert('發布失敗，請稍後再試');
                }
              }
            });
          }
          
          // 載入更多評論
          if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async function() {
              // 動態計算 offset
              let currentOffset = parseInt(this.getAttribute('data-offset'));
              if (isNaN(currentOffset)) {
                currentOffset = ${this.offset} + ${this.limit};
              }
              
              try {
                const response = await fetch('/api/favorites/comments?location_id=${this.locationId}&limit=${this.limit}&offset=' + currentOffset);
                const data = await response.json();
                
                if (data.success && data.comments.length > 0) {
                  // 添加新評論到列表
                  const commentsContainer = loadMoreBtn.closest('.comments-component').querySelector('.space-y-4');
                  data.comments.forEach(comment => {
                    const commentHtml = renderCommentItem(comment);
                    commentsContainer.insertAdjacentHTML('beforeend', commentHtml);
                  });
                  
                  // 更新載入更多按鈕
                  if (!data.hasMore) {
                    loadMoreBtn.remove();
                  } else {
                    // 更新下一次的 offset
                    this.setAttribute('data-offset', currentOffset + ${this.limit});
                  }
                } else {
                  loadMoreBtn.remove();
                }
              } catch (error) {
                console.error('載入評論失敗:', error);
                if (window.showToast) {
                  window.showToast('載入失敗，請稍後再試', 'error');
                } else {
                  alert('載入失敗，請稍後再試');
                }
              }
            });
          }
          
          // 渲染單個評論的輔助函數
          function renderCommentItem(comment) {
            const formatTime = (timeString) => {
              if (!timeString) return '未知時間';
              const date = new Date(timeString);
              const now = new Date();
              const diffMs = now.getTime() - date.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              
              if (diffDays === 0) return '今天';
              if (diffDays === 1) return '昨天';
              if (diffDays < 7) return diffDays + ' 天前';
              if (diffDays < 30) return Math.floor(diffDays / 7) + ' 週前';
              if (diffDays < 365) return Math.floor(diffDays / 30) + ' 個月前';
              return Math.floor(diffDays / 365) + ' 年前';
            };
            
            return '<div class="comment-item bg-gray-50 rounded-lg p-4">' +
              '<div class="flex items-start gap-3">' +
              (comment.userAvatarUrl ? 
                '<img src="' + comment.userAvatarUrl + '" alt="' + (comment.userName || '用戶') + '" class="w-10 h-10 rounded-full object-cover">' :
                '<div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center"><span class="text-gray-600 text-sm">' + (comment.userName || '用')[0] + '</span></div>'
              ) +
              '<div class="flex-1">' +
              '<div class="flex items-center gap-2 mb-1">' +
              '<span class="font-medium text-gray-900">' + (comment.userName || '匿名用戶') + '</span>' +
              '<span class="text-xs text-gray-500">' + formatTime(comment.createdAt) + '</span>' +
              '</div>' +
              '<p class="text-gray-700 whitespace-pre-wrap">' + comment.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
              '</div>' +
              '</div>' +
              '</div>';
          }
        });
      </script>
    `;
  }
}

