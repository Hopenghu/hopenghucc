export function pageTemplate({ title, content, user, nonce, cssContent }) {
  console.log('pageTemplate called with:', { title, user: !!user, nonce }); // Log input
  
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'HOPE PENGHU'} - HOPE PENGHU</title> 
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
        
        <!-- Removed CSS link tag -->
        <!-- <link rel="stylesheet" href="/build/worker.css"> -->

        <!-- Inject CSS content -->
        <style nonce="${nonce}">
          ${cssContent || '/* CSS content not provided */'}
        </style>

      </head>
      <body>
        <header class="header">
          <nav class="nav container">
            <a href="/" class="nav-logo">HOPE PENGHU</a>
            <ul class="nav-menu">
              ${user ? `
                <li class="nav-menu-item-avatar">
                  <div id="avatar-container" role="button" tabindex="0" aria-label="User menu" class="focus:outline-none avatar-container-div"> 
                     ${user.avatar_url ? 
                       `<img src="${user.avatar_url}" alt="User Avatar" class="user-avatar">` : 
                       `<span class="user-avatar avatar-fallback">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>` 
                     }
                  </div>
                  
                  <div id="user-dropdown-menu" class="user-dropdown">
                    <div class="dropdown-header">
                       <p class="dropdown-header-name">${user.name || 'User'}</p>
                       <p class="dropdown-header-email">${user.email || ''}</p>
                    </div>
                    <a href="/google-info" class="dropdown-item">我的帳號</a>
                    <div class="dropdown-divider"></div>
                    <button id="logout-button" class="dropdown-item">登出</button>
                  </div>
                </li>
              ` : `
                <li><a href="/login" class="button button-primary">登入</a></li>
              `}
            </ul>
            <button id="mobile-menu-button" class="mobile-menu-toggle">☰</button> 
          </nav>
        </header>

        <main class="container">
          ${content || '<p>頁面內容載入中...</p>'} 
        </main>

        <footer class="footer">
          <div class="container">
            <p>&copy; ${new Date().getFullYear()} HOPE PENGHU. All rights reserved.</p>
          </div>
        </footer>

        <script nonce="${nonce}">
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

          // Event listener for mobile menu 
          const mobileMenuButton = document.getElementById('mobile-menu-button');
          const navMenu = document.querySelector('.nav-menu');
          if (mobileMenuButton && navMenu) {
            mobileMenuButton.addEventListener('click', () => {
              navMenu.classList.toggle('active'); 
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