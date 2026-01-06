// Import new services
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';
import { SessionService } from './services/SessionService.js';
import { GoogleAuthService } from './services/GoogleAuthService.js';
import { LocationService } from './services/LocationService.js';
import { LocationInvitationService } from './services/LocationInvitationService';
import { AIService } from './services/AIService.js';
import { BusinessVerificationService } from './services/BusinessVerificationService.js';

// Import new route handlers for business verification test page
import { showBusinessVerificationPage, handleAdminInitiate, handleUserRequestVerification } from './routes/business-verification.js';
import { renderAdminKnowledgePage } from './pages/AdminKnowledgePage.js';
import { handleAdminKnowledgeRequest } from './api/admin-knowledge.js';

// Import main route handlers
import { routePageRequest, handleApiRequest } from './routes/index.js';

// Keep existing imports if still needed (like templates, initiateGoogleAuth)
import { initiateGoogleAuth, initiateGmbAuth } from './modules/auth/google.js'; // Import BOTH functions
import { handleGoogleCallback } from './modules/auth/google.js';
// Removed: import { handleLogout } from './modules/auth/logout.js'; 
// Removed: import { getUserFromSession } from './modules/session/service.js'; 
import { getHomePageHtml, getGoogleInfoPageHtml, getProfilePageHtml, getProfilePageContent, getHomePageContent, getAddPlacePageHtml, getAdminInvitationsPageHtml, getClaimLocationPageHtml } from './templates/html.js';
// import { Router } from 'itty-router'; // Router not used directly

// Import bundled CSS as text
import bundledCss from './styles/tailwind.output.css';

// Import debug API
import { handleDebugRequest } from './api/debug.js';

// Import auth middleware
import { requireAdmin, requireAdminAPI } from './middleware/auth.js';

// Helper to parse cookies
function getCookie(request, name) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

// Initialize router
// const router = Router(); // Router not used directly

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    console.log(`[Worker] Received request: ${request.method} ${pathname}`);

    // Instantiate services
    let authService, userService, sessionService, googleAuthService, locationService, locationInvitationService, businessVerificationService;
    try {
      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate UserService...");
      userService = new UserService(env.DB);
      console.log("[Worker INSTANTIATION_SUCCESS] UserService instantiated.");

      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate SessionService...");
      sessionService = new SessionService(env.DB);
      console.log("[Worker INSTANTIATION_SUCCESS] SessionService instantiated.");

      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate GoogleAuthService...");
      googleAuthService = new GoogleAuthService(env);
      console.log("[Worker INSTANTIATION_SUCCESS] GoogleAuthService instantiated.");

      // Check if GoogleAuthService is enabled
      if (!googleAuthService.enabled) {
        console.warn("[Worker] GoogleAuthService is disabled - Google authentication will not work");
      }

      // --- LocationService Instantiation ---
      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate LocationService. env.DB defined:", !!env.DB, "env.GOOGLE_MAPS_API_KEY defined:", !!env.GOOGLE_MAPS_API_KEY);
      if (!env.GOOGLE_MAPS_API_KEY) {
        console.error("[Worker PRE-INSTANTIATION_ERROR] GOOGLE_MAPS_API_KEY is not defined in env!");
        // Consider throwing, but let constructor handle it for now to see its specific error if mapsApiKey is the issue
      }
      locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
      console.log("[Worker INSTANTIATION_SUCCESS] LocationService instantiated. locationService defined:", !!locationService, "locationService.db defined:", !!(locationService && locationService.db));
      // --- End LocationService Instantiation ---

      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate LocationInvitationService...");
      locationInvitationService = new LocationInvitationService(env.DB);
      console.log("[Worker INSTANTIATION_SUCCESS] LocationInvitationService instantiated.");

      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate BusinessVerificationService...");
      businessVerificationService = new BusinessVerificationService(env.DB);
      console.log("[Worker INSTANTIATION_SUCCESS] BusinessVerificationService instantiated.");

      console.log("[Worker INSTANTIATION_ATTEMPT] Attempting to instantiate AuthService...");
      authService = new AuthService(userService, sessionService, googleAuthService);
      console.log("[Worker INSTANTIATION_SUCCESS] AuthService instantiated. All services ready.");

    } catch (err) {
      console.error('[Worker INSTANTIATION_FAILURE] Failed to instantiate one or more services:', err);
      console.error('[Worker INSTANTIATION_FAILURE] Error name:', err.name);
      console.error('[Worker INSTANTIATION_FAILURE] Error message:', err.message);
      console.error('[Worker INSTANTIATION_FAILURE] Error stack:', err.stack); // Log stack for more details

      // Set services to null to indicate they failed to initialize
      userService = null;
      sessionService = null;
      googleAuthService = null;
      locationService = null;
      locationInvitationService = null;
      authService = null;

      // Specific checks for known instantiation errors
      if (err.message && err.message.includes('mapsApiKey')) {
        console.error('[Worker INSTANTIATION_FAILURE_DETAIL] GOOGLE_MAPS_API_KEY secret might be missing or LocationService constructor threw an error related to it.');
      }
      if (err.message && err.message.includes('Database connection (db) is required')) {
        console.error('[Worker INSTANTIATION_FAILURE_DETAIL] Database connection (env.DB) was likely undefined when passed to a service constructor.');
      }

      // Continue with basic functionality even if services failed to initialize
      console.warn('[Worker] Continuing with limited functionality due to service initialization failure');
    }

    // Get user and session from AuthService (if available)
    let user = null;
    let session = null;
    if (authService) {
      const cookieHeader = request.headers.get('cookie') || '';
      console.log('[Worker] Cookie header:', cookieHeader.substring(0, 200)); // Log first 200 chars
      const sessionId = getCookie(request, 'session');
      console.log('[Worker] Extracted sessionId:', sessionId ? sessionId.substring(0, 20) + '...' : 'null');
      console.log('[Worker] Pathname:', pathname, 'Method:', request.method);

      if (sessionId) {
        user = await authService.getUserFromSession(sessionId);
        console.log('[Worker] User from session:', user ? { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } : 'null');
      } else {
        console.log('[Worker] No sessionId found in cookies');
      }

      // Get session object if sessionId exists
      if (sessionId && sessionService) {
        try {
          session = await sessionService.getSessionById(sessionId);
        } catch (error) {
          console.warn('[Worker] Could not get session object:', error.message);
        }
      }
    } else {
      console.warn('[Worker] AuthService not available, user will be null');
    }

    // Attach services to env for downstream use
    env.services = {
      user: userService,
      session: sessionService,
      googleAuth: googleAuthService,
      location: locationService,
      locationInvitation: locationInvitationService,
      auth: authService,
      businessVerification: businessVerificationService
    };

    // Generate nonce for CSP
    const nonce = crypto.randomUUID();

    // --- Favicon Route (Early, before other routes) ---
    if (pathname === '/favicon.ico') {
      // 返回实际的 favicon.ico 文件
      const faviconBase64 = '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';
      const faviconBuffer = Uint8Array.from(atob(faviconBase64), c => c.charCodeAt(0));
      return new Response(faviconBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    }

    try {
      // --- Basic Routing --- 

      // Homepage Route - 使用新的 routePageRequest 以支持时光机 UI
      // 直接使用 routePageRequest 处理首页，它会调用 renderHomePage（包含新UI）
      if (request.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        console.log('[Worker] Serving homepage via routePageRequest (with Time Machine UI).');
        try {
          return await routePageRequest(request, env, session, user, nonce, bundledCss);
        } catch (error) {
          console.error('[Worker] Error in routePageRequest for homepage:', error);
          return new Response('Homepage Error: ' + error.message, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      // Google Auth Routes - Must be before general /api/ route handler
      if (request.method === 'GET' && pathname === '/api/auth/google') {
        console.log('[Worker] Handling /api/auth/google route');
        try {
          // Initial basic login
          return initiateGoogleAuth(url, env);
        } catch (error) {
          console.error('[Worker] Error in initiateGoogleAuth:', error);
          return new Response(`Google Auth Error: ${error.message}`, { status: 500 });
        }
      }
      // --- NEW ROUTE for requesting GMB Scope ---
      if (request.method === 'GET' && pathname === '/api/auth/google/request-gmb-scope') {
        console.log('[Worker] Handling request for GMB scope...');
        // Ensure user is logged in before requesting additional scopes
        if (!user) {
          console.log('[Worker] User not logged in. Redirecting to login for GMB scope request.');
          // Redirect to the standard login flow first
          return Response.redirect(url.origin + '/api/auth/google', 302);
        }
        // User is logged in, initiate the flow for GMB scope
        return initiateGmbAuth(url, env, user.id); // Pass user ID if needed later
      }
      // --- End NEW ROUTE ---
      if (request.method === 'GET' && pathname === '/api/auth/google/callback') {
        console.log('[Worker] Handling Google callback...');
        console.log(`[Worker] Callback URL: ${url.toString()}`);

        try {
          // Use the complete handleGoogleCallback function which includes state validation
          const response = await handleGoogleCallback(request, env);

          // If successful, modify redirect to go to homepage instead of /google-info
          // IMPORTANT: Preserve all headers including Set-Cookie
          if (response.status === 302) {
            const location = response.headers.get('Location');
            const setCookieHeader = response.headers.get('Set-Cookie');
            console.log('[Worker] Callback response - Location:', location);
            console.log('[Worker] Callback response - Set-Cookie present:', !!setCookieHeader);
            if (setCookieHeader) {
              console.log('[Worker] Set-Cookie value:', setCookieHeader.substring(0, 100));
            }

            // Create new headers preserving all existing headers (especially Set-Cookie)
            const newHeaders = new Headers();
            // Copy all headers from the original response
            response.headers.forEach((value, key) => {
              newHeaders.append(key, value);
            });
            // Ensure redirect goes to homepage
            newHeaders.set('Location', '/');
            console.log('[Worker] Redirecting to homepage with preserved headers. Set-Cookie present:', newHeaders.has('Set-Cookie'));
            return new Response(null, { status: 302, headers: newHeaders });
          }

          return response;
        } catch (error) {
          console.error('[Worker] Google callback error:', error);
          // Redirect to homepage with an error query parameter
          const headers = new Headers();
          headers.append('Location', '/?error=google_auth_failed');
          return new Response(null, { status: 302, headers });
        }
      }

      // Admin Knowledge API Routes
      if (pathname.startsWith('/api/admin/knowledge')) {
        return await handleAdminKnowledgeRequest(request, env, user);
      }

      // Admin Knowledge Page Route
      if (request.method === 'GET' && (pathname === '/admin/knowledge' || pathname === '/admin/knowledge/')) {
        const nonce = crypto.randomUUID();
        const html = await renderAdminKnowledgePage(request, env, session, user, nonce, bundledCss);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Content-Security-Policy': `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; connect-src 'self' https://maps.googleapis.com; frame-src 'self' https://www.google.com;`
          }
        });
      }

      // Logout Route
      if (request.method === 'POST' && pathname === '/api/auth/logout') {
        console.log('[Worker] Handling logout...');
        const currentSessionId = getCookie(request, 'session');
        if (currentSessionId) {
          try {
            if (!authService) {
              console.error('[Worker] AuthService not available for logout');
              return new Response('Authentication service unavailable', { status: 500 });
            }
            await authService.logout(currentSessionId);
            console.log('[Worker] Logout successful for session:', currentSessionId);
          } catch (error) {
            console.error('[Worker] Logout error:', error);
            // Even if server-side logout fails, proceed to clear cookie
          }
        }
        // Clear the cookie by setting expiry in the past
        const cookieValue = `session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
        const headers = new Headers();
        headers.append('Set-Cookie', cookieValue);
        headers.append('Location', '/'); // Redirect to homepage after logout
        return new Response(null, { status: 302, headers });
      }

      // Google Info Page Route
      if (request.method === 'GET' && pathname === '/google-info') {
        console.log('[Worker] Serving Google Info page.');
        const html = getGoogleInfoPageHtml(user, bundledCss);
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }

      // Test Route - 已移除，由 routes/index.js 處理

      // Profile Page Route
      if (request.method === 'GET' && pathname === '/profile') {
        console.log('[Worker] Profile route matched, pathname:', pathname, 'method:', request.method);
        console.log('[Worker] Profile route matched, checking user authentication...');
        console.log('[Worker] User object:', user ? 'exists' : 'null');

        if (!user) {
          console.log('[Worker] User not logged in, redirecting from /profile to /');
          return Response.redirect(url.origin + '/', 302);
        }
        console.log('[Worker] User authenticated, serving profile page for:', user.email);

        // 獲取用戶的所有地點，按狀態分類
        let userLocations = [];
        let userCreatedLocations = [];
        let allLocations = []; // 移到 try 塊外面
        let userLocationCounts = null;
        let locationInteractionCounts = {};
        let userLocationStatuses = {};

        try {
          if (!locationService) {
            console.error('[Worker /profile] LocationService not available');
            return new Response('Location service unavailable', { status: 500 });
          }

          console.log('[Worker /profile] Getting user locations...');
          userLocations = await locationService.getUserLocations(user.id);
          console.log('[Worker /profile] Found', userLocations.length, 'user locations');

          // 獲取用戶建立的地點
          userCreatedLocations = await locationService.getUserCreatedLocations(user.id);
          console.log('[Worker /profile] Found', userCreatedLocations.length, 'user created locations');

          // 合併所有地點
          allLocations = [...userLocations, ...userCreatedLocations];
          console.log('[Worker /profile] Total locations:', allLocations.length);

          // 優化：批量獲取互動統計和用戶狀態（避免 N+1 查詢問題）
          if (allLocations.length > 0) {
            const locationIds = allLocations.map(loc => loc.id);
            const [batchCounts, batchStatuses] = await Promise.all([
              locationService.getBatchLocationInteractionCounts(locationIds),
              locationService.getBatchUserLocationStatuses(user.id, locationIds)
            ]);
            locationInteractionCounts = batchCounts;
            userLocationStatuses = batchStatuses;
            console.log('[Worker /profile] Batch loaded interaction counts and user statuses');
          }

          // 獲取用戶地點統計
          userLocationCounts = await locationService.getUserLocationCounts(user.id);
          console.log('[Worker /profile] User location counts:', userLocationCounts);

        } catch (error) {
          console.error('[Worker /profile] Error fetching user data:', error);
          // 提供默認值，不阻擋頁面渲染
          userLocations = [];
          userCreatedLocations = [];
          allLocations = [];
          userLocationCounts = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
          locationInteractionCounts = {};
          userLocationStatuses = {};
        }

        console.log('[Worker /profile] Generating HTML...');
        // 使用新的全局佈局系統
        const html = getProfilePageHtml(user, bundledCss, allLocations, userLocationCounts, locationInteractionCounts, userLocationStatuses);
        console.log('[Worker /profile] HTML generated, length:', html.length);
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }

      // --- TODO: Add routes for email/password login/registration ---
      // Example:
      // if (request.method === 'POST' && pathname === '/api/auth/login') {
      //    const { email, password } = await request.json();
      //    try {
      //        const { session, user: loggedInUser } = await authService.loginWithPassword({ email, password });
      //        // Set cookie and return success response
      //    } catch (error) {
      //        // Return error response (e.g., 401 Unauthorized)
      //    }
      // }
      // if (request.method === 'POST' && pathname === '/api/auth/register') {
      //     // ... handle registration using authService.registerWithPassword ...
      // }

      // --- Location API Routes --- 

      // GET /api/maps/config - Provides the frontend Maps API Key
      if (request.method === 'GET' && pathname === '/api/maps/config') {
        console.log('[Worker] Providing Maps API config');
        // Ensure the API key is actually configured in the environment
        const apiKey = env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error('[Worker] GOOGLE_MAPS_API_KEY is not configured in environment secrets.');
          return new Response(JSON.stringify({ error: 'Maps configuration unavailable.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ apiKey: apiKey }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // --- NEW: POST /api/locations/reverse-geocode ---
      if (request.method === 'POST' && pathname === '/api/locations/reverse-geocode') {
        console.log('[Worker] Handling POST /api/locations/reverse-geocode');

        // 2. Parse request body for lat/lng
        let requestBody;
        let lat, lng;
        try {
          requestBody = await request.json();
          lat = requestBody.lat;
          lng = requestBody.lng;
          if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number') {
            throw new Error('Missing or invalid latitude/longitude.');
          }
        } catch (e) {
          console.error('[Worker] Invalid JSON or missing coordinates in reverse-geocode request:', e);
          return new Response(JSON.stringify({ error: 'Invalid request body: latitude and longitude required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Call LocationService (Using the service instantiated at fetch start)
        try {
          const result = await locationService.reverseGeocodeCoordinates(lat, lng);

          // 4. Return result from service
          if (result.error) {
            const statusCode = result.error === 'ZERO_RESULTS' ? 404 : 500;
            console.warn(`[Worker] Reverse geocode failed: ${result.error}`);
            // Forward the specific error from the service
            return new Response(JSON.stringify({ error: `Reverse geocoding failed: ${result.error}` }), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
          } else {
            console.log(`[Worker] Reverse geocode successful for ${lat}, ${lng}.`);
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        } catch (serviceError) {
          console.error('[Worker] Error calling LocationService.reverseGeocodeCoordinates:', serviceError);
          console.error('[Worker] Full serviceError object:', JSON.stringify(serviceError, Object.getOwnPropertyNames(serviceError)));
          return new Response(JSON.stringify({ error: 'Internal server error during reverse geocoding.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/locations/google-details/:placeId ---
      if (request.method === 'GET' && pathname.startsWith('/api/locations/google-details/')) {
        console.log('[Worker] Handling GET /api/locations/google-details/:placeId');
        const placeId = pathname.split('/').pop(); // Extract placeId from URL path

        if (!placeId) {
          console.error('[Worker] Missing placeId in google-details request path.');
          return new Response(JSON.stringify({ error: 'Missing Place ID in request path.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Authentication check (optional but recommended)
        // if (!user) { 
        //    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        // }

        try {
          const locationDetails = await locationService.fetchPlaceDetails(placeId);

          if (!locationDetails) {
            console.warn(`[Worker] No details found or error fetching details for placeId: ${placeId}`);
            // Return 404 if fetchPlaceDetails returned null (likely not found or API error)
            return new Response(JSON.stringify({ error: 'Place details not found or unable to fetch.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }

          console.log(`[Worker] Successfully fetched Google details for placeId: ${placeId}`);
          // Return the standardized details fetched by the service
          return new Response(JSON.stringify(locationDetails), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
          console.error(`[Worker] Error calling LocationService.fetchPlaceDetails for placeId ${placeId}:`, error);
          return new Response(JSON.stringify({ error: 'Internal server error fetching place details.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/locations/details-by-placeid/:placeId --- 
      if (request.method === 'GET' && pathname.startsWith('/api/locations/details-by-placeid/')) {
        console.log('[Worker] Handling GET /api/locations/details-by-placeid/:placeId');
        const placeId = pathname.split('/').pop();

        if (!placeId) {
          console.error('[Worker] Missing placeId in details-by-placeid request path.');
          return new Response(JSON.stringify({ error: 'Missing Place ID in request path.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Optional Authentication check
        // if (!user) { return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); }

        try {
          // Use the updated fetchPlaceDetails which now includes photoUrls
          const locationDetails = await locationService.fetchPlaceDetails(placeId);

          if (!locationDetails) {
            console.warn(`[Worker] No details found or error fetching details for placeId: ${placeId}`);
            return new Response(JSON.stringify({ error: 'Place details not found or unable to fetch.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }

          console.log(`[Worker] Successfully fetched details (incl. photos) for placeId: ${placeId}`);
          // Return the standardized details including photoUrls
          return new Response(JSON.stringify(locationDetails), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
          console.error(`[Worker] Error calling LocationService.fetchPlaceDetails for placeId ${placeId} (details-by-placeid route):`, error);
          return new Response(JSON.stringify({ error: 'Internal server error fetching place details.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/locations/existing ---
      if (request.method === 'GET' && pathname === '/api/locations/existing') {
        console.log('[Worker] Handling GET /api/locations/existing');

        try {
          // 獲取所有已存在的地點（限制數量以避免性能問題）
          const stmt = locationService.db.prepare(`
                SELECT id, name, address, latitude, longitude, google_place_id, 
                       google_types, phone_number, website, google_rating, 
                       google_user_ratings_total, business_status, thumbnail_url, 
                       editorial_summary
                FROM locations 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY created_at DESC 
                LIMIT 100
            `);

          const result = await stmt.all();
          console.log(`[Worker] Found ${result.results.length} existing locations`);

          return new Response(JSON.stringify(result.results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('[Worker] Error fetching existing locations:', error);
          return new Response(JSON.stringify({ error: 'Internal server error fetching existing locations.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // --- END NEW ROUTE ---

      // POST /api/locations/import/google-place
      if (request.method === 'POST' && pathname === '/api/locations/import/google-place') {
        console.log('[Worker] Handling POST /api/locations/import/google-place');
        // 1. Check authentication
        if (!user || !user.id) {
          console.log('[Worker] Unauthorized attempt to import location.');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const userId = user.id; // Use TEXT id from user object

        // 2. Parse request body
        let requestBody;
        try {
          requestBody = await request.json();
        } catch (e) {
          console.error('[Worker] Invalid JSON in request body:', e);
          return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const { googlePlaceId, coordinate } = requestBody;
        let location = null;
        let sourceDescription = ''; // For logging/messaging

        try {
          // 3. Determine input type and process accordingly
          if (googlePlaceId && typeof googlePlaceId === 'string') {
            sourceDescription = `Google Place ID: ${googlePlaceId}`;
            console.log(`[Worker] Processing import for ${sourceDescription}`);

            // 3a. Check if location exists locally by Place ID
            location = await locationService.findLocationByPlaceId(googlePlaceId);

            if (!location) {
              console.log(`[Worker] Location ${googlePlaceId} not found locally. Fetching from Google...`);
              // 3b. Fetch from Google
              const locationDetails = await locationService.fetchPlaceDetails(googlePlaceId);

              if (!locationDetails) {
                console.error(`[Worker] Failed to fetch details for ${googlePlaceId} from Google.`);
                return new Response(JSON.stringify({ error: 'Failed to fetch location details from Google.' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
              }

              // 3c. Create in local DB
              locationDetails.createdByUser = userId; // Add user ID
              console.log(`[Worker] Creating new local location record for ${googlePlaceId}`);
              try {
                location = await locationService.createLocation(locationDetails);
              } catch (createError) {
                // Handle potential race condition where another request created it just now
                if (createError.message.includes('already exists')) {
                  console.warn(`[Worker] Race condition? Location ${googlePlaceId} was created between check and insert. Fetching existing.`);
                  location = await locationService.findLocationByPlaceId(googlePlaceId);
                  if (!location) {
                    console.error(`[Worker] CRITICAL: Failed to find location ${googlePlaceId} after creation race condition.`);
                    throw new Error('Failed to resolve location after creation conflict.');
                  }
                } else {
                  throw createError; // Re-throw other creation errors
                }
              }
            } else {
              console.log(`[Worker] Location ${googlePlaceId} found locally (ID: ${location.id}).`);
            }

          } else if (coordinate && typeof coordinate === 'object' && coordinate.lat != null && coordinate.lng != null) {
            sourceDescription = `Coordinates: ${coordinate.lat}, ${coordinate.lng}`;
            console.log(`[Worker] Processing import for ${sourceDescription}`);

            // 3d. Create location directly from coordinates (skipping check for nearby locations for now)
            const coordinateData = {
              latitude: coordinate.lat,
              longitude: coordinate.lng,
              createdByUser: userId
            };
            location = await locationService.createCoordinateLocation(coordinateData);

          } else {
            console.log('[Worker] Invalid request body. Requires googlePlaceId (string) or coordinate ({lat, lng}). Body:', requestBody);
            return new Response(JSON.stringify({ error: 'Invalid request body. Requires googlePlaceId or coordinate.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }

          // 4. If location was found or created, link the user
          if (!location || !location.id) {
            // This should not happen if the logic above is correct, but handle defensively
            console.error('[Worker] Failed to obtain valid location object after processing.', { googlePlaceId, coordinate });
            throw new Error('Failed to obtain location information.');
          }

          let userLocationLink = null;
          const isLinked = await locationService.checkUserLocationLink(userId, location.id);

          if (!isLinked) {
            console.log(`[Worker] Linking user ${userId} to location ${location.id} (${location.name})`);
            try {
              // TODO: Allow passing description/status from frontend in the future?
              userLocationLink = await locationService.linkUserToLocation(userId, location.id, {});
            } catch (linkError) {
              // Handle potential race condition or existing link error
              if (linkError.message.includes('already associated')) {
                console.warn(`[Worker] User ${userId} already linked to location ${location.id} (detected during link attempt).`);
              } else {
                throw linkError; // Re-throw other linking errors
              }
            }
          } else {
            console.log(`[Worker] User ${userId} is already linked to location ${location.id}.`);
          }

          // 5. Return success response
          console.log(`[Worker] Successfully processed import for ${sourceDescription} by user ${userId}.`);
          return new Response(JSON.stringify({
            message: `地點 '${location.name}' 已${isLinked ? '在' : '加入'}您的列表！`, // Indicate if it was added or already there
            locationId: location.id,
            userLocationLinkId: userLocationLink ? userLocationLink.id : null // Return link ID if newly created
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
          console.error(`[Worker] Error processing location import for ${sourceDescription}:`, error);
          // Return a server error, potentially masking specific DB errors
          // Customize error message based on specific thrown errors if needed
          const errorMessage = error.message || 'Failed to process location import.';
          let statusCode = 500;
          if (errorMessage.includes('already exists') || errorMessage.includes('already associated')) {
            // Treat constraint violations potentially as client errors if desired, or keep as 500
            // statusCode = 409; // Conflict
          }
          return new Response(JSON.stringify({ error: errorMessage }), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // --- Location API Routes (handled by handleLocationRequest in src/api/location.js) ---
      // ✅ GET /api/locations/paginated - Implemented
      // ✅ POST /api/location/status - Implemented
      // ✅ GET /api/search/locations - Implemented (in src/api/search.js)
      // ✅ GET /api/user/location-counts - Implemented
      // 
      // --- Future enhancements (not yet implemented) ---
      // TODO: Add POST /api/locations/import/coordinate route
      // TODO: Add PUT/PATCH /api/user/locations/:linkId (update description/status) route
      // TODO: Add POST /api/user/locations/:linkId/links (add link) route
      // TODO: Add DELETE /api/user/locations/:linkId/links/:linkId (delete link) route 

      // --- Page Routes ---

      // Add Place Page Route
      if (request.method === 'GET' && pathname === '/add-place') {
        if (!user) {
          console.log('[Worker] User not logged in, redirecting from /add-place to /');
          return Response.redirect(url.origin + '/', 302); // Redirect to login/home if not logged in
        }
        console.log('[Worker] Serving Add Place page for:', user.email);
        // Need to import getAddPlacePageHtml
        const html = getAddPlacePageHtml(user, bundledCss);
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }



      // Admin Manage Invitations Page Route
      if (request.method === 'GET' && pathname === '/admin/manage-invitations') {
        // Admin Check (using middleware)
        const authCheck = requireAdmin(user, request);
        if (authCheck) {
          console.log('[Worker] Non-admin attempt to access /admin/manage-invitations. Redirecting.');
          return authCheck;
        }
        console.log('[Worker] Serving Admin Manage Invitations page for:', user.email);

        let initialLocations = [];
        try {
          // Pass adminUserId (user.id) to the service method
          initialLocations = await locationService.getLocationsForAdminInvitation(user.id);
        } catch (error) {
          console.error('[Worker /admin/manage-invitations] Error fetching initial locations:', error);
        }

        const html = getAdminInvitationsPageHtml(user, bundledCss, initialLocations);
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }

      // GET /claim-location - User clicks the claim link
      if (request.method === 'GET' && pathname === '/claim-location') {
        console.log('[Worker /claim-location] Received request.');
        const token = url.searchParams.get('token');

        if (!token) {
          console.log('[Worker /claim-location] Token missing.');
          //
          return new Response(getClaimLocationPageHtml(user, bundledCss, { error: 'missing_token', message: '無效的認領連結，缺少權杖。' }), { status: 400, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
        }

        try {
          console.log(`[Worker /claim-location] Verifying token: ${token}`);
          const verificationResult = await locationInvitationService.verifyInvitationToken(token);
          console.log('[Worker /claim-location] Verification result:', verificationResult);

          if (!verificationResult.isValid) {
            let pageData = { error: verificationResult.error || 'invalid_token', message: verificationResult.message || '認領權杖無效或已過期。' };
            if (verificationResult.error === 'expired') {
              pageData.message = '此認領連結已過期。請聯繫管理員以獲取新的連結。';
            } else if (verificationResult.error === 'already_used') {
              pageData.message = '此認領連結已被使用或已失效。如果您認為這是錯誤，請聯繫管理員。';
            }
            return new Response(getClaimLocationPageHtml(user, bundledCss, pageData), { status: 400, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
          }

          const invitation = verificationResult.invitation;
          console.log(`[Worker /claim-location] Token valid for invitation:`, invitation);

          if (!user) {
            console.log('[Worker /claim-location] User not logged in. Redirecting to login.');
            // Store the original token in a temporary cookie or pass it via redirect to login
            const redirectUrl = new URL(url.origin + '/api/auth/google');
            redirectUrl.searchParams.set('redirectUrl', `/claim-location?token=${token}`); // Tell auth to redirect back here
            // Alternatively, a short-lived cookie could store the token if redirectUrl handling in auth is complex
            return Response.redirect(redirectUrl.toString(), 302);
          }

          console.log(`[Worker /claim-location] User ${user.email} is logged in. Comparing with invitation merchant_email: ${invitation.merchant_email}`);
          if (user.email.toLowerCase() !== invitation.merchant_email.toLowerCase()) {
            console.log('[Worker /claim-location] Email mismatch.');
            const pageData = {
              error: 'email_mismatch',
              message: `此認領連結是設計給 ${invitation.merchant_email} 的。您目前登入的帳號是 ${user.email}。請登出並使用正確的 Google 帳號登入後再試一次。`
            };
            return new Response(getClaimLocationPageHtml(user, bundledCss, pageData), { status: 403, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
          }

          console.log(`[Worker /claim-location] Email matches. Proceeding to claim location ID: ${invitation.location_id} for user ID: ${user.id}`);

          // Fetch location details to display name on success page (optional but nice)
          let locationName = '該地點';
          try {
            const locationDetails = await locationService.findLocationByInternalId(invitation.location_id);
            if (locationDetails) {
              locationName = locationDetails.name;
            }
          } catch (locError) {
            console.error(`[Worker /claim-location] Error fetching location name for ${invitation.location_id}:`, locError);
            // Non-critical, proceed with generic name
          }

          const claimResult = await locationService.claimLocation(invitation.location_id, user.id, user.email);
          console.log('[Worker /claim-location] Location claim result:', claimResult);

          if (!claimResult.success) {
            const pageData = {
              error: claimResult.error || 'claim_failed',
              message: claimResult.message || '認領地點時發生錯誤。請稍後再試或聯繫管理員。'
            };
            return new Response(getClaimLocationPageHtml(user, bundledCss, pageData), { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
          }

          // Location claimed successfully, now mark invitation as claimed
          console.log(`[Worker /claim-location] Marking invitation ID: ${invitation.id} as claimed by user ID: ${user.id}`);
          const markClaimedResult = await locationInvitationService.markInvitationAsClaimed(invitation.id, user.id);
          console.log('[Worker /claim-location] Mark invitation claimed result:', markClaimedResult);

          if (!markClaimedResult.success) {
            // This is a less critical error; the location is claimed, but the invitation status update failed.
            // Log it and inform user, but it's mostly a success.
            console.error(`[Worker /claim-location] CRITICAL: Location ${invitation.location_id} claimed by ${user.id}, BUT FAILED to mark invitation ${invitation.id} as claimed. Error: ${markClaimedResult.error}`);
            const pageData = {
              success_with_warning: true,
              locationName: locationName,
              message: `地點 ${locationName} 已成功由您認領！然而，更新邀請狀態時遇到問題，請通知管理員此情況。`
            };
            return new Response(getClaimLocationPageHtml(user, bundledCss, pageData), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
          }

          console.log(`[Worker /claim-location] Location ${invitation.location_id} successfully claimed by ${user.email} and invitation ${invitation.id} marked as claimed.`);
          const pageData = {
            success: true,
            locationName: locationName,
            message: `恭喜！地點 ${locationName} 已成功由您認領。您可以前往您的個人資料頁面查看。`
          };
          return new Response(getClaimLocationPageHtml(user, bundledCss, pageData), { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });

        } catch (error) {
          console.error('[Worker /claim-location] General error during claim process:', error);
          const pageData = {
            error: 'server_error',
            message: '處理您的認領請求時發生未預期的錯誤。請稍後再試或聯繫管理員。'
          };
          return new Response(getClaimLocationPageHtml(user, bundledCss, pageData), { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
        }
      }

      // --- NEW: POST /api/locations/nearby-search ---
      if (request.method === 'POST' && pathname === '/api/locations/nearby-search') {
        console.log('[Worker] Handling POST /api/locations/nearby-search');

        // Authentication (Optional)
        // if (!user) { return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); }

        // Parse request body for lat/lng
        let requestBody;
        let lat, lng;
        try {
          requestBody = await request.json();
          lat = requestBody.lat;
          lng = requestBody.lng;
          if (lat == null || lng == null || typeof lat !== 'number' || typeof lng !== 'number') {
            throw new Error('Missing or invalid latitude/longitude.');
          }
        } catch (e) {
          console.error('[Worker] Invalid JSON or missing coordinates in nearby-search request:', e);
          return new Response(JSON.stringify({ error: 'Invalid request body: latitude and longitude required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Call LocationService to find nearby place and its details
        try {
          const result = await locationService.findNearbyPlace(lat, lng);

          if (result) {
            console.log(`[Worker] Nearby search successful for ${lat}, ${lng}. Found: ${result.name}`);
            return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
          } else {
            // Handle case where no nearby place was found or details couldn't be fetched
            console.log(`[Worker] Nearby search for ${lat}, ${lng} did not find a suitable place or failed to get details.`);
            return new Response(JSON.stringify({ error: 'No nearby place found or details unavailable.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }
        } catch (serviceError) {
          console.error('[Worker] Error calling LocationService.findNearbyPlace:', serviceError);
          console.error('[Worker] Full serviceError object (nearby):', JSON.stringify(serviceError, Object.getOwnPropertyNames(serviceError)));
          return new Response(JSON.stringify({ error: 'Internal server error during nearby search.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/user/locations --- 
      if (request.method === 'GET' && pathname === '/api/user/locations') {
        console.log('[Worker] Handling GET /api/user/locations');
        // 1. Authentication Check
        if (!user || !user.id) {
          console.log('[Worker] Unauthorized attempt to access user locations.');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const userId = user.id;

        // 2. Call Service Method
        try {
          const locations = await locationService.getUserLocations(userId);
          console.log(`[Worker] Returning ${locations.length} locations for user ${userId}.`);
          return new Response(JSON.stringify(locations), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
          console.error(`[Worker] Error fetching locations for user ${userId} via API:`, error);
          return new Response(JSON.stringify({ error: 'Failed to fetch user locations.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: POST /api/location/status ---
      if (request.method === 'POST' && pathname === '/api/location/status') {
        console.log('[Worker] Handling POST /api/location/status');

        // 1. Authentication Check
        if (!user || !user.id) {
          console.log('[Worker] Unauthorized attempt to update location status.');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        try {
          const body = await request.json();
          const { locationId, status } = body;

          if (!locationId || !status) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Missing locationId or status'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // 驗證狀態值
          const validStatuses = ['visited', 'want_to_visit', 'want_to_revisit', 'created'];
          if (!validStatuses.includes(status)) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Invalid status value'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // 檢查地點是否存在
          const location = await locationService.getLocationById(locationId);
          if (!location) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Location not found'
            }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // 更新或創建用戶地點關聯
          await locationService.updateUserLocationStatus(user.id, locationId, status);

          return new Response(JSON.stringify({
            success: true,
            message: 'Location status updated successfully'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('[Worker] Error updating location status:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to update location status'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/user/location-counts ---
      if (request.method === 'GET' && pathname === '/api/user/location-counts') {
        console.log('[Worker] Handling GET /api/user/location-counts');

        // 1. Authentication Check
        if (!user || !user.id) {
          console.log('[Worker] Unauthorized attempt to get location counts.');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        try {
          const counts = await locationService.getUserLocationCounts(user.id);

          return new Response(JSON.stringify(counts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('[Worker] Error getting user location counts:', error);
          return new Response(JSON.stringify({
            error: 'Failed to get user location counts'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/location/global-counts ---
      if (request.method === 'GET' && pathname === '/api/location/global-counts') {
        console.log('[Worker] Handling GET /api/location/global-counts');

        try {
          const counts = await locationService.getGlobalLocationCounts();

          return new Response(JSON.stringify(counts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('[Worker] Error getting global location counts:', error);
          return new Response(JSON.stringify({
            error: 'Failed to get global location counts'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // --- END NEW ROUTE ---

      // --- NEW: GET /api/location/:locationId/interaction-counts ---
      if (request.method === 'GET' && pathname.match(/^\/api\/location\/[^\/]+\/interaction-counts$/)) {
        console.log('[Worker] Handling GET /api/location/:locationId/interaction-counts');

        const locationId = pathname.split('/')[3]; // Extract locationId from URL path

        if (!locationId) {
          console.error('[Worker] Missing locationId in interaction-counts request path.');
          return new Response(JSON.stringify({ error: 'Missing Location ID in request path.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        try {
          const counts = await locationService.getLocationInteractionCounts(locationId);

          return new Response(JSON.stringify(counts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('[Worker] Error getting location interaction counts:', error);
          return new Response(JSON.stringify({
            error: 'Failed to get location interaction counts'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // --- END NEW ROUTE ---

      // --- Admin API Routes (Replaces Hono setup) ---

      // POST /api/admin/locations/generate-claim-link
      if (request.method === 'POST' && pathname === '/api/admin/locations/generate-claim-link') {
        console.log('[Worker] Handling POST /api/admin/locations/generate-claim-link');
        // 1. Admin Check (using middleware)
        const authCheck = requireAdminAPI(user);
        if (authCheck) {
          console.log('[Worker] Non-admin attempt to access /api/admin/locations/generate-claim-link');
          return authCheck;
        }
        const adminUserId = user.id;

        try {
          const body = await request.json();
          const { location_id, merchant_email } = body;

          if (!location_id || !merchant_email) {
            return new Response(JSON.stringify({ error: 'Missing required fields: location_id and merchant_email.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }
          if (typeof merchant_email !== 'string' || !merchant_email.includes('@')) {
            return new Response(JSON.stringify({ error: 'Invalid merchant_email format.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }

          const location = await locationService.findLocationByInternalId(location_id);
          if (!location) {
            return new Response(JSON.stringify({ error: `Location with ID ${location_id} not found.` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }
          if (location.claimed_by_user_id) {
            return new Response(JSON.stringify({ error: `Location '${location.name || location_id}' is already claimed.` }), { status: 409, headers: { 'Content-Type': 'application/json' } });
          }

          const result = await locationInvitationService.generateClaimLink(location_id, merchant_email, adminUserId);

          if (result.error) {
            return new Response(JSON.stringify({ error: result.error }), { status: result.status || 500, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify(result), { status: 201, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
          console.error('Error in /api/admin/locations/generate-claim-link:', error);
          if (error instanceof SyntaxError) { // Check if error is due to invalid JSON
            return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ error: 'An unexpected server error occurred.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // GET /api/admin/locations-for-invitation
      if (request.method === 'GET' && pathname === '/api/admin/locations-for-invitation') {
        console.log('[Worker] Handling GET /api/admin/locations-for-invitation');
        // 1. Admin Check (using middleware)
        const authCheck = requireAdminAPI(user);
        if (authCheck) {
          console.log('[Worker] Non-admin attempt to access /api/admin/locations-for-invitation');
          return authCheck;
        }

        try {
          // Pass adminUserId (user.id) to the service method
          const locations = await locationService.getLocationsForAdminInvitation(user.id);
          return new Response(JSON.stringify(locations), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
          console.error('Error in /api/admin/locations-for-invitation:', error);
          return new Response(JSON.stringify({ error: 'Failed to fetch locations for invitation.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END Admin API Routes ---

      // --- Admin Page Routes (using routePageRequest) ---
      if (request.method === 'GET' && pathname.startsWith('/admin/')) {
        // Admin Check (using middleware)
        const authCheck = requireAdmin(user, request);
        if (authCheck) {
          console.log('[Worker] Non-admin attempt to access admin page. Redirecting.');
          return authCheck;
        }
        console.log('[Worker] Serving admin page via routePageRequest:', pathname);
        try {
          return await routePageRequest(request, env, session, user, nonce, bundledCss);
        } catch (error) {
          console.error('[Worker] Error in routePageRequest for admin page:', error);
          return new Response('Admin Page Error: ' + error.message, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      // --- Admin Dashboard Page Route (Legacy - kept for compatibility) ---
      if (request.method === 'GET' && pathname === '/admin/dashboard') {
        // Admin Check (using middleware)
        const authCheck = requireAdmin(user, request);
        if (authCheck) {
          console.log('[Worker] Non-admin attempt to access /admin/dashboard. Redirecting.');
          return authCheck;
        }
        console.log('[Worker] Serving Admin Dashboard page for:', user.email);

        // Enhanced admin dashboard with interactive features
        const html = `
          <!DOCTYPE html>
          <html lang="zh-TW">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>管理員儀表板 - HOPE PENGHU</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5; 
              }
              .container { 
                max-width: 1200px; 
                margin: 0 auto; 
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                border-radius: 12px; 
                margin-bottom: 30px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              }
              .header h1 { margin: 0 0 10px 0; font-size: 2.5em; }
              .header p { margin: 0; opacity: 0.9; }
              .grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
                margin-bottom: 30px; 
              }
              .card { 
                background: white; 
                padding: 25px; 
                border-radius: 12px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                transition: transform 0.2s; 
              }
              .card:hover { transform: translateY(-2px); }
              .card h3 { 
                margin: 0 0 15px 0; 
                color: #333; 
                border-bottom: 2px solid #667eea; 
                padding-bottom: 10px; 
              }
              .status { 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 8px; 
                font-weight: 500; 
              }
              .success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
              .warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
              .info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
              .danger { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
              .btn { 
                display: inline-block; 
                padding: 10px 20px; 
                margin: 5px; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                text-decoration: none; 
                font-weight: 500; 
                transition: all 0.2s; 
              }
              .btn-primary { background: #667eea; color: white; }
              .btn-primary:hover { background: #5a6fd8; }
              .btn-success { background: #28a745; color: white; }
              .btn-success:hover { background: #218838; }
              .btn-warning { background: #ffc107; color: #212529; }
              .btn-warning:hover { background: #e0a800; }
              .btn-danger { background: #dc3545; color: white; }
              .btn-danger:hover { background: #c82333; }
              .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
                gap: 15px; 
                margin: 15px 0; 
              }
              .stat { 
                text-align: center; 
                padding: 15px; 
                background: #f8f9fa; 
                border-radius: 8px; 
              }
              .stat-value { 
                font-size: 1.5em; 
                font-weight: bold; 
                color: #667eea; 
              }
              .stat-label { 
                font-size: 0.9em; 
                color: #666; 
                margin-top: 5px; 
              }
              .loading { 
                text-align: center; 
                padding: 20px; 
                color: #666; 
              }
              .log { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                font-family: monospace; 
                font-size: 0.9em; 
                max-height: 200px; 
                overflow-y: auto; 
                margin-top: 15px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 管理員儀表板</h1>
                <p>歡迎回來，${user.name || user.email}！系統監控與管理中心</p>
              </div>
              
              <div class="grid">
                <!-- 系統狀態卡片 -->
                <div class="card">
                  <h3>📊 系統狀態</h3>
                  <div id="system-status" class="loading">載入中...</div>
                  <div class="stats" id="system-stats"></div>
                  <button class="btn btn-primary" onclick="refreshSystemStatus()">刷新狀態</button>
                </div>
                
                <!-- 備份管理卡片 -->
                <div class="card">
                  <h3>💾 備份管理</h3>
                  <div id="backup-status" class="loading">載入中...</div>
                  <div class="stats" id="backup-stats"></div>
                  <button class="btn btn-success" onclick="createBackup()">創建備份</button>
                  <button class="btn btn-primary" onclick="checkBackupHealth()">健康檢查</button>
                </div>
                
                <!-- API 使用量卡片 -->
                <div class="card">
                  <h3>📈 API 使用量</h3>
                  <div id="api-status" class="loading">載入中...</div>
                  <div class="stats" id="api-stats"></div>
                  <button class="btn btn-primary" onclick="refreshApiStats()">刷新統計</button>
                </div>
                
                <!-- 安全審計卡片 -->
                <div class="card">
                  <h3>🔒 安全審計</h3>
                  <div id="security-status" class="loading">載入中...</div>
                  <div class="stats" id="security-stats"></div>
                  <button class="btn btn-warning" onclick="runSecurityAudit()">執行審計</button>
                  <button class="btn btn-primary" onclick="getSecurityStatus()">查看狀態</button>
                </div>
              </div>
              
              <!-- 快速操作區域 -->
              <div class="card">
                <h3>⚡ 快速操作</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                  <a href="/admin/manage-invitations" class="btn btn-primary">管理邀請</a>
                  <a href="/api/admin/system/status" class="btn btn-info" target="_blank">系統狀態 API</a>
                  <a href="/api/admin/backup/health" class="btn btn-info" target="_blank">備份健康檢查</a>
                  <a href="/api/admin/rate-limit/stats" class="btn btn-info" target="_blank">速率限制統計</a>
                  <button class="btn btn-warning" onclick="cleanupRateLimitLogs()">清理日誌</button>
                </div>
              </div>
              
              <!-- 系統日誌區域 -->
              <div class="card">
                <h3>📝 系統日誌</h3>
                <div id="system-log" class="log">系統日誌將在這裡顯示...</div>
                <button class="btn btn-primary" onclick="clearLog()">清除日誌</button>
              </div>
            </div>

            <script>
              let logMessages = [];
              
              function addLog(message, type = 'info') {
                const timestamp = new Date().toLocaleString();
                const logEntry = \`[\${timestamp}] \${type.toUpperCase()}: \${message}\`;
                logMessages.unshift(logEntry);
                if (logMessages.length > 50) logMessages.pop();
                
                const logElement = document.getElementById('system-log');
                logElement.textContent = logMessages.join('\\n');
              }
              
              async function apiCall(endpoint, method = 'GET', body = null) {
                try {
                  const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' }
                  };
                  
                  if (body) {
                    options.body = JSON.stringify(body);
                  }
                  
                  const response = await fetch(endpoint, options);
                  const data = await response.json();
                  
                  if (!response.ok) {
                    throw new Error(data.error || 'API 調用失敗');
                  }
                  
                  return data;
                } catch (error) {
                  addLog(\`API 錯誤: \${error.message}\`, 'error');
                  throw error;
                }
              }
              
              async function refreshSystemStatus() {
                try {
                  addLog('刷新系統狀態...', 'info');
                  const data = await apiCall('/api/admin/system/status');
                  
                  // 更新系統狀態
                  const statusElement = document.getElementById('system-status');
                  const statusClass = data.overallHealth.status === 'healthy' ? 'success' : 
                                    data.overallHealth.status === 'warning' ? 'warning' : 'danger';
                  statusElement.className = \`status \${statusClass}\`;
                  statusElement.innerHTML = \`
                    <strong>整體健康度：</strong>\${data.overallHealth.score}/100 (\${data.overallHealth.status})
                  \`;
                  
                  // 更新統計
                  const statsElement = document.getElementById('system-stats');
                  statsElement.innerHTML = \`
                    <div class="stat">
                      <div class="stat-value">\${data.database.tableCount}</div>
                      <div class="stat-label">資料表</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${data.database.status}</div>
                      <div class="stat-label">資料庫</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${data.security.overallScore}</div>
                      <div class="stat-label">安全分數</div>
                    </div>
                  \`;
                  
                  addLog('系統狀態已更新', 'success');
                } catch (error) {
                  addLog(\`系統狀態刷新失敗: \${error.message}\`, 'error');
                }
              }
              
              async function createBackup() {
                try {
                  addLog('開始創建備份...', 'info');
                  const result = await apiCall('/api/admin/backup/create', 'POST');
                  addLog(\`備份創建成功: \${result.backupKey}\`, 'success');
                  await checkBackupHealth();
                } catch (error) {
                  addLog(\`備份創建失敗: \${error.message}\`, 'error');
                }
              }
              
              async function checkBackupHealth() {
                try {
                  addLog('檢查備份健康狀態...', 'info');
                  const data = await apiCall('/api/admin/backup/health');
                  
                  const statusElement = document.getElementById('backup-status');
                  const statusClass = data.healthy ? 'success' : 'warning';
                  statusElement.className = \`status \${statusClass}\`;
                  statusElement.innerHTML = \`
                    <strong>備份狀態：</strong>\${data.healthy ? '正常' : '需要關注'}
                    \${data.lastBackup ? \`<br>最後備份：\${new Date(data.lastBackup).toLocaleString()}\` : '<br>尚未執行備份'}
                  \`;
                  
                  const statsElement = document.getElementById('backup-stats');
                  statsElement.innerHTML = \`
                    <div class="stat">
                      <div class="stat-value">\${data.weeklyStats.total}</div>
                      <div class="stat-label">總備份</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${data.weeklyStats.successful}</div>
                      <div class="stat-label">成功</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${data.weeklyStats.failed}</div>
                      <div class="stat-label">失敗</div>
                    </div>
                  \`;
                  
                  addLog(\`備份健康狀態: \${data.healthy ? '正常' : '異常'}\`, data.healthy ? 'success' : 'warning');
                } catch (error) {
                  addLog(\`備份健康檢查失敗: \${error.message}\`, 'error');
                }
              }
              
              async function refreshApiStats() {
                try {
                  addLog('刷新 API 統計...', 'info');
                  const data = await apiCall('/api/admin/rate-limit/stats');
                  
                  const statusElement = document.getElementById('api-status');
                  statusElement.className = 'status info';
                  statusElement.innerHTML = \`
                    <strong>API 使用量統計</strong><br>
                    期間：\${data.period}
                  \`;
                  
                  const statsElement = document.getElementById('api-stats');
                  statsElement.innerHTML = \`
                    <div class="stat">
                      <div class="stat-value">\${data.totalRequests}</div>
                      <div class="stat-label">總請求</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${data.uniqueClients}</div>
                      <div class="stat-label">唯一客戶</div>
                    </div>
                  \`;
                  
                  addLog(\`API 統計: \${data.totalRequests} 個請求\`, 'info');
                } catch (error) {
                  addLog(\`API 統計刷新失敗: \${error.message}\`, 'error');
                }
              }
              
              async function runSecurityAudit() {
                try {
                  addLog('執行安全審計...', 'info');
                  const result = await apiCall('/api/admin/security/audit', 'POST');
                  addLog(\`安全審計完成: 分數 \${result.overallScore}/100\`, 'success');
                  await refreshSystemStatus();
                } catch (error) {
                  addLog(\`安全審計失敗: \${error.message}\`, 'error');
                }
              }
              
              async function getSecurityStatus() {
                try {
                  addLog('獲取安全狀態...', 'info');
                  const result = await apiCall('/api/admin/security/status');
                  
                  const statusElement = document.getElementById('security-status');
                  const statusClass = result.overallScore >= 80 ? 'success' : 
                                    result.overallScore >= 60 ? 'warning' : 'danger';
                  statusElement.className = \`status \${statusClass}\`;
                  statusElement.innerHTML = \`
                    <strong>安全分數：</strong>\${result.overallScore}/100
                    <br>關鍵問題：\${result.criticalIssuesCount} 個
                    <br>警告：\${result.warningsCount} 個
                  \`;
                  
                  const statsElement = document.getElementById('security-stats');
                  statsElement.innerHTML = \`
                    <div class="stat">
                      <div class="stat-value">\${result.overallScore}</div>
                      <div class="stat-label">安全分數</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${result.criticalIssuesCount}</div>
                      <div class="stat-label">關鍵問題</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">\${result.warningsCount}</div>
                      <div class="stat-label">警告</div>
                    </div>
                  \`;
                  
                  addLog(\`安全狀態: \${result.status}\`, 'info');
                } catch (error) {
                  addLog(\`安全狀態檢查失敗: \${error.message}\`, 'error');
                }
              }
              
              async function cleanupRateLimitLogs() {
                try {
                  addLog('清理速率限制日誌...', 'info');
                  const result = await apiCall('/api/admin/rate-limit/cleanup', 'POST');
                  addLog(\`清理完成: 刪除 \${result.deletedCount} 條記錄\`, 'success');
                } catch (error) {
                  addLog(\`清理失敗: \${error.message}\`, 'error');
                }
              }
              
              function clearLog() {
                logMessages = [];
                document.getElementById('system-log').textContent = '日誌已清除';
              }
              
              // 頁面載入時初始化
              document.addEventListener('DOMContentLoaded', function() {
                addLog('管理員儀表板已載入', 'info');
                refreshSystemStatus();
                checkBackupHealth();
                refreshApiStats();
                getSecurityStatus();
              });
              
              // 定期刷新狀態
              setInterval(() => {
                refreshSystemStatus();
              }, 60000); // 每分鐘刷新一次
            </script>
          </body>
          </html>
        `;

        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }
      // --- End Admin Dashboard Page Route ---

      // --- Debug API Routes ---
      if (pathname.startsWith('/api/debug/')) {
        console.log('[Worker] Handling debug API request:', pathname);
        return await handleDebugRequest(request, env);
      }

      // --- Image API Routes ---
      if (pathname.startsWith('/api/image/')) {
        console.log('[Worker] Handling image API request:', pathname);
        const { handleImageRequest } = await import('./api/image.js');
        return await handleImageRequest(request, env);
      }
      // --- End Image API Routes ---

      // --- Admin API Routes ---
      if (pathname.startsWith('/api/admin/')) {
        console.log('[Worker] Handling admin API request:', pathname);
        const { handleAdminRequest } = await import('./api/admin.js');
        return await handleAdminRequest(request, env, user);
      }
      // --- End Admin API Routes ---

      // --- Business Verification Test Page Routes ---
      if (request.method === 'GET' && pathname === '/test/business-verification') {
        console.log('[Worker] Serving Business Verification Test Page.');
        return showBusinessVerificationPage(request, env, ctx);
      }
      if (request.method === 'POST' && pathname === '/test/business-verification/admin-initiate') {
        console.log('[Worker] Handling Business Verification Admin Initiate.');
        return handleAdminInitiate(request, env, ctx);
      }
      if (request.method === 'POST' && pathname === '/test/business-verification/user-request') {
        console.log('[Worker] Handling Business Verification User Request.');
        return handleUserRequestVerification(request, env, ctx);
      }
      // --- End Business Verification Test Page Routes ---

      // --- AI API Routes (Must be before generic /api/ handler) ---
      if (pathname.startsWith('/api/ai/')) {
        console.log('[Worker] Handling AI API request (Specific Route):', pathname);
        try {
          // Import AI handler
          const { handleAIRequest } = await import('./api/ai.js');

          console.log('[Worker] Passing locationService to AI API. locationService defined:', !!locationService);

          // Pass locationService and all env vars to AI API
          const aiEnv = {
            ...env,
            locationService: locationService,
            OPENAI_API_KEY: env.OPENAI_API_KEY,
            GEMINI_API_KEY: env.GEMINI_API_KEY
          };
          return await handleAIRequest(request, aiEnv, user, ctx);
        } catch (error) {
          console.error('[Worker] Error handling AI API request:', error);
          return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      // --- End AI API Routes ---

      // --- Game Routes ---
      if (request.method === 'GET' && pathname === '/game') {
        console.log('[Worker] Handling Game Page Request.');
        try {
          return await routePageRequest(request, env, session, user, nonce, bundledCss);
        } catch (error) {
          console.error('[Worker] Error in routePageRequest:', error);
          return new Response('Game Page Error: ' + error.message, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      // --- Service Worker Route ---
      if (pathname === '/sw.js') {
        console.log('[Worker] Serving Service Worker');
        // Inline Service Worker for Cloudflare Workers (no fs module available)
        const swContent = `// Service Worker for HOPENGHU.CC
// Version: 1.0.0
const CACHE_NAME = 'hopenghu-v1';
const RUNTIME_CACHE = 'hopenghu-runtime-v1';

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(() => {
        console.log('[Service Worker] Precaching complete');
        return self.skipWaiting(); // 立即激活新的 Service Worker
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 刪除舊的緩存
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim(); // 立即控制所有頁面
    })
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== 'GET') {
    return;
  }

  // 跳過 API 請求（需要實時數據）
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 允許緩存的外部資源（Google Fonts）
  const allowedExternalOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];
  
  const isAllowedExternal = allowedExternalOrigins.some(origin => url.origin === origin);
  
  // 跳過其他外部資源
  if (url.origin !== self.location.origin && !isAllowedExternal) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 如果有緩存，返回緩存
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // 否則從網絡獲取
        console.log('[Service Worker] Fetching from network:', url.pathname);
        return fetch(request)
          .then((response) => {
            // 只緩存成功的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆響應（因為響應只能使用一次）
            const responseToCache = response.clone();

            // 將響應添加到緩存
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            // 靜默處理網絡錯誤（離線時正常）
            console.log('[Service Worker] Fetch failed (likely offline):', url.pathname);
            // 如果是頁面請求且失敗，返回首頁緩存
            if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
              const cachedHome = caches.match('/');
              if (cachedHome) {
                return cachedHome;
              }
            }
            // 對於其他請求，返回空響應而不是拋出錯誤
            return new Response('', { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});`;
        return new Response(swContent, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache',
            'Service-Worker-Allowed': '/'
          }
        });
      }

      // --- Static Files for Itinerary Planner ---
      if (pathname.startsWith('/ai-smart-itinerary-planner/')) {
        console.log('[Worker] Serving itinerary planner static file:', pathname);
        try {
          // 動態導入資產模組
          const { getItineraryAsset } = await import('./assets/itinerary-assets.js');
          
          // 移除前綴，獲取相對路徑
          const relativePath = pathname.replace('/ai-smart-itinerary-planner/', '');
          
          // 獲取檔案內容
          const content = getItineraryAsset(relativePath);
          
          if (!content) {
            console.warn(`[Worker] Asset not found: ${relativePath}`);
            return new Response('File not found', {
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
          
          // 根據檔案類型設定 Content-Type
          let contentType = 'text/plain';
          if (relativePath.endsWith('.js')) {
            contentType = 'application/javascript';
          } else if (relativePath.endsWith('.css')) {
            contentType = 'text/css';
          } else if (relativePath.endsWith('.html')) {
            contentType = 'text/html';
          }
          
          return new Response(content, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (error) {
          console.error('[Worker] Error serving itinerary asset:', error);
          return new Response('Internal server error', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      // --- API Routes (must be after specific /api/auth/google routes above) ---
      if (pathname.startsWith('/api/')) {
        console.log('[Worker] Handling API Request.');
        return await handleApiRequest(request, env, session, user, ctx);
      }

      // --- NEW: GET /api/locations/:id/details ---
      if (request.method === 'GET' && pathname.startsWith('/api/locations/') && pathname.endsWith('/details')) {
        console.log('[Worker] Handling GET /api/locations/:id/details');
        const locationId = pathname.split('/')[3]; // Extract location ID from path

        if (!locationId) {
          console.error('[Worker] Missing location ID in details request path.');
          return new Response(JSON.stringify({ error: 'Missing Location ID in request path.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        try {
          const locationDetails = await locationService.getLocationById(locationId);

          if (!locationDetails) {
            console.warn(`[Worker] No details found for locationId: ${locationId}`);
            return new Response(JSON.stringify({ error: 'Location details not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }

          // 獲取用戶狀態（如果用戶已登入）
          let userStatus = null;
          let interactionCounts = { visited: 0, want_to_visit: 0, want_to_revisit: 0 };

          if (user) {
            try {
              // 獲取用戶對此地點的狀態
              userStatus = await locationService.getUserLocationStatus(user.id, locationId);

              // 獲取此地點的互動統計
              interactionCounts = await locationService.getLocationInteractionCounts(locationId);
            } catch (error) {
              console.error(`[Worker] Error fetching user status for locationId ${locationId}:`, error);
              // 不阻擋主要功能，使用默認值
            }
          }

          // 合併所有數據
          const responseData = {
            ...locationDetails,
            userStatus: userStatus,
            interactionCounts: interactionCounts
          };

          console.log(`[Worker] Successfully fetched details for locationId: ${locationId}`, {
            hasUser: !!user,
            userStatus: userStatus,
            interactionCounts: interactionCounts
          });

          return new Response(JSON.stringify(responseData), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (error) {
          console.error(`[Worker] Error calling LocationService.getLocationById for locationId ${locationId}:`, error);
          return new Response(JSON.stringify({ error: 'Internal server error fetching location details.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // --- END NEW ROUTE ---

      // AI API Routes (Moved up to avoid shadowing by generic /api/ handler)
      /* 
      // This block was previously here but unreachable
      if (pathname.startsWith('/api/ai/')) {
         ...
      }
      */

      // Try routePageRequest as fallback for page routes (before 404)
      if (request.method === 'GET' && !pathname.startsWith('/api/')) {
        console.log(`[Worker] Trying routePageRequest as fallback for: ${pathname}`);
        try {
          return await routePageRequest(request, env, session, user, nonce, bundledCss);
        } catch (error) {
          console.error('[Worker] Error in routePageRequest fallback:', error);
          // Continue to 404 if routePageRequest fails
        }
      }

      // Default 404 Not Found for any other routes
      console.log(`[Worker] Route not found: ${request.method} ${pathname}`);
      return new Response('404 Page Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });

    } catch (error) {
      // General error handler for the main try block
      console.error('[Worker] Unhandled Error in routing:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}; 