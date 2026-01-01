export class ImageCacheService {
    constructor(db) {
        this.db = db;
        this.cacheExpiryDays = 30; // 圖片緩存30天
    }

    /**
     * 檢查圖片URL是否為Google Places API URL
     * @param {string} url 
     * @returns {boolean}
     */
    isGooglePlacesImageUrl(url) {
        return url && url.includes('maps.googleapis.com/maps/api/place/photo');
    }

    /**
     * 從Google Places API URL中提取photoreference
     * @param {string} url 
     * @returns {string|null}
     */
    extractPhotoReference(url) {
        if (!this.isGooglePlacesImageUrl(url)) return null;
        
        const match = url.match(/photoreference=([^&]+)/);
        return match ? match[1] : null;
    }

    /**
     * 生成緩存鍵
     * @param {string} photoReference 
     * @returns {string}
     */
    generateCacheKey(photoReference) {
        return `photo_${photoReference}`;
    }

    /**
     * 檢查圖片是否已緩存且未過期
     * @param {string} originalUrl 
     * @returns {Promise<string|null>} 返回緩存的URL或null
     */
    async getCachedImageUrl(originalUrl) {
        if (!originalUrl) return null;
        
        if (!this.isGooglePlacesImageUrl(originalUrl)) {
            return originalUrl; // 非Google Places圖片直接返回
        }

        const photoReference = this.extractPhotoReference(originalUrl);
        if (!photoReference) return originalUrl;

        try {
            const cacheKey = this.generateCacheKey(photoReference);
            const stmt = this.db.prepare(`
                SELECT cached_url, created_at 
                FROM image_cache 
                WHERE cache_key = ? AND created_at > datetime('now', '-${this.cacheExpiryDays} days')
            `);
            const result = await stmt.bind(cacheKey).first();
            
            if (result && result.cached_url) {
                console.log(`[ImageCacheService] Found cached image for ${photoReference}`);
                return result.cached_url;
            }
        } catch (error) {
            console.error('[ImageCacheService] Error checking cache:', error);
        }
        
        return null;
    }

    /**
     * 智能處理圖片URL，包括過期URL的處理
     * @param {string} imageUrl 
     * @param {string} googlePlaceId 
     * @returns {Promise<string>} 處理後的圖片URL
     */
    async processImageUrl(imageUrl, googlePlaceId = null) {
        if (!imageUrl) {
            return this.getDefaultImageUrl();
        }

        // 如果是Google Places圖片URL（可能已過期）
        if (this.isGooglePlacesImageUrl(imageUrl)) {
            // 檢查緩存
            const cachedUrl = await this.getCachedImageUrl(imageUrl);
            if (cachedUrl && cachedUrl !== imageUrl) {
                return cachedUrl;
            }

            // 如果有Google Place ID，嘗試重新獲取圖片
            if (googlePlaceId) {
                console.log(`[ImageCacheService] Attempting to refresh image for place ${googlePlaceId}`);
                return await this.refreshImageForPlace(googlePlaceId);
            }
            
            // 如果沒有Google Place ID或無法重新獲取，使用默認圖片
            console.log(`[ImageCacheService] Using default image for expired Google Places URL`);
            return this.getDefaultImageUrl();
        }

        // 對於其他類型的圖片URL，直接返回
        return imageUrl;
    }

    /**
     * 為指定地點重新獲取圖片
     * @param {string} googlePlaceId 
     * @returns {Promise<string>} 新的圖片URL或默認圖片
     */
    async refreshImageForPlace(googlePlaceId) {
        try {
            // 這裡需要調用Google Places API重新獲取圖片
            // 由於我們沒有直接的API調用權限，我們返回默認圖片
            // 實際應用中可以集成Google Places API調用
            console.log(`[ImageCacheService] Would refresh image for place ${googlePlaceId}`);
            return this.getDefaultImageUrl();
        } catch (error) {
            console.error(`[ImageCacheService] Error refreshing image for place ${googlePlaceId}:`, error);
            return this.getDefaultImageUrl();
        }
    }

    /**
     * 獲取默認圖片URL
     * @returns {string}
     */
    getDefaultImageUrl() {
        return 'https://placehold.co/400x268/6B7280/FFFFFF?text=Location+Image';
    }

    /**
     * 批量處理地點的圖片URL
     * @param {Array<object>} locations 
     * @returns {Promise<Array<object>>} 處理後的地點列表
     */
    async processLocationsImages(locations) {
        if (!locations || !Array.isArray(locations)) {
            return [];
        }

        const processedLocations = [];
        
        for (const location of locations) {
            const processedLocation = { ...location };
            
            // 直接檢查thumbnail_url是否為Google Places URL
            if (location.thumbnail_url && this.isGooglePlacesImageUrl(location.thumbnail_url)) {
                // Google API URL，轉為代理URL
                processedLocation.thumbnail_url = `/api/image/proxy/?url=${encodeURIComponent(location.thumbnail_url)}`;
                console.log(`[ImageCacheService] Converted Google Places URL to proxy for location ${location.id}`);
            } else if (location.thumbnail_url && !this.isGooglePlacesImageUrl(location.thumbnail_url)) {
                // 非Google Places圖片，直接使用
                processedLocation.thumbnail_url = location.thumbnail_url;
            } else {
                // 沒有圖片，使用預設圖片
                processedLocation.thumbnail_url = this.getDefaultImageUrl();
            }
            
            processedLocations.push(processedLocation);
        }

        return processedLocations;
    }

    /**
     * 為指定地點獲取緩存的圖片
     * @param {string} googlePlaceId 
     * @returns {Promise<string|null>} 緩存的圖片URL或null
     */
    async getCachedImageForPlace(googlePlaceId) {
        try {
            // 先查 locations 表取得最新的 thumbnail_url
            const stmtLoc = this.db.prepare('SELECT thumbnail_url FROM locations WHERE google_place_id = ?');
            const loc = await stmtLoc.bind(googlePlaceId).first();
            if (!loc || !loc.thumbnail_url) return null;

            // 從 thumbnail_url 解析 photo_reference
            const photoReference = this.extractPhotoReference(loc.thumbnail_url);
            if (!photoReference) return null;

            // 查詢 image_cache
            const cacheKey = this.generateCacheKey(photoReference);
            const stmt = this.db.prepare(`
                SELECT cached_url FROM image_cache
                WHERE cache_key = ? AND created_at > datetime('now', '-${this.cacheExpiryDays} days')
                ORDER BY created_at DESC LIMIT 1
            `);
            const result = await stmt.bind(cacheKey).first();
            return result?.cached_url || null;
        } catch (error) {
            console.error(`[ImageCacheService] Error getting cached image for place ${googlePlaceId}:`, error);
            return null;
        }
    }

    /**
     * 緩存圖片URL
     * @param {string} originalUrl 
     * @param {string} cachedUrl 
     * @returns {Promise<void>}
     */
    async cacheImageUrl(originalUrl, cachedUrl) {
        if (!this.isGooglePlacesImageUrl(originalUrl)) return;

        const photoReference = this.extractPhotoReference(originalUrl);
        if (!photoReference) return;

        try {
            const cacheKey = this.generateCacheKey(photoReference);
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO image_cache (cache_key, original_url, cached_url, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `);
            await stmt.bind(cacheKey, originalUrl, cachedUrl).run();
            console.log(`[ImageCacheService] Cached image for ${photoReference}`);
        } catch (error) {
            console.error('[ImageCacheService] Error caching image:', error);
        }
    }

    /**
     * 清理過期的緩存
     * @returns {Promise<number>} 返回清理的記錄數
     */
    async cleanupExpiredCache() {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM image_cache 
                WHERE created_at < datetime('now', '-${this.cacheExpiryDays} days')
            `);
            const result = await stmt.run();
            console.log(`[ImageCacheService] Cleaned up ${result.changes} expired cache entries`);
            return result.changes;
        } catch (error) {
            console.error('[ImageCacheService] Error cleaning up cache:', error);
            return 0;
        }
    }

    /**
     * 獲取圖片統計信息
     * @returns {Promise<object>}
     */
    async getCacheStats() {
        try {
            const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM image_cache');
            const expiredStmt = this.db.prepare(`
                SELECT COUNT(*) as expired 
                FROM image_cache 
                WHERE created_at < datetime('now', '-${this.cacheExpiryDays} days')
            `);
            
            const totalResult = await totalStmt.first();
            const expiredResult = await expiredStmt.first();
            
            return {
                total: totalResult?.total || 0,
                expired: expiredResult?.expired || 0,
                valid: (totalResult?.total || 0) - (expiredResult?.expired || 0)
            };
        } catch (error) {
            console.error('[ImageCacheService] Error getting cache stats:', error);
            return { total: 0, expired: 0, valid: 0 };
        }
    }
} 