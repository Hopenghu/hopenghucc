/**
 * Cache Helper Utility
 * 緩存輔助工具
 * 
 * 提供 Cloudflare Workers Cache API 的封裝，用於緩存 API 響應
 */

import { recordCacheHit, recordCacheMiss } from './cacheMonitor.js';
import { logger } from './logger.js';

/**
 * 生成緩存鍵
 * @param {string} prefix - 緩存前綴
 * @param {string} key - 緩存鍵
 * @param {object} params - 可選參數對象（用於生成唯一鍵）
 * @returns {string} 完整的緩存鍵
 */
export function generateCacheKey(prefix, key, params = {}) {
  const paramString = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  
  return paramString 
    ? `${prefix}:${key}:${paramString}`
    : `${prefix}:${key}`;
}

/**
 * 從緩存獲取響應
 * @param {Request} request - 原始請求
 * @param {string} cacheKey - 緩存鍵
 * @param {Cache} cache - Cache 對象（通常是 caches.default）
 * @returns {Promise<Response|null>} 緩存的響應，如果不存在則返回 null
 */
export async function getCachedResponse(request, cacheKey, cache) {
  try {
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname = `/cache/${cacheKey}`;
    const cacheRequest = new Request(cacheUrl.toString(), request);
    
    const startTime = Date.now();
    const cachedResponse = await cache.match(cacheRequest);
    const responseTime = Date.now() - startTime;
    
    if (cachedResponse) {
      logger.debug(`Cache hit for key: ${cacheKey}`, {
        cacheKey,
        duration: responseTime,
        metadata: { cache: true }
      });
      recordCacheHit(cacheKey, responseTime);
      return cachedResponse;
    }
    
    logger.debug(`Cache miss for key: ${cacheKey}`, {
      cacheKey,
      duration: responseTime,
      metadata: { cache: false }
    });
    recordCacheMiss(cacheKey, responseTime);
    return null;
  } catch (error) {
    console.error(`[Cache] Error getting cached response for key ${cacheKey}:`, error);
    return null;
  }
}

/**
 * 將響應存儲到緩存
 * @param {Request} request - 原始請求
 * @param {Response} response - 要緩存的響應
 * @param {string} cacheKey - 緩存鍵
 * @param {number} ttl - 緩存時間（秒）
 * @param {Cache} cache - Cache 對象（通常是 caches.default）
 * @param {ExecutionContext} ctx - Execution Context（可選，用於 waitUntil）
 * @returns {Promise<void>}
 */
export async function setCachedResponse(request, response, cacheKey, ttl, cache, ctx = null) {
  try {
    // 創建響應的副本（因為響應只能讀取一次）
    const responseClone = response.clone();
    
    // 設置緩存頭
    const headers = new Headers(responseClone.headers);
    headers.set('Cache-Control', `public, max-age=${ttl}`);
    headers.set('X-Cache-Key', cacheKey);
    headers.set('X-Cached-At', new Date().toISOString());
    
    const cachedResponse = new Response(responseClone.body, {
      status: responseClone.status,
      statusText: responseClone.statusText,
      headers: headers
    });
    
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname = `/cache/${cacheKey}`;
    const cacheRequest = new Request(cacheUrl.toString(), request);
    
    // 使用 waitUntil 確保緩存操作不阻塞響應
    const cacheStartTime = Date.now();
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(
        cache.put(cacheRequest, cachedResponse.clone())
          .then(() => {
            const cacheTime = Date.now() - cacheStartTime;
            logger.debug(`Cached response for key: ${cacheKey}`, {
              cacheKey,
              ttl,
              duration: cacheTime,
              metadata: { cache: true }
            });
          })
          .catch(err => logger.error(`Error caching response for key ${cacheKey}`, err, {
            cacheKey,
            metadata: { cache: true }
          }))
      );
    } else {
      await cache.put(cacheRequest, cachedResponse);
      const cacheTime = Date.now() - cacheStartTime;
      logger.debug(`Cached response for key: ${cacheKey}`, {
        cacheKey,
        ttl,
        duration: cacheTime,
        metadata: { cache: true }
      });
    }
  } catch (error) {
    console.error(`[Cache] Error setting cached response for key ${cacheKey}:`, error);
  }
}

/**
 * 緩存裝飾器 - 為 API 處理函數添加緩存功能
 * @param {Function} handler - API 處理函數
 * @param {object} options - 緩存選項
 * @param {string} options.cacheKey - 緩存鍵前綴
 * @param {number} options.ttl - 緩存時間（秒），默認 300 秒（5 分鐘）
 * @param {Function} options.keyGenerator - 可選的自定義鍵生成函數
 * @param {Function} options.shouldCache - 可選的函數，決定是否應該緩存響應
 * @returns {Function} 包裝後的處理函數
 */
export function withCache(handler, options = {}) {
  const {
    cacheKey = 'api',
    ttl = 300, // 默認 5 分鐘
    keyGenerator = null,
    shouldCache = (response) => response.ok && response.status === 200
  } = options;

  return async (request, env, ...args) => {
    // 獲取 Cache 對象
    const cache = caches.default;
    
    // 生成緩存鍵
    let finalCacheKey;
    if (keyGenerator) {
      finalCacheKey = keyGenerator(request, ...args);
    } else {
      const url = new URL(request.url);
      const params = Object.fromEntries(url.searchParams.entries());
      finalCacheKey = generateCacheKey(cacheKey, url.pathname, params);
    }
    
    // 嘗試從緩存獲取
    const cachedResponse = await getCachedResponse(request, finalCacheKey, cache);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 執行原始處理函數
    const response = await handler(request, env, ...args);
    
    // 如果響應應該被緩存，則存儲到緩存
    if (shouldCache(response)) {
      const ctx = args.find(arg => arg && typeof arg.waitUntil === 'function') || null;
      await setCachedResponse(request, response, finalCacheKey, ttl, cache, ctx);
    }
    
    return response;
  };
}

/**
 * 清除特定前綴的緩存
 * @param {string} prefix - 緩存前綴
 * @param {Cache} cache - Cache 對象
 * @returns {Promise<number>} 清除的緩存數量
 */
export async function clearCacheByPrefix(prefix, cache) {
  // 注意：Cache API 不直接支持按前綴刪除
  // 這需要在應用層維護緩存鍵列表，或使用其他緩存策略
  console.warn(`[Cache] clearCacheByPrefix not fully implemented for prefix: ${prefix}`);
  return 0;
}

/**
 * 緩存時間常量（秒）
 */
export const CACHE_TTL = {
  SHORT: 60,        // 1 分鐘 - 用於頻繁變化的數據
  MEDIUM: 300,      // 5 分鐘 - 用於一般數據
  LONG: 1800,       // 30 分鐘 - 用於不經常變化的數據
  VERY_LONG: 3600,  // 1 小時 - 用於靜態或很少變化的數據
  STATIC: 86400     // 24 小時 - 用於幾乎不變化的數據
};

