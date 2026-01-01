// ImagePreview - 圖片預覽組件
// 基於「人、事、時、地、物」哲學架構
// 提供圖片點擊放大預覽功能

export class ImagePreview {
  constructor(options = {}) {
    this.imageUrl = options.imageUrl;
    this.alt = options.alt || '圖片';
    this.thumbnailUrl = options.thumbnailUrl || options.imageUrl;
    this.nonce = options.nonce || '';
  }

  /**
   * 渲染圖片預覽組件
   * @returns {string} HTML 字串
   */
  render() {
    if (!this.imageUrl) {
      return '';
    }

    return `
      <div class="image-preview-container relative cursor-pointer group" 
           onclick="event.stopPropagation(); openImagePreview('${this.imageUrl}', '${this.alt.replace(/'/g, "\\'")}')">
        <img 
          src="${this.thumbnailUrl}" 
          alt="${this.alt}"
          class="image-preview-thumbnail w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        >
        <div class="image-preview-overlay absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
          <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * 獲取圖片預覽的 JavaScript 代碼
   * @param {string} nonce - CSP nonce
   * @returns {string}
   */
  static getScript(nonce = '') {
    const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
    return `
      <script${nonceAttr}>
        // 圖片預覽功能
        function openImagePreview(imageUrl, alt) {
          // 創建預覽模態框
          const modal = document.createElement('div');
          modal.id = 'image-preview-modal';
          modal.className = 'image-preview-modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90';
          modal.onclick = function(e) {
            if (e.target === modal) {
              closeImagePreview();
            }
          };
          
          // 創建圖片容器
          const imageContainer = document.createElement('div');
          imageContainer.className = 'image-preview-content relative max-w-7xl max-h-[90vh] p-4';
          
          // 創建圖片
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = alt || '預覽圖片';
          img.className = 'max-w-full max-h-[90vh] object-contain';
          
          // 創建關閉按鈕
          const closeBtn = document.createElement('button');
          closeBtn.className = 'image-preview-close absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors';
          closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
          closeBtn.onclick = closeImagePreview;
          
          // 創建下載按鈕
          const downloadBtn = document.createElement('a');
          downloadBtn.href = imageUrl;
          downloadBtn.download = alt || 'image';
          downloadBtn.className = 'image-preview-download absolute top-4 left-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors';
          downloadBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>';
          downloadBtn.title = '下載圖片';
          
          imageContainer.appendChild(img);
          imageContainer.appendChild(closeBtn);
          imageContainer.appendChild(downloadBtn);
          modal.appendChild(imageContainer);
          
          document.body.appendChild(modal);
          document.body.style.overflow = 'hidden';
          
          // ESC 鍵關閉
          const escHandler = function(e) {
            if (e.key === 'Escape') {
              closeImagePreview();
              document.removeEventListener('keydown', escHandler);
            }
          };
          document.addEventListener('keydown', escHandler);
        }
        
        function closeImagePreview() {
          const modal = document.getElementById('image-preview-modal');
          if (modal) {
            modal.remove();
            document.body.style.overflow = '';
          }
        }
        
        // 使函數全局可用
        window.openImagePreview = openImagePreview;
        window.closeImagePreview = closeImagePreview;
      </script>
    `;
  }
}

