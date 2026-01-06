import { businessVerificationPage } from '../templates/business-verification.html.js';
import { BusinessVerificationService } from '../services/BusinessVerificationService.js';
import { SessionService } from '../services/SessionService.js';
import { UserService } from '../services/UserService.js';
import { LocationService } from '../services/LocationService.js';

// Helper to parse cookies (can be moved to a shared util if used elsewhere)
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

async function getUser(request, env) {
    const sessionId = getCookie(request, 'session');
    if (!sessionId) return null;

    const sessionService = new SessionService(env.DB);
    const userService = new UserService(env.DB);

    const session = await sessionService.getSession(sessionId);
    if (!session) return null;

    return await userService.findUserById(session.userId);
}

export async function showBusinessVerificationPage(request, env, ctx) {
    const user = await getUser(request, env);

    let placesForDropdown = [];
    try {
        // Instantiate LocationService - ensure GOOGLE_MAPS_API_KEY is available in env if constructor needs it for other reasons,
        // though getActiveGooglePlaceIds itself doesn't use it.
        const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
        placesForDropdown = await locationService.getActiveGooglePlaceIds();
    } catch (error) {
        console.error('Error fetching places for dropdown:', error);
        // Continue without places if there's an error, page will show an empty dropdown or handle it gracefully
    }

    return new Response(businessVerificationPage(user, null, placesForDropdown), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

export async function handleAdminInitiate(request, env, ctx) {
    const user = await getUser(request, env); // Could be used for admin role checks

    try {
        const formData = await request.formData();
        const placeId = formData.get('placeId');
        if (!placeId) {
            return new Response(JSON.stringify({ success: false, message: 'Place ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const verificationService = env.services?.businessVerification || new BusinessVerificationService(env.DB);
        // Pass the admin user (or null if not strictly needed by current placeholder logic)
        const result = await verificationService.adminInitiateForPlaceId(placeId, user);

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Admin initiate error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An error occurred.', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

export async function handleUserRequestVerification(request, env, ctx) {
    const user = await getUser(request, env);

    if (!user) {
        return new Response(JSON.stringify({ success: false, message: 'User not logged in.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const formData = await request.formData();
        const placeId = formData.get('placeId');
        if (!placeId) {
            return new Response(JSON.stringify({ success: false, message: 'Place ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const verificationService = env.services?.businessVerification || new BusinessVerificationService(env.DB);
        const result = await verificationService.userRequestVerificationForPlaceId(placeId, user);

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('User request verification error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An error occurred.', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
} 