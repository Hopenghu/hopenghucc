// Import new services
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';
import { SessionService } from './services/SessionService.js';
import { GoogleAuthService } from './services/GoogleAuthService.js';
import { LocationService } from './services/locationService.js'; // Import LocationService
// import { BusinessService } from './services/BusinessService.js'; // Removed GMB dependency

// Keep existing imports if still needed (like templates, initiateGoogleAuth)
import { initiateGoogleAuth, initiateGmbAuth } from './modules/auth/google.js'; // Import BOTH functions
// Removed: import { handleGoogleCallback } from './modules/auth/google.js';
// Removed: import { handleLogout } from './modules/auth/logout.js'; 
// Removed: import { getUserFromSession } from './modules/session/service.js'; 
import { getHomePageHtml, getGoogleInfoPageHtml, getProfilePageHtml, getProfilePageContent, getHomePageContent, getAddPlacePageHtml } from './templates/html.js';
// import { Router } from 'itty-router'; // Router not used directly

// Import bundled CSS as text
import bundledCss from './styles/tailwind.output.css';

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
    let authService, userService, sessionService, googleAuthService, locationService; // Add locationService
    try {
        userService = new UserService(env.DB);
        sessionService = new SessionService(env.DB);
        googleAuthService = new GoogleAuthService(env);
        // Instantiate LocationService with DB and API Key from env
        locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY); 
        authService = new AuthService(userService, sessionService, googleAuthService);
    } catch (err) {
        console.error('[Worker] Failed to instantiate services:', err);
        // Ensure API key secret is set in Cloudflare dashboard if this fails
        if (err.message.includes('mapsApiKey')) {
             console.error('[Worker] GOOGLE_MAPS_API_KEY secret might be missing in Cloudflare environment.');
             return new Response('Internal Server Error - API Key Configuration Missing', { status: 500 });
        }
        return new Response('Internal Server Error - Service Configuration Failed', { status: 500 });
    }

    // Get user from session using AuthService
    const sessionId = getCookie(request, 'session');
    const user = await authService.getUserFromSession(sessionId);
    console.log('[Worker] User from session:', user ? user.email : 'null');

    try {
      // --- Basic Routing --- 
      
      // Homepage Route
      if (request.method === 'GET' && pathname === '/') {
        console.log('[Worker] Serving homepage.');
        const html = getHomePageHtml(user, bundledCss); 
        return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
      }

      // Google Auth Routes
      if (request.method === 'GET' && pathname === '/api/auth/google') {
        // Initial basic login
        return initiateGoogleAuth(url, env); 
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
        // --- Log the full URL and extracted code --- 
        console.log(`[Worker] Callback URL: ${url.toString()}`);
        const code = url.searchParams.get('code');
        console.log(`[Worker] Extracted code: ${code}`);
        // --- End logging ---
        if (!code) {
            console.error('[Worker] Missing authorization code in callback URL.') // Add error log
            return new Response('Missing authorization code from Google', { status: 400 });
        }
        try {
            const { session, user: loggedInUser } = await authService.handleGoogleLogin(code);
            console.log('[Worker] Google login successful for:', loggedInUser.email);
            
            const cookieValue = `session=${session.id}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(session.expiresAt).toUTCString()}`;
            
            // Redirect to profile page after successful login
            const headers = new Headers();
            headers.append('Set-Cookie', cookieValue);
            headers.append('Location', '/profile'); // Redirect to profile or dashboard
            return new Response(null, { status: 302, headers });

        } catch (error) {
             console.error('[Worker] Google callback error:', error);
             // Redirect to homepage with an error query parameter? Or show an error page.
             const headers = new Headers();
             headers.append('Location', '/?error=google_auth_failed'); 
             return new Response(null, { status: 302, headers });
        }
      }

      // Logout Route
      if (request.method === 'POST' && pathname === '/api/auth/logout') {
         console.log('[Worker] Handling logout...');
         const currentSessionId = getCookie(request, 'session');
         if (currentSessionId) {
             try {
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

      // Profile Page Route
      if (request.method === 'GET' && pathname === '/profile') {
        if (!user) {
          console.log('[Worker] User not logged in, redirecting from /profile to /');
          return Response.redirect(url.origin + '/', 302);
        }
        console.log('[Worker] Serving profile page for:', user.email);
        const html = getProfilePageHtml(user, bundledCss); 
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

      // POST /api/locations/import/google-place
      if (request.method === 'POST' && pathname === '/api/locations/import/google-place') {
         console.log('[Worker] Handling POST /api/locations/import/google-place');
         // 1. Check authentication
         if (!user || !user.id) {
             console.log('[Worker] Unauthorized attempt to import location.');
             return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
         }

         // 2. Parse request body for googlePlaceId
         let requestBody;
         try {
             requestBody = await request.json();
         } catch (e) {
             console.error('[Worker] Invalid JSON in request body:', e);
             return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
         }
         const { googlePlaceId } = requestBody;
         if (!googlePlaceId || typeof googlePlaceId !== 'string') {
              console.log('[Worker] Missing or invalid googlePlaceId in request body.');
              return new Response(JSON.stringify({ error: 'Missing or invalid googlePlaceId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
         }
         
         const userId = user.id;
         console.log(`[Worker] User ${userId} attempting to import place ${googlePlaceId}`);

         try {
             // 3. Check if location already exists in our DB
             let location = await locationService.findLocationByPlaceId(googlePlaceId);
             
             // 4. If not, fetch from Google and create in our DB
             if (!location) {
                 console.log(`[Worker] Location ${googlePlaceId} not found locally. Fetching from Google...`);
                 const locationDetails = await locationService.fetchPlaceDetails(googlePlaceId);
                 
                 if (!locationDetails) {
                     console.error(`[Worker] Failed to fetch details for ${googlePlaceId} from Google.`);
                     return new Response(JSON.stringify({ error: 'Failed to fetch location details from Google.' }), { status: 502, headers: { 'Content-Type': 'application/json' } }); // 502 Bad Gateway
                 }
                 
                 // Add the user who initiated the creation
                 locationDetails.createdByUser = userId;

                 console.log(`[Worker] Creating new local location record for ${googlePlaceId}`);
                 try {
                      location = await locationService.createLocation(locationDetails);
                 } catch (createError) {
                     // Handle potential race condition where another request created it just now
                     if (createError.message.includes('already exists')) {
                         console.warn(`[Worker] Race condition? Location ${googlePlaceId} was created between check and insert. Fetching existing.`);
                         location = await locationService.findLocationByPlaceId(googlePlaceId);
                         if (!location) { // Should not happen, but handle defensively
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

             // 5. Check if user is already linked to this location
             const isLinked = await locationService.checkUserLocationLink(userId, location.id);
             let userLocationLink = null;

             // 6. If not linked, create the link
             if (!isLinked) {
                 console.log(`[Worker] Linking user ${userId} to location ${location.id}`);
                 try {
                      userLocationLink = await locationService.linkUserToLocation(userId, location.id);
                 } catch (linkError) {
                      // Handle potential race condition or existing link error
                      if (linkError.message.includes('already associated')) {
                           console.warn(`[Worker] User ${userId} already linked to location ${location.id} (detected during link attempt).`);
                           // Optionally fetch the existing link here if needed
                      } else {
                          throw linkError; // Re-throw other linking errors
                      }
                 }
             } else {
                 console.log(`[Worker] User ${userId} is already linked to location ${location.id}.`);
                 // Optionally fetch the existing link details if needed for the response
             }

             // 7. Return success response (e.g., the location ID or link ID)
             console.log(`[Worker] Successfully processed import for place ${googlePlaceId} by user ${userId}.`);
             return new Response(JSON.stringify({ 
                 message: 'Location added to your list successfully.',
                 locationId: location.id,
                 userLocationLinkId: userLocationLink ? userLocationLink.id : null // Return link ID if newly created
             }), { status: 200, headers: { 'Content-Type': 'application/json' } });

         } catch (error) {
             console.error(`[Worker] Error processing location import for place ${googlePlaceId}:`, error);
             // Return a generic server error
             return new Response(JSON.stringify({ error: 'Failed to process location import.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
         }
      }
      
      // --- TODO: Add POST /api/locations/import/coordinate route --- 
      // --- TODO: Add GET /api/locations (search) route --- 
      // --- TODO: Add GET /api/user/locations (get user's saved locations) route --- 
      // --- TODO: Add PUT/PATCH /api/user/locations/:linkId (update description/status) route --- 
      // --- TODO: Add POST /api/user/locations/:linkId/links (add link) route --- 
      // --- TODO: Add DELETE /api/user/locations/:linkId/links/:linkId (delete link) route --- 
      
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
       
      // --- Default Response for other paths ---
      console.log(`[Worker] No specific route match for ${pathname}. Returning 404.`);
      return new Response("Not Found", {
        status: 404, 
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      // Catch potential errors from routing or service calls
      console.error('[Worker] Unhandled Error in routing:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }
  }
}; 