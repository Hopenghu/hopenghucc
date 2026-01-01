/**
 * 調試API - 檢查資料庫中的圖片URL
 */
export async function handleDebugRequest(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/api/debug/locations') {
        return await handleDebugLocations(request, env);
    }

    if (pathname === '/api/debug/users') {
        return await handleDebugUsers(request, env);
    }

    if (pathname === '/api/debug/test-user-counts') {
        return await handleTestUserCounts(request, env);
    }

    if (pathname === '/api/debug/test-profile-data') {
        return await handleTestProfileData(request, env);
    }

    if (pathname === '/api/debug/test-profile-simple') {
        return await handleTestProfileSimple(request, env);
    }

    if (pathname === '/api/debug/test-profile-full') {
        return await handleTestProfileFull(request, env);
    }

    if (pathname === '/api/debug/test-profile-request') {
        return await handleTestProfileRequest(request, env);
    }

    if (pathname === '/api/debug/test-session') {
        return await handleTestSession(request, env);
    }

    if (pathname === '/api/debug/test-profile-logged-in') {
        return await handleTestProfileLoggedIn(request, env);
    }

    if (pathname === '/api/debug/test-homepage-data') {
        return await handleTestHomepageData(request, env);
    }

    if (pathname === '/api/debug/test-xiaohongshu-layout') {
        return await handleTestXiaohongshuLayout(request, env);
    }

    if (pathname === '/api/debug/test-process-images') {
        return await handleTestProcessImages(request, env);
    }

    return new Response('Not Found', { status: 404 });
}

/**
 * 檢查資料庫中的地點圖片URL
 */
async function handleDebugLocations(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        // 使用 LocationService 來獲取包含用戶狀態的地點數據
        const { LocationService } = await import('../services/locationService.js');
        const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
        
        // 獲取前5個地點，不包含特定用戶狀態（用於調試）
        const locations = await locationService.getRecentLocationsWithThumbnails(5);
        
        return new Response(JSON.stringify({
            success: true,
            locations: locations || [],
            count: locations ? locations.length : 0
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
}

/**
 * 檢查資料庫中的用戶數據
 */
async function handleDebugUsers(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const stmt = env.DB.prepare(`
            SELECT id, email, name, role, created_at
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        const { results } = await stmt.all();
        
        return new Response(JSON.stringify({
            success: true,
            users: results || [],
            count: results ? results.length : 0
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
}

/**
 * 測試processLocationsImages功能
 */
async function handleTestProcessImages(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        // 1. 獲取原始資料
        const stmt = env.DB.prepare(`
            SELECT id, name, google_place_id, thumbnail_url, created_at
            FROM locations 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        const { results } = await stmt.all();
        
        // 2. 導入並測試ImageCacheService
        const { ImageCacheService } = await import('../services/ImageCacheService.js');
        const imageCacheService = new ImageCacheService(env.DB);
        
        // 3. 測試isGooglePlacesImageUrl
        const testResults = results.map(location => ({
            id: location.id,
            name: location.name,
            original_thumbnail_url: location.thumbnail_url,
            is_google_places_url: imageCacheService.isGooglePlacesImageUrl(location.thumbnail_url),
            photo_reference: imageCacheService.extractPhotoReference(location.thumbnail_url)
        }));
        
        // 4. 測試processLocationsImages
        const processedResults = await imageCacheService.processLocationsImages(results);
        
        return new Response(JSON.stringify({
            success: true,
            original_locations: results,
            test_results: testResults,
            processed_locations: processedResults,
            count: results ? results.length : 0
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing process images:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 測試特定用戶的地點統計
 */
async function handleTestUserCounts(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        // 導入 LocationService
        const { LocationService } = await import('../services/locationService.js');
        const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
        
        // 測試用戶 ID 3 (blackie.hsieh@gmail.com) 的統計
        const userId = 3;
        const userCounts = await locationService.getUserLocationCounts(userId);
        const userCreatedLocations = await locationService.getUserCreatedLocations(userId);
        
        return new Response(JSON.stringify({
            success: true,
            userId: userId,
            userEmail: 'blackie.hsieh@gmail.com',
            userCounts: userCounts,
            userCreatedLocations: userCreatedLocations,
            createdLocationsCount: userCreatedLocations.length
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing user counts:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 測試 Profile 頁面的完整數據流程
 */
async function handleTestProfileData(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        // 導入 LocationService
        const { LocationService } = await import('../services/locationService.js');
        const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
        
        // 測試用戶 ID 3 (blackie.hsieh@gmail.com) 的 Profile 數據
        const userId = 3;
        
        // 模擬 Profile 頁面的完整數據獲取流程
        const userLocations = await locationService.getUserLocations(userId);
        const userCreatedLocations = await locationService.getUserCreatedLocations(userId);
        const allLocations = [...userLocations, ...userCreatedLocations];
        
        // 獲取用戶地點統計
        const userLocationCounts = await locationService.getUserLocationCounts(userId);
        
        // 獲取互動統計和用戶狀態
        const locationInteractionCounts = {};
        const userLocationStatuses = {};
        
        for (const location of allLocations) {
            const counts = await locationService.getLocationInteractionCounts(location.id);
            locationInteractionCounts[location.id] = counts;
            
            const status = await locationService.getUserLocationStatus(userId, location.id);
            if (status) {
                userLocationStatuses[location.id] = status;
            }
        }
        
        // 分類地點（模擬前端邏輯）
        const visitedLocations = allLocations.filter(loc => userLocationStatuses[loc.id] === 'visited');
        const wantToVisitLocations = allLocations.filter(loc => userLocationStatuses[loc.id] === 'want_to_visit');
        const wantToRevisitLocations = allLocations.filter(loc => userLocationStatuses[loc.id] === 'want_to_revisit');
        const createdLocations = allLocations.filter(loc => loc.created_by_user_id === userId);
        
        return new Response(JSON.stringify({
            success: true,
            userId: userId,
            userEmail: 'blackie.hsieh@gmail.com',
            userLocationCounts: userLocationCounts,
            allLocationsCount: allLocations.length,
            userLocationsCount: userLocations.length,
            userCreatedLocationsCount: userCreatedLocations.length,
            visitedLocationsCount: visitedLocations.length,
            wantToVisitLocationsCount: wantToVisitLocations.length,
            wantToRevisitLocationsCount: wantToRevisitLocations.length,
            createdLocationsCount: createdLocations.length,
            createdLocations: createdLocations.map(loc => ({
                id: loc.id,
                name: loc.name,
                created_by_user_id: loc.created_by_user_id,
                created_at: loc.created_at
            }))
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing profile data:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 簡單測試 Profile 頁面的基本功能
 */
async function handleTestProfileSimple(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        // 模擬用戶數據
        const mockUser = {
            id: 3,
            email: 'blackie.hsieh@gmail.com',
            name: 'blackie hsieh',
            role: 'admin'
        };

        // 導入模板函數
        const { getProfilePageHtml } = await import('../templates/html.js');
        
        // 嘗試生成 Profile 頁面 HTML
        const html = getProfilePageHtml(
            mockUser, 
            '', // 空的 CSS
            [], // 空的地點數組
            { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 3, owner: 0 }, // 模擬統計
            {}, // 空的互動統計
            {} // 空的用戶狀態
        );
        
        return new Response(JSON.stringify({
            success: true,
            message: 'Profile page HTML generated successfully',
            htmlLength: html.length,
            htmlPreview: html.substring(0, 500) + '...'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing profile simple:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 完整測試 Profile 頁面的所有組件
 */
async function handleTestProfileFull(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const results = {
            success: true,
            steps: [],
            errors: []
        };

        // 步驟 1: 測試服務實例化
        try {
            const { UserService } = await import('../services/UserService.js');
            const { SessionService } = await import('../services/SessionService.js');
            const { GoogleAuthService } = await import('../services/GoogleAuthService.js');
            const { AuthService } = await import('../services/AuthService.js');
            const { LocationService } = await import('../services/locationService.js');

            const userService = new UserService(env.DB);
            const sessionService = new SessionService(env.DB);
            const googleAuthService = new GoogleAuthService(env);
            const authService = new AuthService(userService, sessionService, googleAuthService);
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            results.steps.push('✅ 所有服務實例化成功');
        } catch (error) {
            results.steps.push('❌ 服務實例化失敗');
            results.errors.push(`服務實例化錯誤: ${error.message}`);
        }

        // 步驟 2: 測試用戶數據獲取
        try {
            const { UserService } = await import('../services/UserService.js');
            const userService = new UserService(env.DB);
            const user = await userService.findUserById(3);
            
            if (user) {
                results.steps.push('✅ 用戶數據獲取成功');
                results.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            } else {
                results.steps.push('❌ 用戶數據獲取失敗');
                results.errors.push('找不到用戶 ID 3');
            }
        } catch (error) {
            results.steps.push('❌ 用戶數據獲取失敗');
            results.errors.push(`用戶數據獲取錯誤: ${error.message}`);
        }

        // 步驟 3: 測試地點數據獲取
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            
            const userLocations = await locationService.getUserLocations(3);
            const userCreatedLocations = await locationService.getUserCreatedLocations(3);
            const userLocationCounts = await locationService.getUserLocationCounts(3);
            
            results.steps.push('✅ 地點數據獲取成功');
            results.locationData = {
                userLocationsCount: userLocations.length,
                userCreatedLocationsCount: userCreatedLocations.length,
                userLocationCounts: userLocationCounts
            };
        } catch (error) {
            results.steps.push('❌ 地點數據獲取失敗');
            results.errors.push(`地點數據獲取錯誤: ${error.message}`);
        }

        // 步驟 4: 測試模板生成
        try {
            const { getProfilePageHtml } = await import('../templates/html.js');
            
            const mockUser = {
                id: 3,
                email: 'blackie.hsieh@gmail.com',
                name: 'blackie hsieh',
                role: 'admin'
            };
            
            const html = getProfilePageHtml(
                mockUser, 
                '', 
                [], 
                { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 3, owner: 0 }, 
                {}, 
                {}
            );
            
            results.steps.push('✅ 模板生成成功');
            results.htmlLength = html.length;
        } catch (error) {
            results.steps.push('❌ 模板生成失敗');
            results.errors.push(`模板生成錯誤: ${error.message}`);
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing profile full:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 模擬完整的 Profile 頁面請求流程
 */
async function handleTestProfileRequest(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const results = {
            success: true,
            steps: [],
            errors: []
        };

        // 步驟 1: 實例化所有服務
        try {
            const { UserService } = await import('../services/UserService.js');
            const { SessionService } = await import('../services/SessionService.js');
            const { GoogleAuthService } = await import('../services/GoogleAuthService.js');
            const { AuthService } = await import('../services/AuthService.js');
            const { LocationService } = await import('../services/locationService.js');

            const userService = new UserService(env.DB);
            const sessionService = new SessionService(env.DB);
            const googleAuthService = new GoogleAuthService(env);
            const authService = new AuthService(userService, sessionService, googleAuthService);
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            results.steps.push('✅ 服務實例化成功');
        } catch (error) {
            results.steps.push('❌ 服務實例化失敗');
            results.errors.push(`服務實例化錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 2: 模擬認證流程
        try {
            const { UserService } = await import('../services/UserService.js');
            const { SessionService } = await import('../services/SessionService.js');
            const { GoogleAuthService } = await import('../services/GoogleAuthService.js');
            const { AuthService } = await import('../services/AuthService.js');

            const userService = new UserService(env.DB);
            const sessionService = new SessionService(env.DB);
            const googleAuthService = new GoogleAuthService(env);
            const authService = new AuthService(userService, sessionService, googleAuthService);

            // 直接獲取用戶 ID 3
            const user = await userService.findUserById(3);
            if (!user) {
                throw new Error('找不到用戶 ID 3');
            }

            results.steps.push('✅ 用戶認證成功');
            results.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };
        } catch (error) {
            results.steps.push('❌ 用戶認證失敗');
            results.errors.push(`認證錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 3: 獲取 Profile 頁面數據
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            // 模擬 Profile 頁面的數據獲取流程
            const userLocations = await locationService.getUserLocations(3);
            const userCreatedLocations = await locationService.getUserCreatedLocations(3);
            const allLocations = [...userLocations, ...userCreatedLocations];

            const locationInteractionCounts = {};
            const userLocationStatuses = {};

            // 獲取互動統計
            for (const location of allLocations) {
                const counts = await locationService.getLocationInteractionCounts(location.id);
                locationInteractionCounts[location.id] = counts;
            }

            // 獲取用戶狀態
            for (const location of allLocations) {
                const status = await locationService.getUserLocationStatus(3, location.id);
                if (status) {
                    userLocationStatuses[location.id] = status;
                }
            }

            // 獲取用戶地點統計
            const userLocationCounts = await locationService.getUserLocationCounts(3);

            results.steps.push('✅ Profile 數據獲取成功');
            results.profileData = {
                userLocationsCount: userLocations.length,
                userCreatedLocationsCount: userCreatedLocations.length,
                allLocationsCount: allLocations.length,
                userLocationCounts: userLocationCounts,
                locationInteractionCountsKeys: Object.keys(locationInteractionCounts).length,
                userLocationStatusesKeys: Object.keys(userLocationStatuses).length
            };
        } catch (error) {
            results.steps.push('❌ Profile 數據獲取失敗');
            results.errors.push(`數據獲取錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 4: 生成 Profile 頁面 HTML
        try {
            const { getProfilePageHtml } = await import('../templates/html.js');
            const { LocationService } = await import('../services/locationService.js');
            
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            const userLocations = await locationService.getUserLocations(3);
            const userCreatedLocations = await locationService.getUserCreatedLocations(3);
            const allLocations = [...userLocations, ...userCreatedLocations];
            const userLocationCounts = await locationService.getUserLocationCounts(3);

            const locationInteractionCounts = {};
            const userLocationStatuses = {};

            for (const location of allLocations) {
                const counts = await locationService.getLocationInteractionCounts(location.id);
                locationInteractionCounts[location.id] = counts;
                
                const status = await locationService.getUserLocationStatus(3, location.id);
                if (status) {
                    userLocationStatuses[location.id] = status;
                }
            }

            const html = getProfilePageHtml(
                results.user, 
                '', // 空的 CSS
                allLocations, 
                userLocationCounts, 
                locationInteractionCounts, 
                userLocationStatuses
            );

            results.steps.push('✅ Profile 頁面 HTML 生成成功');
            results.htmlLength = html.length;
            results.htmlPreview = html.substring(0, 200) + '...';
        } catch (error) {
            results.steps.push('❌ Profile 頁面 HTML 生成失敗');
            results.errors.push(`HTML 生成錯誤: ${error.message}`);
            throw error;
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing profile request:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 測試會話管理
 */
async function handleTestSession(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const results = {
            success: true,
            steps: [],
            errors: []
        };

        // 步驟 1: 實例化服務
        try {
            const { UserService } = await import('../services/UserService.js');
            const { SessionService } = await import('../services/SessionService.js');
            const { GoogleAuthService } = await import('../services/GoogleAuthService.js');
            const { AuthService } = await import('../services/AuthService.js');

            const userService = new UserService(env.DB);
            const sessionService = new SessionService(env.DB);
            const googleAuthService = new GoogleAuthService(env);
            const authService = new AuthService(userService, sessionService, googleAuthService);

            results.steps.push('✅ 服務實例化成功');
        } catch (error) {
            results.steps.push('❌ 服務實例化失敗');
            results.errors.push(`服務實例化錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 2: 測試會話創建
        try {
            const { SessionService } = await import('../services/SessionService.js');
            const sessionService = new SessionService(env.DB);

            // 為用戶 ID 3 創建一個新會話
            const session = await sessionService.createSession(3);
            
            results.steps.push('✅ 會話創建成功');
            results.session = {
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt
            };
        } catch (error) {
            results.steps.push('❌ 會話創建失敗');
            results.errors.push(`會話創建錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 3: 測試會話獲取
        try {
            const { SessionService } = await import('../services/SessionService.js');
            const sessionService = new SessionService(env.DB);

            const retrievedSession = await sessionService.getSession(results.session.id);
            
            if (retrievedSession) {
                results.steps.push('✅ 會話獲取成功');
                results.retrievedSession = {
                    id: retrievedSession.id,
                    userId: retrievedSession.userId,
                    expiresAt: retrievedSession.expiresAt
                };
            } else {
                results.steps.push('❌ 會話獲取失敗');
                results.errors.push('無法獲取剛創建的會話');
            }
        } catch (error) {
            results.steps.push('❌ 會話獲取失敗');
            results.errors.push(`會話獲取錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 4: 測試 AuthService.getUserFromSession
        try {
            const { UserService } = await import('../services/UserService.js');
            const { SessionService } = await import('../services/SessionService.js');
            const { GoogleAuthService } = await import('../services/GoogleAuthService.js');
            const { AuthService } = await import('../services/AuthService.js');

            const userService = new UserService(env.DB);
            const sessionService = new SessionService(env.DB);
            const googleAuthService = new GoogleAuthService(env);
            const authService = new AuthService(userService, sessionService, googleAuthService);

            const user = await authService.getUserFromSession(results.session.id);
            
            if (user) {
                results.steps.push('✅ AuthService.getUserFromSession 成功');
                results.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            } else {
                results.steps.push('❌ AuthService.getUserFromSession 失敗');
                results.errors.push('無法從會話獲取用戶');
            }
        } catch (error) {
            results.steps.push('❌ AuthService.getUserFromSession 失敗');
            results.errors.push(`AuthService 錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 5: 清理會話
        try {
            const { SessionService } = await import('../services/SessionService.js');
            const sessionService = new SessionService(env.DB);

            await sessionService.deleteSession(results.session.id);
            results.steps.push('✅ 會話清理成功');
        } catch (error) {
            results.steps.push('❌ 會話清理失敗');
            results.errors.push(`會話清理錯誤: ${error.message}`);
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing session:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 測試登入用戶的 Profile 頁面訪問
 */
async function handleTestProfileLoggedIn(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const results = {
            success: true,
            steps: [],
            errors: []
        };

        // 步驟 1: 實例化所有服務
        try {
            const { UserService } = await import('../services/UserService.js');
            const { SessionService } = await import('../services/SessionService.js');
            const { GoogleAuthService } = await import('../services/GoogleAuthService.js');
            const { AuthService } = await import('../services/AuthService.js');
            const { LocationService } = await import('../services/locationService.js');

            const userService = new UserService(env.DB);
            const sessionService = new SessionService(env.DB);
            const googleAuthService = new GoogleAuthService(env);
            const authService = new AuthService(userService, sessionService, googleAuthService);
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            results.steps.push('✅ 服務實例化成功');
        } catch (error) {
            results.steps.push('❌ 服務實例化失敗');
            results.errors.push(`服務實例化錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 2: 模擬登入用戶
        try {
            const { UserService } = await import('../services/UserService.js');
            const userService = new UserService(env.DB);
            
            // 直接獲取用戶 ID 3
            const user = await userService.findUserById(3);
            if (!user) {
                throw new Error('找不到用戶 ID 3');
            }

            results.steps.push('✅ 用戶獲取成功');
            results.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };
        } catch (error) {
            results.steps.push('❌ 用戶獲取失敗');
            results.errors.push(`用戶獲取錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 3: 測試 Profile 頁面數據獲取（模擬修復後的邏輯）
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            // 模擬修復後的 Profile 頁面邏輯
            let userLocations = [];
            let userCreatedLocations = [];
            let allLocations = [];
            let userLocationCounts = null;
            let locationInteractionCounts = {};
            let userLocationStatuses = {};

            try {
                userLocations = await locationService.getUserLocations(3);
                userCreatedLocations = await locationService.getUserCreatedLocations(3);
                allLocations = [...userLocations, ...userCreatedLocations];
                
                // 獲取互動統計
                for (const location of allLocations) {
                    const counts = await locationService.getLocationInteractionCounts(location.id);
                    locationInteractionCounts[location.id] = counts;
                }
                
                // 獲取用戶狀態
                for (const location of allLocations) {
                    const status = await locationService.getUserLocationStatus(3, location.id);
                    if (status) {
                        userLocationStatuses[location.id] = status;
                    }
                }
                
                // 獲取用戶地點統計
                userLocationCounts = await locationService.getUserLocationCounts(3);
            } catch (error) {
                console.error('[Debug API] Error in try block:', error);
                // 提供默認值
                userLocations = [];
                userCreatedLocations = [];
                allLocations = [];
                userLocationCounts = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
                locationInteractionCounts = {};
                userLocationStatuses = {};
            }

            results.steps.push('✅ Profile 數據獲取成功（包含錯誤處理）');
            results.profileData = {
                userLocationsCount: userLocations.length,
                userCreatedLocationsCount: userCreatedLocations.length,
                allLocationsCount: allLocations.length,
                userLocationCounts: userLocationCounts,
                locationInteractionCountsKeys: Object.keys(locationInteractionCounts).length,
                userLocationStatusesKeys: Object.keys(userLocationStatuses).length
            };
        } catch (error) {
            results.steps.push('❌ Profile 數據獲取失敗');
            results.errors.push(`數據獲取錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 4: 測試 HTML 生成
        try {
            const { getProfilePageHtml } = await import('../templates/html.js');
            const { LocationService } = await import('../services/locationService.js');
            
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            
            // 重新獲取數據
            let userLocations = [];
            let userCreatedLocations = [];
            let allLocations = [];
            let userLocationCounts = null;
            let locationInteractionCounts = {};
            let userLocationStatuses = {};

            try {
                userLocations = await locationService.getUserLocations(3);
                userCreatedLocations = await locationService.getUserCreatedLocations(3);
                allLocations = [...userLocations, ...userCreatedLocations];
                userLocationCounts = await locationService.getUserLocationCounts(3);

                for (const location of allLocations) {
                    const counts = await locationService.getLocationInteractionCounts(location.id);
                    locationInteractionCounts[location.id] = counts;
                    
                    const status = await locationService.getUserLocationStatus(3, location.id);
                    if (status) {
                        userLocationStatuses[location.id] = status;
                    }
                }
            } catch (error) {
                console.error('[Debug API] Error in HTML generation try block:', error);
                // 提供默認值
                userLocations = [];
                userCreatedLocations = [];
                allLocations = [];
                userLocationCounts = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
                locationInteractionCounts = {};
                userLocationStatuses = {};
            }

            const html = getProfilePageHtml(
                results.user, 
                '', // 空的 CSS
                allLocations, 
                userLocationCounts, 
                locationInteractionCounts, 
                userLocationStatuses
            );

            results.steps.push('✅ Profile 頁面 HTML 生成成功（包含錯誤處理）');
            results.htmlLength = html.length;
            results.htmlPreview = html.substring(0, 200) + '...';
        } catch (error) {
            results.steps.push('❌ Profile 頁面 HTML 生成失敗');
            results.errors.push(`HTML 生成錯誤: ${error.message}`);
            throw error;
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing profile logged in:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 測試首頁數據
 */
async function handleTestHomepageData(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const results = {
            success: true,
            steps: [],
            errors: []
        };

        // 步驟 1: 實例化服務
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            results.steps.push('✅ 服務實例化成功');
        } catch (error) {
            results.steps.push('❌ 服務實例化失敗');
            results.errors.push(`服務實例化錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 2: 獲取首頁數據
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            // 模擬首頁數據獲取流程
            const generalLocations = await locationService.getRecentLocationsWithThumbnails(12);
            
            const locationInteractionCounts = {};
            const userLocationStatuses = {};

            // 獲取互動統計
            for (const location of generalLocations) {
                const counts = await locationService.getLocationInteractionCounts(location.id);
                locationInteractionCounts[location.id] = counts;
            }

            results.steps.push('✅ 首頁數據獲取成功');
            results.homepageData = {
                generalLocationsCount: generalLocations.length,
                locationInteractionCountsKeys: Object.keys(locationInteractionCounts).length,
                userLocationStatusesKeys: Object.keys(userLocationStatuses).length,
                sampleLocation: generalLocations.length > 0 ? {
                    id: generalLocations[0].id,
                    name: generalLocations[0].name,
                    interactionCounts: locationInteractionCounts[generalLocations[0].id]
                } : null
            };
        } catch (error) {
            results.steps.push('❌ 首頁數據獲取失敗');
            results.errors.push(`數據獲取錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 3: 測試首頁 HTML 生成
        try {
            const { getHomePageContent } = await import('../templates/html.js');
            const { LocationService } = await import('../services/locationService.js');
            
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            
            // 重新獲取數據
            const generalLocations = await locationService.getRecentLocationsWithThumbnails(12);
            const locationInteractionCounts = {};
            const userLocationStatuses = {};

            for (const location of generalLocations) {
                const counts = await locationService.getLocationInteractionCounts(location.id);
                locationInteractionCounts[location.id] = counts;
            }

            const html = getHomePageContent(generalLocations, null, locationInteractionCounts, userLocationStatuses);

            results.steps.push('✅ 首頁 HTML 生成成功');
            results.htmlLength = html.length;
            results.htmlPreview = html.substring(0, 200) + '...';
        } catch (error) {
            results.steps.push('❌ 首頁 HTML 生成失敗');
            results.errors.push(`HTML 生成錯誤: ${error.message}`);
            throw error;
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing homepage data:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 

/**
 * 測試小紅書風格佈局
 */
async function handleTestXiaohongshuLayout(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const results = {
            success: true,
            steps: [],
            errors: []
        };

        // 步驟 1: 實例化服務
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            results.steps.push('✅ 服務實例化成功');
        } catch (error) {
            results.steps.push('❌ 服務實例化失敗');
            results.errors.push(`服務實例化錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 2: 獲取小紅書風格佈局數據
        try {
            const { LocationService } = await import('../services/locationService.js');
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);

            // 模擬小紅書風格佈局數據獲取流程
            const userLocations = await locationService.getUserLocations(3);
            const userCreatedLocations = await locationService.getUserCreatedLocations(3);
            const allLocations = [...userLocations, ...userCreatedLocations];

            const userLocationCounts = await locationService.getUserLocationCounts(3);
            const locationInteractionCounts = {};
            const userLocationStatuses = {};

            for (const location of allLocations) {
                const counts = await locationService.getLocationInteractionCounts(location.id);
                locationInteractionCounts[location.id] = counts;
            }

            for (const location of allLocations) {
                const status = await locationService.getUserLocationStatus(3, location.id);
                if (status) {
                    userLocationStatuses[location.id] = status;
                }
            }

            results.steps.push('✅ 小紅書風格佈局數據獲取成功');
            results.xiaohongshuData = {
                userLocationsCount: userLocations.length,
                userCreatedLocationsCount: userCreatedLocations.length,
                allLocationsCount: allLocations.length,
                userLocationCounts: userLocationCounts,
                locationInteractionCountsKeys: Object.keys(locationInteractionCounts).length,
                userLocationStatusesKeys: Object.keys(userLocationStatuses).length
            };
        } catch (error) {
            results.steps.push('❌ 小紅書風格佈局數據獲取失敗');
            results.errors.push(`數據獲取錯誤: ${error.message}`);
            throw error;
        }

        // 步驟 3: 測試小紅書風格佈局 HTML 生成
        try {
            const { getXiaohongshuLayoutHtml } = await import('../templates/html.js');
            const { LocationService } = await import('../services/locationService.js');
            
            const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
            
            // 重新獲取數據
            const userLocations = await locationService.getUserLocations(3);
            const userCreatedLocations = await locationService.getUserCreatedLocations(3);
            const allLocations = [...userLocations, ...userCreatedLocations];
            const userLocationCounts = await locationService.getUserLocationCounts(3);

            const locationInteractionCounts = {};
            const userLocationStatuses = {};

            for (const location of allLocations) {
                const counts = await locationService.getLocationInteractionCounts(location.id);
                locationInteractionCounts[location.id] = counts;
                
                const status = await locationService.getUserLocationStatus(3, location.id);
                if (status) {
                    userLocationStatuses[location.id] = status;
                }
            }

            const html = getXiaohongshuLayoutHtml(
                results.user, 
                allLocations, 
                userLocationCounts, 
                locationInteractionCounts, 
                userLocationStatuses
            );

            results.steps.push('✅ 小紅書風格佈局 HTML 生成成功');
            results.htmlLength = html.length;
            results.htmlPreview = html.substring(0, 200) + '...';
        } catch (error) {
            results.steps.push('❌ 小紅書風格佈局 HTML 生成失敗');
            results.errors.push(`HTML 生成錯誤: ${error.message}`);
            throw error;
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Debug API] Error testing xiaohongshu layout:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    }
} 