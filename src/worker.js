export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const session = await getSession(request, env);
      
      // 處理 API 請求
      if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request, env, session);
      }
      
      // 處理登入請求
      if (url.pathname === '/login') {
        return handleLogin(request, env);
      }
      
      // 處理登出請求
      if (url.pathname === '/logout') {
        return handleLogout(request, env);
      }
      
      // 處理根路徑請求
      if (url.pathname === '/') {
        return new Response(`
          <!DOCTYPE html>
          <html lang="zh-TW">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>HOPE PENGHU | 好澎湖</title>
              <script src="https://accounts.google.com/gsi/client" async defer></script>
              <script src="https://maps.googleapis.com/maps/api/js?key=${env.GOOGLE_MAPS_API_KEY}" async defer></script>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                  margin: 0;
                  padding: 0;
                  line-height: 1.6;
                }
                .header {
                  background-color: #2563eb;
                  color: white;
                  padding: 1rem;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 1.5rem;
                }
                .user-info {
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                }
                .user-avatar {
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                }
                .main-content {
                  max-width: 800px;
                  margin: 2rem auto;
                  padding: 0 1rem;
                }
                .login-button {
                  background-color: white;
                  color: #2563eb;
                  border: none;
                  padding: 0.5rem 1rem;
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: 500;
                }
                .logout-button {
                  background-color: transparent;
                  color: white;
                  border: 1px solid white;
                  padding: 0.5rem 1rem;
                  border-radius: 4px;
                  cursor: pointer;
                }
                #map {
                  height: 400px;
                  width: 100%;
                  margin-top: 2rem;
                  border-radius: 8px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>HOPE PENGHU | 好澎湖</h1>
                <div class="user-info">
                  ${session ? `
                    <img src="${session.avatar_url}" alt="${session.name}" class="user-avatar">
                    <span>${session.name}</span>
                    <button class="logout-button" onclick="window.location.href='/logout'">登出</button>
                  ` : `
                    <button class="login-button" onclick="window.location.href='/login'">登入</button>
                  `}
                </div>
              </div>
              <div class="main-content">
                <h2>歡迎來到好澎湖社區中心</h2>
                <p>這是一個基於 Cloudflare Workers 和 D1 資料庫的應用程式。</p>
                
                <div id="map"></div>
                
                <div class="api-section">
                  <h2>API 端點</h2>
                  
                  <div class="api-endpoint">
                    <h3>用戶 API</h3>
                    <p><code>GET /api/users</code> - 獲取用戶列表</p>
                    <p><code>POST /api/users</code> - 創建新用戶</p>
                  </div>
                  
                  <div class="api-endpoint">
                    <h3>活動 API</h3>
                    <p><code>GET /api/events</code> - 獲取活動列表</p>
                    <p><code>POST /api/events</code> - 創建新活動</p>
                  </div>
                </div>
              </div>
              <script>
                function initMap() {
                  const map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: 23.5712, lng: 119.5793 },
                    zoom: 12
                  });
                  
                  const marker = new google.maps.Marker({
                    position: { lat: 23.5712, lng: 119.5793 },
                    map: map,
                    title: '好澎湖社區中心'
                  });
                }
                
                window.onload = initMap;
              </script>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
          },
        });
      }
      
      // 處理 404 錯誤
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

async function getSession(request, env) {
  try {
    const sessionId = request.cookies.get('session_id');
    if (!sessionId) return null;
    
    const { results } = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(sessionId).all();
    
    return results[0] || null;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}

async function handleLogin(request, env) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      // 重定向到 Google 登入頁面
      const clientId = env.GOOGLE_CLIENT_ID;
      const redirectUri = `${url.origin}/login`;
      const scope = 'email profile';
      
      return Response.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`,
        302
      );
    }
    
    // 使用 code 獲取 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${url.origin}/login`,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token response error:', error);
      return new Response('Authentication failed', { status: 401 });
    }
    
    const tokenData = await tokenResponse.json();
    
    // 使用 access token 獲取用戶信息
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('User info response error:', error);
      return new Response('Failed to get user info', { status: 401 });
    }
    
    const userData = await userResponse.json();
    
    // 檢查用戶是否已存在
    const { results } = await env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(userData.id).all();
    
    let userId;
    
    if (results.length === 0) {
      // 創建新用戶
      const { success, meta } = await env.DB.prepare(
        'INSERT INTO users (google_id, name, email, avatar_url) VALUES (?, ?, ?, ?)'
      ).bind(
        userData.id,
        userData.name,
        userData.email,
        userData.picture
      ).run();
      
      userId = meta.last_row_id;
    } else {
      userId = results[0].id;
    }
    
    // 設置 session cookie
    const response = Response.redirect(url.origin, 302);
    response.headers.set('Set-Cookie', `session_id=${userId}; Path=/; HttpOnly; SameSite=Lax`);
    
    return response;
  } catch (error) {
    console.error('Error in handleLogin:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleLogout(request, env) {
  try {
    const response = Response.redirect(new URL(request.url).origin, 302);
    response.headers.set('Set-Cookie', 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return response;
  } catch (error) {
    console.error('Error in handleLogout:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleApiRequest(request, env, session) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    // 根據路徑處理不同的 API 請求
    switch (path) {
      case 'users':
        return handleUsersRequest(request, env);
      case 'events':
        return handleEventsRequest(request, env);
      default:
        return new Response('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('Error in handleApiRequest:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleUsersRequest(request, env) {
  try {
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM users LIMIT 10'
      ).all();
      return Response.json(results);
    }
    
    if (request.method === 'POST') {
      const data = await request.json();
      const { success } = await env.DB.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?)'
      ).bind(data.name, data.email).run();
      return Response.json({ success });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  } catch (error) {
    console.error('Error in handleUsersRequest:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleEventsRequest(request, env) {
  try {
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM events LIMIT 10'
      ).all();
      return Response.json(results);
    }
    
    if (request.method === 'POST') {
      const data = await request.json();
      const { success } = await env.DB.prepare(
        'INSERT INTO events (title, description, date) VALUES (?, ?, ?)'
      ).bind(data.title, data.description, data.date).run();
      return Response.json({ success });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  } catch (error) {
    console.error('Error in handleEventsRequest:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 