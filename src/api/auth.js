import { SessionService } from '../services/SessionService.js';
import { randomBytes } from 'node:crypto'; // Import for session ID generation

// Helper to generate session ID (if not already in session.js)
function generateSessionId() {
  return randomBytes(32).toString('hex');
}

export async function handleAuthRequest(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  // Basic path check (expecting /api/auth/google[/callback] or /api/auth/logout)
  if (pathParts.length < 3 || pathParts[0] !== 'api' || pathParts[1] !== 'auth') {
    return new Response('Not Found', { status: 404 });
  }
  const action = pathParts[2];
  const subAction = pathParts[3];

  console.log(`[Auth] Request received: ${request.method} ${url.pathname}`);
  console.log(`[Auth] Action: ${action}, SubAction: ${subAction}`);

  // --- Google Auth Flow --- 
  if (action === 'google') {
    // 1. Initiation Step (GET /api/auth/google)
    if (request.method === 'GET' && !subAction) {
      try {
        console.log("[Auth Google] Initiating flow...");
        const clientId = env.GOOGLE_CLIENT_ID;
        if (!clientId) throw new Error('Google Client ID not configured');
        
        const redirectUri = `${url.origin}/api/auth/google/callback`;
        const scope = 'openid email profile';
        const state = crypto.randomUUID();
        const stateCookie = `google_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`; // 5 min expiry, Path=/
        
        console.log('[Auth Google] Setting state cookie header:', stateCookie);

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('state', state);

        console.log(`[Auth Google] Redirecting to: ${authUrl.toString()}`);
        const headers = new Headers({
          'Location': authUrl.toString(),
          'Content-Type': 'text/plain',
          'Set-Cookie': stateCookie
        });
        return new Response(null, { status: 302, headers });
      } catch (error) {
        console.error('[Auth Google] Initiation Error:', error);
        return new Response('Google Auth Initiation Failed', { status: 500 });
      }
    }

    // 2. Callback Step (GET /api/auth/google/callback)
    if (request.method === 'GET' && subAction === 'callback') {
      const callbackStateCookieHeader = new Headers(); // Headers for final response or error response
      try {
        console.log("[Auth Google Callback] Entering handler...");
        
        // 2a. State Validation
        const stateParam = url.searchParams.get('state');
        const cookieHeader = request.headers.get('Cookie') || '';
        console.log('[Auth Google Callback] Received Cookie header:', cookieHeader);
        const stateCookieMatch = cookieHeader.match(/google_oauth_state=([^;]+)/);
        const storedState = stateCookieMatch ? stateCookieMatch[1] : null;
        
        // Immediately prepare to clear the state cookie in the response
        callbackStateCookieHeader.append('Set-Cookie', 'google_oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax');

        console.log(`[Auth Google Callback] State validation: URL='${stateParam}', Cookie='${storedState}'`);
        if (!stateParam || !storedState || stateParam !== storedState) {
          throw new Error('OAuth state validation failed.');
        }
        console.log('[Auth Google Callback] State validation successful.');

        // 2b. Code Exchange
        const code = url.searchParams.get('code');
        if (!code) throw new Error('Missing code parameter in callback.');
        
        console.log('[Auth Google Callback] Exchanging code for token...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${url.origin}/api/auth/google/callback`,
            grant_type: 'authorization_code'
          })
        });
        if (!tokenResponse.ok) {
          const errorBody = await tokenResponse.text();
          throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorBody}`);
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) throw new Error('Access token not found in Google response.');
        console.log('[Auth Google Callback] Token exchange successful.');

        // 2c. Fetch User Info
        console.log('[Auth Google Callback] Fetching user info...');
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!userInfoResponse.ok) {
          const errorBody = await userInfoResponse.text();
          throw new Error(`Failed to get user info: ${userInfoResponse.status} ${userInfoResponse.statusText} - ${errorBody}`);
        }
        const userInfo = await userInfoResponse.json();
        if (!userInfo || !userInfo.id || !userInfo.email) {
          console.error('[Auth Google Callback] Incomplete user info received:', userInfo);
          throw new Error('Incomplete user info received from Google.');
        }
        console.log('[Auth Google Callback] Raw user info fetched:', userInfo);
        
        // 2d. Database Interaction (Find or Create User)
        const userEmail = userInfo.email;
        const googleId = String(userInfo.id); // Ensure string
        const userName = userInfo.name || 'Google User';
        const avatarUrl = userInfo.picture || ''; // Use empty string for null/missing
        const now = Math.floor(Date.now() / 1000);
        let userId;

        console.log(`[Auth Google Callback] Looking up user by email: ${userEmail}`);
        const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(userEmail).first();

        if (existingUser) {
          userId = existingUser.id;
          console.log(`[Auth Google Callback] Found existing user: ${userId}. Updating...`);
          const stmt = env.DB.prepare(
            'UPDATE users SET name = ?, google_id = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
          );
          console.log('[Auth Google Callback] Binding UPDATE values:', { name: userName, google_id: googleId, avatar_url: avatarUrl, updated_at: now, id: userId });
          await stmt.bind(userName, googleId, avatarUrl, now, userId).run();
          console.log(`[Auth Google Callback] User ${userId} updated.`);
        } else {
          userId = crypto.randomUUID();
          console.log(`[Auth Google Callback] User not found. Creating new user: ${userId}...`);
          const stmt = env.DB.prepare(
            'INSERT INTO users (id, email, name, google_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          );
          console.log('[Auth Google Callback] Binding INSERT values:', { id: userId, email: userEmail, name: userName, google_id: googleId, avatar_url: avatarUrl, created_at: now, updated_at: now });
          await stmt.bind(userId, userEmail, userName, googleId, avatarUrl, now, now).run();
          console.log(`[Auth Google Callback] New user ${userId} created.`);
        }

        // 2e. Create Session
        console.log(`[Auth Google Callback] Creating session for user: ${userId}...`);
        const sessionId = generateSessionId();
        const expiresAt = now + (7 * 24 * 60 * 60); // 7 days
        const sessionStmt = env.DB.prepare(
          'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
        );
        console.log('[Auth Google Callback] Binding session INSERT values:', { id: sessionId, user_id: userId, expires_at: expiresAt, created_at: now });
        await sessionStmt.bind(sessionId, userId, expiresAt, now).run();
        console.log(`[Auth Google Callback] Session ${sessionId} created.`);

        // 2f. Redirect with Session Cookie
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
        callbackStateCookieHeader.append('Set-Cookie', sessionCookie);
        callbackStateCookieHeader.append('Location', '/google-info'); // Redirect target

        console.log('[Auth Google Callback] Login successful. Redirecting to /google-info...');
        return new Response(null, { status: 302, headers: callbackStateCookieHeader });

      } catch (error) {
        console.error('[Auth Google Callback] Error:', error);
        // Return error response, ensuring state cookie is cleared
        callbackStateCookieHeader.set('Content-Type', 'text/plain');
        return new Response(`Google Authentication Failed: ${error.message}`, { status: 500, headers: callbackStateCookieHeader });
      }
    }

    // Invalid Google sub-action or method
    console.warn(`[Auth Google] Invalid request: ${request.method} ${url.pathname}`);
    return new Response('Invalid Google auth request', { status: 404 });
  }

  // --- Logout Flow --- 
  if (action === 'logout' && request.method === 'POST') {
    console.log('[Auth Logout] Handling logout...');
    const sessionCookieVal = request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];
    if (sessionCookieVal) {
      try {
        console.log(`[Auth Logout] Deleting session: ${sessionCookieVal}`);
        // Assuming deleteSession function exists and works correctly
        await deleteSession(env.DB, sessionCookieVal); 
        console.log(`[Auth Logout] Session ${sessionCookieVal} deleted.`);
      } catch (e) {
        console.error('[Auth Logout] Error deleting session:', e);
        // Continue logout even if DB deletion fails
      }
    }
    const logoutHeaders = new Headers();
    logoutHeaders.append('Set-Cookie', 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax');
    logoutHeaders.append('Location', '/'); // Redirect to homepage after logout
    console.log('[Auth Logout] Logout complete. Redirecting...');
    return new Response(null, { status: 302, headers: logoutHeaders });
  }

  // Fallback for unknown actions or methods
  console.warn(`[Auth] Action not found or method not allowed: ${action} ${request.method}`);
  return new Response('Auth action not found or method not allowed', { status: 404 });
} 