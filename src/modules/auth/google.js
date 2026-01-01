// src/modules/auth/google.js
// Module dedicated to Google OAuth flow and related DB operations

// Helper to generate secure random strings (e.g., for session IDs)
// Use Web Crypto API for Cloudflare Workers compatibility
function generateSecureId(length = 32) {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Handles the initiation of the Google OAuth flow.
 * Generates the Google authorization URL and sets the state cookie.
 * 
 * @param {URL} requestUrl The incoming request URL object.
 * @param {object} env Cloudflare environment object containing GOOGLE_CLIENT_ID.
 * @returns {Response} A 302 Redirect Response to Google's OAuth endpoint.
 * @throws {Error} If GOOGLE_CLIENT_ID is not configured.
 */
export function initiateGoogleAuth(requestUrl, env) {
  console.log("[Auth Google Module] Initiating flow...");
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('[Auth Google Module] GOOGLE_CLIENT_ID missing in environment.');

  const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
  const scope = 'openid email profile';
  const state = crypto.randomUUID();
  // State cookie: REMOVED SameSite=Lax for testing
  const stateCookie = `google_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`;

  console.log('[Auth Google Module] Setting state cookie header (No SameSite):', stateCookie);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  console.log(`[Auth Google Module] Redirecting user to: ${authUrl.toString()}`);
  const headers = new Headers({
    'Location': authUrl.toString(),
    'Content-Type': 'text/plain', // 302 responses don't strictly need a content-type, but good practice
    'Set-Cookie': stateCookie
  });
  return new Response(null, { status: 302, headers });
}

/**
 * Handles the initiation of the Google OAuth flow *specifically to request GMB scopes*.
 * Generates the Google authorization URL with additional GMB scopes and sets a distinct state cookie.
 * 
 * @param {URL} requestUrl The incoming request URL object.
 * @param {object} env Cloudflare environment object containing GOOGLE_CLIENT_ID.
 * @param {string} existingUserId - The ID of the already logged-in user (optional, can be used in state).
 * @returns {Response} A 302 Redirect Response to Google's OAuth endpoint.
 * @throws {Error} If GOOGLE_CLIENT_ID is not configured.
 */
export function initiateGmbAuth(requestUrl, env, existingUserId = null) {
  console.log("[Auth Google Module] Initiating GMB scope request flow...");
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('[Auth Google Module] GOOGLE_CLIENT_ID missing in environment.');

  const redirectUri = 'https://www.hopenghu.cc/api/auth/google/callback';
  // Scopes: Basic profile info + GMB manage (required for listing accounts/locations)
  const scope = 'openid email profile https://www.googleapis.com/auth/business.manage'; 
  const state = crypto.randomUUID(); // Generate a new state for this specific request
  
  // Use a different cookie name or add info to state if needed to differentiate callback later
  // For now, we'll rely on the callback handler checking the received scopes/token capabilities
  const stateCookie = `google_gmb_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300`; 
  console.log('[Auth Google Module] Setting GMB state cookie header:', stateCookie);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  // Optional: Add login_hint if user is already known to potentially speed up Google's side
  // if (userEmail) authUrl.searchParams.set('login_hint', userEmail);
  // Optional: Add prompt=consent to always show the consent screen for GMB scope
  // authUrl.searchParams.set('prompt', 'consent');

  console.log(`[Auth Google Module] Redirecting user for GMB scope to: ${authUrl.toString()}`);
  const headers = new Headers({
    'Location': authUrl.toString(),
    'Set-Cookie': stateCookie
  });
  return new Response(null, { status: 302, headers });
}

/**
 * Handles the Google OAuth callback.
 * Validates state, exchanges code for token, fetches user info,
 * finds or creates the user in the database, and creates a session.
 * 
 * @param {Request} request The incoming request object.
 * @param {object} env Cloudflare environment object (DB, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).
 * @returns {Response} A 302 Redirect Response to the application (e.g., /google-info) on success, or an error Response.
 */
export async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const responseHeaders = new Headers(); // Headers for the final response
  console.log("[Auth Google Callback Module] Handling callback...");

  try {
    // --- 1. State Validation --- 
    const stateParam = url.searchParams.get('state');
    const cookieHeader = request.headers.get('Cookie') || '';
    console.log('[Auth Google Callback Module] Received Cookie header:', cookieHeader);
    const stateCookieMatch = cookieHeader.match(/google_oauth_state=([^;]+)/);
    const storedState = stateCookieMatch ? stateCookieMatch[1] : null;

    // Prepare to clear state cookie immediately (also remove SameSite here for consistency)
    responseHeaders.set('Set-Cookie', 'google_oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure');

    console.log(`[Auth Google Callback Module] State validation: URL='${stateParam}', Cookie='${storedState}'`);
    if (!stateParam || !storedState || stateParam !== storedState) {
      throw new Error('OAuth state validation failed.');
    }
    console.log('[Auth Google Callback Module] State validation successful.');

    // --- 2. Code Exchange --- 
    const code = url.searchParams.get('code');
    if (!code) throw new Error('Missing code parameter.');

    console.log('[Auth Google Callback Module] Exchanging code for token...');
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
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorBody}`);
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error('Access token not found in response.');
    console.log('[Auth Google Callback Module] Token exchange successful.');

    // --- 3. Fetch User Info --- 
    console.log('[Auth Google Callback Module] Fetching user info...');
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userInfoResponse.ok) {
      const errorBody = await userInfoResponse.text();
      throw new Error(`Fetching user info failed: ${userInfoResponse.status} - ${errorBody}`);
    }
    const userInfo = await userInfoResponse.json();
    if (!userInfo || !userInfo.id || !userInfo.email) {
        console.error('[Auth Google Callback Module] Incomplete user info received:', userInfo);
        throw new Error('Incomplete user info from Google.');
    }
    console.log('[Auth Google Callback Module] Raw user info:', userInfo);

    // --- 4. Find or Create User in DB --- 
    const db = env.DB;
    if (!db) throw new Error('Database binding (DB) not found in environment.');

    const userEmail = userInfo.email;
    const googleId = String(userInfo.id); // Ensure string
    const userName = userInfo.name || 'Google User';
    const avatarUrl = userInfo.picture || ''; // Use empty string
    const now = new Date();
    const nowIso = now.toISOString();
    let userId;
    let isNewUser = false;

    console.log(`[Auth Google Callback Module] Checking for user: ${userEmail}`);
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(userEmail).first();

    if (existingUser) {
      userId = existingUser.id;
      console.log(`[Auth Google Callback Module] Updating existing user: ${userId}`);
      const stmt = db.prepare('UPDATE users SET name = ?, google_id = ?, avatar_url = ?, updated_at = ? WHERE id = ?');
      await stmt.bind(userName, googleId, avatarUrl, nowIso, userId).run();
    } else {
      isNewUser = true;
      // Removed manual UUID generation for ID, letting DB auto-increment handle it
      console.log(`[Auth Google Callback Module] Creating new user (Auto-ID)`);
      
      // Prepare statement WITHOUT id
      const stmt = db.prepare('INSERT INTO users (email, name, google_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      
      // Log before attempting insert
      console.log('[Auth Google Callback Module] Binding INSERT values:', { email: userEmail, name: userName, google_id: googleId, avatar_url: avatarUrl, created_at: nowIso, updated_at: nowIso });
      
      const result = await stmt.bind(userEmail, userName, googleId, avatarUrl, nowIso, nowIso).run();
      
      // Retrieve the auto-generated ID
      if (result.meta && result.meta.last_row_id) {
          userId = result.meta.last_row_id;
          console.log('[Auth Google Callback Module] New user created successfully. ID:', userId);
      } else {
          console.error('[Auth Google Callback Module] Failed to retrieve new user ID from insert result:', result);
          throw new Error('Failed to create new user: Could not retrieve ID.');
      }
    }

    // --- 5. Create Session --- 
    console.log(`[Auth Google Callback Module] Creating session for user: ${userId}`);
    const sessionId = generateSecureId();
    // Use Date object for expiration calculation to match SessionService format
    const expiresAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); 
    const expiresAtIso = expiresAt.toISOString();
    
    const sessionStmt = db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)');
    await sessionStmt.bind(sessionId, userId, expiresAtIso, nowIso).run();
    console.log(`[Auth Google Callback Module] Session created: ${sessionId}`);

    // --- 6. Set Session Cookie & Redirect --- 
    const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
    responseHeaders.append('Set-Cookie', sessionCookie); // Add session cookie (state cookie clear already set)
    responseHeaders.append('Location', '/'); // Redirect to homepage to show logged in state

    console.log('[Auth Google Callback Module] Success. Session created:', sessionId);
    console.log('[Auth Google Callback Module] User created/updated:', { userId, email: userEmail, name: userName, avatar_url: avatarUrl });
    console.log('[Auth Google Callback Module] Redirecting to homepage with session cookie...');
    return new Response(null, { status: 302, headers: responseHeaders });

  } catch (error) {
    console.error('[Auth Google Callback Module] Error:', error);
    // Return error response, ensuring state cookie is cleared (without SameSite)
    responseHeaders.set('Content-Type', 'text/plain'); 
    return new Response(`Authentication Failed: ${error.message}`, { status: 500, headers: responseHeaders });
  }
}

// Potential future additions:
// - Function for logout (clearing session from DB and cookie)
// - Function to get user from session ID 