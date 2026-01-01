import { ImageCacheService } from '../services/ImageCacheService.js';
import { ImageDownloadService } from '../services/ImageDownloadService.js';
import { R2ImageService } from '../services/R2ImageService.js';
import { LocationService } from '../services/locationService.js';
import { withCache, CACHE_TTL } from '../utils/cacheHelper.js';

/**
 * 處理圖片相關的API請求
 * @param {Request} request 
 * @param {object} env 
 * @param {ExecutionContext} ctx - Cloudflare Workers 執行上下文（用於 waitUntil）
 * @returns {Response}
 */
export async function handleImageRequest(request, env, ctx = null) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
        // 圖片緩存統計 - 使用緩存（5分鐘）
        if (pathname === '/api/image/stats') {
            const cachedHandler = withCache(handleImageStats, {
                cacheKey: 'image',
                ttl: CACHE_TTL.MEDIUM, // 5 分鐘
                keyGenerator: () => 'stats'
            });
            return await cachedHandler(request, env);
        }
        
        // 清理過期緩存
        if (pathname === '/api/image/cleanup') {
            return await handleImageCleanup(request, env);
        }
        
        // 圖片代理（用於處理Google Places API圖片）
        if (pathname.startsWith('/api/image/proxy/')) {
            return await handleImageProxy(request, env, ctx);
        }
        
        // 刷新地點圖片
        if (pathname === '/api/image/refresh-location') {
            return await handleRefreshLocationImage(request, env);
        }
        
        // 批量刷新所有圖片
        if (pathname === '/api/image/refresh-all') {
            return await handleRefreshAllImages(request, env);
        }

        // 下載地點圖片
        if (pathname === '/api/image/download-location') {
            return await handleDownloadLocationImage(request, env);
        }

        // 批量下載所有圖片
        if (pathname === '/api/image/download-all') {
            return await handleDownloadAllImages(request, env);
        }

        // 下載統計
        if (pathname === '/api/image/download-stats') {
            return await handleDownloadStats(request, env);
        }

        // R2 圖片服務
        if (pathname.startsWith('/api/image/r2/')) {
            return await handleR2Image(request, env);
        }

        // 批量更新圖片（定期任務）
        if (pathname === '/api/image/batch-update') {
            return await handleBatchUpdateImages(request, env);
        }

        // 獲取圖片版本
        if (pathname === '/api/image/versions') {
            return await handleGetImageVersions(request, env);
        }

        // 排程任務
        if (pathname.startsWith('/api/image/scheduler/')) {
            return await handleSchedulerRequest(request, env);
        }

        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('[Image API] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 獲取圖片緩存統計信息
 */
async function handleImageStats(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const imageCacheService = new ImageCacheService(env.DB);
        const stats = await imageCacheService.getCacheStats();
        
        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error getting stats:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 清理過期的圖片緩存
 */
async function handleImageCleanup(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const imageCacheService = new ImageCacheService(env.DB);
        const cleanedCount = await imageCacheService.cleanupExpiredCache();
        
        return new Response(JSON.stringify({ 
            success: true, 
            cleanedCount,
            message: `Cleaned up ${cleanedCount} expired cache entries`
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error cleaning up cache:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 圖片代理 - 處理Google Places API圖片並緩存
 * 使用 Cloudflare Workers Cache API 進行響應緩存
 */
async function handleImageProxy(request, env, ctx = null) {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
        return new Response('Missing image URL parameter', { status: 400 });
    }

    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const imageCacheService = new ImageCacheService(env.DB);
        
        // 檢查是否為Google Places圖片
        if (!imageCacheService.isGooglePlacesImageUrl(imageUrl)) {
            return new Response('Invalid image URL', { status: 400 });
        }

        // 生成緩存鍵（基於圖片 URL）
        const photoReference = imageCacheService.extractPhotoReference(imageUrl);
        
        // 檢查 Cloudflare Workers Cache
        const cache = caches.default;
        const cacheRequest = new Request(request.url, request);
        const cachedResponse = await cache.match(cacheRequest);
        
        if (cachedResponse) {
            console.log(`[Image API] Cache hit for image: ${photoReference || imageUrl}`);
            // 更新緩存時間戳頭
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-Cache-Status', 'HIT');
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                headers: headers
            });
        }
        
        console.log(`[Image API] Cache miss for image: ${photoReference || imageUrl}`);

        // 檢查數據庫緩存
        const cachedUrl = await imageCacheService.getCachedImageUrl(imageUrl);
        if (cachedUrl && cachedUrl !== imageUrl) {
            // 重定向到緩存的URL
            return Response.redirect(cachedUrl, 302);
        }

        // 如果沒有緩存，嘗試獲取圖片並緩存
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時

        try {
            const fetchResponse = await fetch(imageUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; hopenghu.cc/1.0)'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!fetchResponse.ok) {
                console.warn(`[Image API] Google API returned ${fetchResponse.status} for image: ${imageUrl}`);
                // 記錄失敗的圖片URL
                await recordFailedImage(imageUrl, `HTTP ${fetchResponse.status}`, env);
                // 返回默認圖片
                const defaultImageUrl = imageCacheService.getDefaultImageUrl();
                return Response.redirect(defaultImageUrl, 302);
            }

            // 檢查內容類型
            const contentType = fetchResponse.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                console.warn(`[Image API] Invalid content type: ${contentType} for image: ${imageUrl}`);
                await recordFailedImage(imageUrl, `Invalid content type: ${contentType}`, env);
                const defaultImageUrl = imageCacheService.getDefaultImageUrl();
                return Response.redirect(defaultImageUrl, 302);
            }

            // 獲取圖片數據
            const imageBuffer = await fetchResponse.arrayBuffer();
            
            // 檢查圖片大小
            if (imageBuffer.byteLength > 5 * 1024 * 1024) { // 5MB限制
                console.warn(`[Image API] Image too large: ${imageBuffer.byteLength} bytes for image: ${imageUrl}`);
                await recordFailedImage(imageUrl, `Image too large: ${imageBuffer.byteLength} bytes`, env);
                const defaultImageUrl = imageCacheService.getDefaultImageUrl();
                return Response.redirect(defaultImageUrl, 302);
            }

            // 檢查圖片是否為空
            if (imageBuffer.byteLength === 0) {
                console.warn(`[Image API] Empty image received for: ${imageUrl}`);
                await recordFailedImage(imageUrl, 'Empty image', env);
                const defaultImageUrl = imageCacheService.getDefaultImageUrl();
                return Response.redirect(defaultImageUrl, 302);
            }
            
            // 緩存圖片URL到數據庫
            await imageCacheService.cacheImageUrl(imageUrl, imageUrl);
            
            // 創建響應
            const imageResponse = new Response(imageBuffer, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=2592000', // 緩存30天（Cloudflare Workers Cache）
                    'Access-Control-Allow-Origin': '*',
                    'X-Image-Source': 'google_places',
                    'X-Image-Cached': 'true',
                    'X-Cache-Status': 'MISS'
                }
            });
            
            // 將響應存儲到 Cloudflare Workers Cache（使用 waitUntil 不阻塞響應）
            if (ctx && ctx.waitUntil) {
                ctx.waitUntil(
                    cache.put(cacheRequest, imageResponse.clone())
                        .then(() => console.log(`[Image API] Cached image response for: ${photoReference || imageUrl}`))
                        .catch(err => console.error(`[Image API] Error caching image response:`, err))
                );
            } else {
                // 如果沒有 ctx，仍然嘗試緩存（但會阻塞響應）
                await cache.put(cacheRequest, imageResponse.clone());
            }
            
            return imageResponse;

        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
                console.warn(`[Image API] Request timeout for image: ${imageUrl}`);
                await recordFailedImage(imageUrl, 'Request timeout', env);
            } else {
                console.error(`[Image API] Fetch error for image: ${imageUrl}`, fetchError);
                await recordFailedImage(imageUrl, fetchError.message, env);
            }
            
            // 返回默認圖片
            const defaultImageUrl = imageCacheService.getDefaultImageUrl();
            return Response.redirect(defaultImageUrl, 302);
        }

    } catch (error) {
        console.error('[Image API] Error proxying image:', error);
        // 記錄錯誤
        await recordFailedImage(imageUrl, error.message, env);
        // 錯誤時返回默認圖片
        const imageCacheService = new ImageCacheService(env.DB);
        const defaultImageUrl = imageCacheService.getDefaultImageUrl();
        return Response.redirect(defaultImageUrl, 302);
    }
}

/**
 * 記錄失敗的圖片
 */
async function recordFailedImage(imageUrl, errorMessage, env) {
    if (!env || !env.DB) {
        console.warn('[Image API] Cannot record image error: Database not available');
        return;
    }
    
    try {
        const stmt = env.DB.prepare(`
            INSERT INTO image_error_logs 
            (image_url, error_message, failed_at, retry_count)
            VALUES (?, ?, datetime('now'), 1)
            ON CONFLICT(image_url) DO UPDATE SET
                error_message = excluded.error_message,
                failed_at = excluded.failed_at,
                retry_count = retry_count + 1
        `);
        await stmt.bind(imageUrl, errorMessage).run();
    } catch (error) {
        console.error('[Image API] Failed to record image error:', error);
    }
}

/**
 * 刷新指定地點的圖片
 */
async function handleRefreshLocationImage(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId');
        const googlePlaceId = url.searchParams.get('googlePlaceId');
        
        if (!locationId && !googlePlaceId) {
            return new Response('Missing locationId or googlePlaceId parameter', { status: 400 });
        }

        const imageCacheService = new ImageCacheService(env.DB);
        
        // 如果有Google Place ID，嘗試重新獲取圖片
        if (googlePlaceId) {
            const newImageUrl = await imageCacheService.refreshImageForPlace(googlePlaceId);
            
            // 更新資料庫中的圖片URL
            if (locationId) {
                const stmt = env.DB.prepare('UPDATE locations SET thumbnail_url = ? WHERE id = ?');
                await stmt.bind(newImageUrl, locationId).run();
            }
            
            return new Response(JSON.stringify({ 
                success: true, 
                newImageUrl,
                message: 'Location image refreshed successfully'
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'No Google Place ID provided for image refresh'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error refreshing location image:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 批量刷新所有地點的圖片
 */
async function handleRefreshAllImages(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        // 導入ImageRefreshService
        const { ImageRefreshService } = await import('../services/ImageRefreshService.js');
        const { LocationService } = await import('../services/locationService.js');
        
        const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
        const imageRefreshService = new ImageRefreshService(env.DB, locationService);
        
        // 執行批量刷新
        const result = await imageRefreshService.refreshAllLocationImages();
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error in batch refresh:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            message: 'Batch refresh failed'
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
 * 下載指定地點的圖片
 */
async function handleDownloadLocationImage(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId');
        const googlePlaceId = url.searchParams.get('googlePlaceId');
        
        if (!locationId && !googlePlaceId) {
            return new Response('Missing locationId or googlePlaceId parameter', { status: 400 });
        }

        const imageDownloadService = new ImageDownloadService(env.DB, env.GOOGLE_MAPS_API_KEY);
        
        // 如果有Google Place ID，嘗試下載圖片
        if (googlePlaceId) {
            const imageUrl = await imageDownloadService.downloadImageForPlace(googlePlaceId);
            
            // 返回圖片URL
            return new Response(JSON.stringify({ 
                success: true, 
                imageUrl,
                message: 'Location image downloaded successfully'
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'No Google Place ID provided for image download'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error downloading location image:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 批量下載所有地點的圖片
 */
async function handleDownloadAllImages(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const imageDownloadService = new ImageDownloadService(env.DB, env.GOOGLE_MAPS_API_KEY);
        const result = await imageDownloadService.downloadAllLocationImages();
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error in batch download:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            message: 'Batch download failed'
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
 * 獲取圖片下載統計信息
 */
async function handleDownloadStats(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const imageDownloadService = new ImageDownloadService(env.DB, env.GOOGLE_MAPS_API_KEY);
        const stats = await imageDownloadService.getDownloadStats();
        
        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error getting download stats:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 處理 R2 圖片請求
 */
async function handleR2Image(request, env) {
    try {
        const url = new URL(request.url);
        const key = decodeURIComponent(url.pathname.split('/api/image/r2/')[1]);
        
        if (!key) {
            return new Response('Missing image key', { status: 400 });
        }

        const r2ImageService = new R2ImageService(env.DB, env.GOOGLE_MAPS_API_KEY, env.IMAGES_BUCKET);
        const imageResponse = await r2ImageService.getImageFromR2(key);
        
        if (!imageResponse) {
            return new Response('Image not found', { status: 404 });
        }
        
        return imageResponse;
    } catch (error) {
        console.error('[Image API] Error getting R2 image:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 批量更新圖片（定期任務）
 */
async function handleBatchUpdateImages(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const batchSize = parseInt(url.searchParams.get('batch_size') || '10', 10);
        
        const r2ImageService = new R2ImageService(env.DB, env.GOOGLE_MAPS_API_KEY, env.IMAGES_BUCKET);
        const result = await r2ImageService.batchUpdateImages(batchSize);
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error in batch update:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            message: 'Batch update failed'
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
 * 獲取圖片版本列表
 */
async function handleGetImageVersions(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const locationId = url.searchParams.get('location_id');
        
        if (!locationId) {
            return new Response('Missing location_id parameter', { status: 400 });
        }

        const r2ImageService = new R2ImageService(env.DB, env.GOOGLE_MAPS_API_KEY, env.IMAGES_BUCKET);
        const versions = await r2ImageService.getImageVersions(locationId);
        
        return new Response(JSON.stringify({
            success: true,
            versions: versions
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Image API] Error getting image versions:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * 處理排程任務請求
 */
async function handleSchedulerRequest(request, env) {
    if (!env.DB) {
        return new Response('Database not available', { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const pathname = url.pathname;

        const { ImageScheduler } = await import('../services/ImageScheduler.js');
        const scheduler = new ImageScheduler(env.DB, env.GOOGLE_MAPS_API_KEY, env.IMAGES_BUCKET);

        // 執行排程任務
        if (pathname === '/api/image/scheduler/run' && request.method === 'POST') {
            const batchSize = parseInt(url.searchParams.get('batch_size') || '10', 10);
            const maxAge = parseInt(url.searchParams.get('max_age') || '30', 10);
            const forceUpdate = url.searchParams.get('force_update') === 'true';

            const result = await scheduler.runScheduledUpdate({
                batchSize,
                maxAge,
                forceUpdate
            });

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        // 獲取排程統計
        if (pathname === '/api/image/scheduler/stats' && request.method === 'GET') {
            const stats = await scheduler.getSchedulerStats();
            return new Response(JSON.stringify(stats), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
        }

        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('[Image API] Error in scheduler request:', error);
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

 