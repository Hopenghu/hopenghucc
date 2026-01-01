export function pageTemplate({ title, content, user, nonce, cssContent, useContainer = true, currentPath = '', headScripts = '' }) {
  console.log('pageTemplate called with:', { title, user: !!user, nonce, useContainer, currentPath }); // Log input

  // 根據當前路徑判斷哪個導覽連結應該高亮
  const isFootprintsActive = currentPath === '/footprints' || currentPath.startsWith('/footprints');
  const isItineraryActive = currentPath === '/itinerary' || currentPath.startsWith('/itinerary');

  try {
    const html = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'HOPE PENGHU'} - HOPE PENGHU</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
        
        <!-- Removed CSS link tag -->
        <!-- <link rel="stylesheet" href="/build/worker.css"> -->

        <!-- Inject CSS content -->
        <style nonce="${nonce}">
          ${cssContent || '/* CSS content not provided */'}
          /* 字體回退：如果 Google Fonts 無法載入，使用系統字體 */
          body {
            font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', 'PingFang TC', 'Helvetica Neue', Arial, sans-serif;
          }
          /* Avatar fallback 樣式（CSP-compliant） */
          .avatar-fallback-hidden {
            display: none !important;
          }
          /* Join button margin */
          .join-button {
            margin-right: 8px;
          }
        </style>

        ${headScripts || ''}

      </head>
      <body>
        <header class="header">
          <nav class="nav container">
            <a href="/" class="nav-logo">HOPE PENGHU</a>
            <ul class="nav-menu">
              <li><a href="/footprints" class="nav-link${isFootprintsActive ? ' nav-link-active' : ''}">足跡</a></li>
              ${user ? `<li><a href="/itinerary" class="nav-link${isItineraryActive ? ' nav-link-active' : ''}">行程規劃</a></li>` : ''}
              ${user ? `
                <li class="nav-menu-item-avatar">
                  <div id="avatar-container" role="button" tabindex="0" aria-label="User menu" class="focus:outline-none avatar-container-div"> 
                     ${user.avatar_url ?
          `<img src="${user.avatar_url}" alt="User Avatar" class="user-avatar" id="user-avatar-img"><span class="user-avatar avatar-fallback avatar-fallback-hidden">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>` :
          `<span class="user-avatar avatar-fallback">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>`
        }
                  </div>
                  
                  <div id="user-dropdown-menu" class="user-dropdown">
                    <div class="dropdown-header">
                       <p class="dropdown-header-name">${user.name || 'User'}</p>
                       <p class="dropdown-header-email">${user.email || ''}</p>
                    </div>
                    <a href="/profile" class="dropdown-item">我的地點</a>
                    <a href="/itinerary" class="dropdown-item">我的行程</a>
                    <a href="/google-info" class="dropdown-item">我的帳號</a>
                    ${user.role === 'admin' ? `
                      <a href="/admin/verifications" class="dropdown-item">商家驗證管理</a>
                      <a href="/admin/knowledge" class="dropdown-item">知識庫審核</a>
                      <div class="dropdown-divider"></div>
                    ` : ''}
                    <div class="dropdown-divider"></div>
                    <button id="logout-button" class="dropdown-item">登出</button>
                  </div>
                </li>
              ` : `
                <li><a href="/login" class="button button-secondary join-button">加入</a></li>
                <li><a href="/login" class="button button-primary">登入</a></li>
              `}
            </ul>
            <button id="mobile-menu-button" class="mobile-menu-toggle">☰</button> 
          </nav>
        </header>

        <main class="${useContainer ? 'container' : ''}">
          ${content || '<p>頁面內容載入中...</p>'} 
        </main>

        <footer class="footer">
          <div class="container">
            <p>&copy; ${new Date().getFullYear()} HOPE PENGHU. All rights reserved.</p>
          </div>
        </footer>

        <!-- 全局 Toast 通知容器 -->
        <div id="toast-container" class="fixed top-4 right-4 z-50 flex flex-col gap-2"></div>

        <!-- 全局圖片載入處理腳本 -->
        <script nonce="${nonce}">
          // Toast 通知系統
          window.showToast = function(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            
            // 根據類型設置樣式
            let bgClass = 'bg-gray-800';
            let icon = 'ℹ️';
            
            if (type === 'success') {
              bgClass = 'bg-green-600';
              icon = '✅';
            } else if (type === 'error') {
              bgClass = 'bg-red-600';
              icon = '❌';
            } else if (type === 'warning') {
              bgClass = 'bg-yellow-600';
              icon = '⚠️';
            }

            toast.className = \`\${bgClass} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0 flex items-center gap-3 min-w-[300px]\`;
            
            toast.innerHTML = \`
              <span class="text-xl">\${icon}</span>
              <p class="font-medium">\${message}</p>
            \`;

            container.appendChild(toast);

            // 動畫：滑入
            requestAnimationFrame(() => {
              toast.classList.remove('translate-x-full', 'opacity-0');
            });

            // 3秒後自動移除
            setTimeout(() => {
              toast.classList.add('opacity-0', 'translate-x-full');
              setTimeout(() => {
                if (container.contains(toast)) {
                  container.removeChild(toast);
                }
              }, 300);
            }, 3000);
          };

          // 圖片載入處理函數（全局）
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
        </script>

        <script nonce="${nonce}">
          // User Avatar Image Handling (CSP-compliant)
          const userAvatarImg = document.getElementById('user-avatar-img');
          if (userAvatarImg) {
            const fallback = userAvatarImg.nextElementSibling;
            if (fallback && fallback.classList.contains('avatar-fallback')) {
              // 圖片載入成功時隱藏 fallback
              userAvatarImg.addEventListener('load', function() {
                fallback.classList.add('avatar-fallback-hidden');
              });
              // 圖片載入失敗時顯示 fallback
              userAvatarImg.addEventListener('error', function() {
                userAvatarImg.style.display = 'none';
                fallback.classList.remove('avatar-fallback-hidden');
              });
            }
          }

          // User Dropdown Menu Logic
          const avatarContainer = document.getElementById('avatar-container'); 
          const dropdownMenu = document.getElementById('user-dropdown-menu');

          if (avatarContainer && dropdownMenu) {
            avatarContainer.addEventListener('click', (event) => {
              event.stopPropagation(); 
              dropdownMenu.classList.toggle('dropdown-active');
            });
            avatarContainer.addEventListener('keydown', (event) => {
               if (event.key === 'Enter' || event.key === ' ') {
                 event.preventDefault();
                 dropdownMenu.classList.toggle('dropdown-active');
               }
            });
            document.addEventListener('click', (event) => {
              if (!dropdownMenu.contains(event.target) && !avatarContainer.contains(event.target)) {
                dropdownMenu.classList.remove('dropdown-active');
              }
            });
            document.addEventListener('keydown', (event) => {
               if (event.key === 'Escape' && dropdownMenu.classList.contains('dropdown-active')) {
                 dropdownMenu.classList.remove('dropdown-active');
                 avatarContainer.focus(); 
               }
            });
          }

          // Event listener for logout button 
          const logoutButton = document.getElementById('logout-button');
          if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
              if (dropdownMenu) dropdownMenu.classList.remove('dropdown-active'); 
              
              try {
                const response = await fetch('/api/auth/logout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                  showToast('登出成功！期待下次相見 👋', 'success');
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 1000);
                } else {
                  console.error('Logout failed:', await response.text());
                  showToast('登出失敗，請稍後再試。', 'error'); 
                }
              } catch (error) {
                console.error('Error logging out:', error);
                showToast('登出時發生錯誤。', 'error'); 
              }
            });
          }

          // Event listener for mobile menu 
          const mobileMenuButton = document.getElementById('mobile-menu-button');
          const navMenu = document.querySelector('.nav-menu');
          if (mobileMenuButton && navMenu) {
            mobileMenuButton.addEventListener('click', () => {
              navMenu.classList.toggle('active'); 
            });
          }

          // Register Service Worker for offline support
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                  console.log('[Service Worker] Registration successful:', registration.scope);
                })
                .catch((error) => {
                  console.error('[Service Worker] Registration failed:', error);
                });
            });
          }
          
        </script>
      </body>
      </html>
    `;
    console.log('pageTemplate finished successfully for title:', title);
    return html;
  } catch (e) {
    console.error("Error during pageTemplate HTML generation:", e);
    return `<html><body>Template Error for ${title}: ${e.message}</body></html>`;
  }
} 