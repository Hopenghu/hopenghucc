import { getAdminStyles } from '../styles/adminStyles.js';

export function adminPageTemplate({ title, content, user, nonce }) {
  const adminStyles = getAdminStyles();
  
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - HOPE PENGHU Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
      <style nonce="${nonce}">
        ${adminStyles}
      </style>
    </head>
    <body>
      <div class="admin-container">
        <aside class="admin-sidebar">
          <div class="admin-header">
            <h1 class="admin-title">管理後台</h1>
          </div>
          <ul class="admin-menu">
            <li class="admin-menu-item">
              <a href="/admin/dashboard" class="admin-menu-link">儀表板</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/users" class="admin-menu-link">用戶管理</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/places" class="admin-menu-link">景點管理</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/events" class="admin-menu-link">活動管理</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/offers" class="admin-menu-link">優惠管理</a>
            </li>
            <li class="admin-menu-item">
              <button onclick="logout()" class="admin-button admin-button-danger">登出</button>
            </li>
          </ul>
        </aside>

        <main class="admin-content">
          ${content}
        </main>
      </div>

      <script nonce="${nonce}">
        async function logout() {
          try {
            const response = await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              window.location.href = '/admin/login';
            }
          } catch (error) {
            console.error('Error logging out:', error);
          }
        }
      </script>
    </body>
    </html>
  `;
} 