import { ImageCacheService } from './ImageCacheService.js';

export class ImageRefreshService {
    constructor(db, locationService) {
        this.db = db;
        this.locationService = locationService;
        this.imageCacheService = new ImageCacheService(db);
    }

    /**
     * 批量刷新所有地點的圖片
     * @returns {Promise<object>} 刷新結果統計
     */
    async refreshAllLocationImages() {
        console.log('[ImageRefreshService] Starting batch refresh of all location images');
        
        try {
            // 獲取所有地點（包括沒有Google Place ID的）
            const stmt = this.db.prepare(`
                SELECT id, google_place_id, name, thumbnail_url 
                FROM locations 
                ORDER BY created_at DESC
            `);
            const { results } = await stmt.all();
            
            if (!results || results.length === 0) {
                return {
                    success: true,
                    total: 0,
                    refreshed: 0,
                    failed: 0,
                    message: 'No locations found'
                };
            }

            let refreshed = 0;
            let failed = 0;

            for (const location of results) {
                try {
                    if (location.google_place_id) {
                        // 有Google Place ID的地點，嘗試重新獲取圖片
                        await this.refreshLocationImage(location.id, location.google_place_id);
                    } else {
                        // 沒有Google Place ID的地點，設置默認圖片
                        const defaultImageUrl = this.imageCacheService.getDefaultImageUrl();
                        await this.updateLocationThumbnail(location.id, defaultImageUrl);
                    }
                    refreshed++;
                    console.log(`[ImageRefreshService] Refreshed image for location: ${location.name}`);
                } catch (error) {
                    failed++;
                    console.error(`[ImageRefreshService] Failed to refresh image for location ${location.name}:`, error);
                }
            }

            return {
                success: true,
                total: results.length,
                refreshed,
                failed,
                message: `Refreshed ${refreshed} out of ${results.length} locations`
            };

        } catch (error) {
            console.error('[ImageRefreshService] Error in batch refresh:', error);
            return {
                success: false,
                error: error.message,
                message: 'Batch refresh failed'
            };
        }
    }

    /**
     * 刷新單個地點的圖片
     * @param {string} locationId 
     * @param {string} googlePlaceId 
     * @returns {Promise<object>} 刷新結果
     */
    async refreshLocationImage(locationId, googlePlaceId) {
        if (!locationId || !googlePlaceId) {
            throw new Error('Location ID and Google Place ID are required');
        }

        try {
            // 使用LocationService重新獲取地點詳情
            const locationDetails = await this.locationService.fetchPlaceDetails(googlePlaceId);
            
            if (!locationDetails || !locationDetails.photoUrls || locationDetails.photoUrls.length === 0) {
                console.log(`[ImageRefreshService] No photos available for location ${locationId}, using default image`);
                // 如果沒有新圖片，使用默認圖片
                const defaultImageUrl = this.imageCacheService.getDefaultImageUrl();
                await this.updateLocationThumbnail(locationId, defaultImageUrl);
                return {
                    success: true,
                    newImageUrl: defaultImageUrl,
                    message: 'No new images available, using default image'
                };
            }

            // 使用第一張圖片作為縮略圖
            const newImageUrl = locationDetails.photoUrls[0];
            console.log(`[ImageRefreshService] Got Google Places image URL for location ${locationId}: ${newImageUrl}`);
            
            // 重要：直接將Google Places URL寫入資料庫，不進行任何轉換
            await this.updateLocationThumbnail(locationId, newImageUrl);
            console.log(`[ImageRefreshService] Updated database thumbnail for location ${locationId} with Google Places URL`);
            
            // 同時緩存到image_cache表（用於代理服務）
            if (newImageUrl.includes('maps.googleapis.com')) {
                await this.imageCacheService.cacheImageUrl(newImageUrl, newImageUrl);
                console.log(`[ImageRefreshService] Cached Google Places image for location ${locationId}`);
            }

            return {
                success: true,
                newImageUrl,
                message: 'Location image refreshed successfully'
            };

        } catch (error) {
            console.error(`[ImageRefreshService] Error refreshing image for location ${locationId}:`, error);
            // 如果刷新失敗，使用默認圖片
            const defaultImageUrl = this.imageCacheService.getDefaultImageUrl();
            await this.updateLocationThumbnail(locationId, defaultImageUrl);
            return {
                success: false,
                newImageUrl: defaultImageUrl,
                error: error.message,
                message: 'Refresh failed, using default image'
            };
        }
    }

    /**
     * 更新地點的縮略圖URL
     * @param {string} locationId 
     * @param {string} thumbnailUrl 
     */
    async updateLocationThumbnail(locationId, thumbnailUrl) {
        const stmt = this.db.prepare('UPDATE locations SET thumbnail_url = ? WHERE id = ?');
        await stmt.bind(thumbnailUrl, locationId).run();
        console.log(`[ImageRefreshService] Updated thumbnail for location ${locationId}`);
    }

    /**
     * 獲取需要刷新圖片的地點列表
     * @returns {Promise<Array<object>>} 地點列表
     */
    async getLocationsNeedingRefresh() {
        try {
            const stmt = this.db.prepare(`
                SELECT id, google_place_id, name, thumbnail_url, created_at
                FROM locations 
                WHERE google_place_id IS NOT NULL 
                AND (thumbnail_url IS NULL OR thumbnail_url = '' OR thumbnail_url LIKE '%maps.googleapis.com%')
                ORDER BY created_at DESC
            `);
            const { results } = await stmt.all();
            return results || [];
        } catch (error) {
            console.error('[ImageRefreshService] Error getting locations needing refresh:', error);
            return [];
        }
    }

    /**
     * 獲取圖片刷新統計
     * @returns {Promise<object>} 統計信息
     */
    async getRefreshStats() {
        try {
            // 總地點數
            const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM locations WHERE google_place_id IS NOT NULL');
            const totalResult = await totalStmt.first();
            
            // 需要刷新的地點數
            const needsRefreshStmt = this.db.prepare(`
                SELECT COUNT(*) as needs_refresh 
                FROM locations 
                WHERE google_place_id IS NOT NULL 
                AND (thumbnail_url IS NULL OR thumbnail_url = '' OR thumbnail_url LIKE '%maps.googleapis.com%')
            `);
            const needsRefreshResult = await needsRefreshStmt.first();
            
            // 有有效圖片的地點數
            const hasValidImageStmt = this.db.prepare(`
                SELECT COUNT(*) as has_valid_image 
                FROM locations 
                WHERE google_place_id IS NOT NULL 
                AND thumbnail_url IS NOT NULL 
                AND thumbnail_url != '' 
                AND thumbnail_url NOT LIKE '%maps.googleapis.com%'
            `);
            const hasValidImageResult = await hasValidImageStmt.first();

            return {
                total: totalResult?.total || 0,
                needsRefresh: needsRefreshResult?.needs_refresh || 0,
                hasValidImage: hasValidImageResult?.has_valid_image || 0
            };
        } catch (error) {
            console.error('[ImageRefreshService] Error getting refresh stats:', error);
            return {
                total: 0,
                needsRefresh: 0,
                hasValidImage: 0
            };
        }
    }
} 