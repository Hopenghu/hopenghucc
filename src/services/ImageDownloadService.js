import { LocationService } from './LocationService.js';

export class ImageDownloadService {
    constructor(db, googleMapsApiKey) {
        this.db = db;
        this.googleMapsApiKey = googleMapsApiKey;
        this.cacheExpiryDays = 30;
    }

    /**
     * 下載並存儲Google Places圖片
     * @param {string} googlePlaceId 
     * @param {string} locationId 
     * @returns {Promise<object>} 下載結果
     */
    async downloadAndStoreImage(googlePlaceId, locationId) {
        try {
            // 1. 從Google Places API獲取圖片URL
            if (!this.googleMapsApiKey) {
                throw new Error('Google Maps API key not available');
            }
            
            const locationService = new LocationService(this.db, this.googleMapsApiKey);
            const locationDetails = await locationService.fetchPlaceDetails(googlePlaceId);
            
            if (!locationDetails || !locationDetails.photoUrls || locationDetails.photoUrls.length === 0) {
                return {
                    success: false,
                    message: 'No photos available from Google Places API'
                };
            }

            const googleImageUrl = locationDetails.photoUrls[0];
            
            // 2. 下載圖片
            const imageResponse = await fetch(googleImageUrl);
            if (!imageResponse.ok) {
                return {
                    success: false,
                    message: 'Failed to download image from Google Places API'
                };
            }

            // 3. 將圖片轉換為base64或存儲到Cloudflare R2/其他存儲服務
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = this.arrayBufferToBase64(imageBuffer);
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            
            // 4. 生成本地URL（這裡使用base64，實際應用中建議使用CDN）
            const localImageUrl = `data:${contentType};base64,${base64Image}`;
            
            // 5. 更新資料庫
            await this.updateLocationThumbnail(locationId, localImageUrl);
            
            // 6. 記錄下載歷史
            await this.recordDownloadHistory(googlePlaceId, locationId, googleImageUrl, localImageUrl);
            
            return {
                success: true,
                localImageUrl,
                originalGoogleUrl: googleImageUrl,
                message: 'Image downloaded and stored successfully'
            };

        } catch (error) {
            console.error(`[ImageDownloadService] Error downloading image for location ${locationId}:`, error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to download and store image'
            };
        }
    }

    /**
     * 批量下載所有地點的圖片
     * @returns {Promise<object>} 批量下載結果
     */
    async downloadAllLocationImages() {
        try {
            const stmt = this.db.prepare(`
                SELECT id, google_place_id, name 
                FROM locations 
                WHERE google_place_id IS NOT NULL 
                AND (thumbnail_url IS NULL OR thumbnail_url LIKE '%maps.googleapis.com%')
                ORDER BY created_at DESC
            `);
            const { results } = await stmt.all();
            
            if (!results || results.length === 0) {
                return {
                    success: true,
                    total: 0,
                    downloaded: 0,
                    failed: 0,
                    message: 'No locations need image download'
                };
            }

            let downloaded = 0;
            let failed = 0;

            for (const location of results) {
                try {
                    const result = await this.downloadAndStoreImage(location.google_place_id, location.id);
                    if (result.success) {
                        downloaded++;
                        console.log(`[ImageDownloadService] Downloaded image for: ${location.name}`);
                    } else {
                        failed++;
                        console.error(`[ImageDownloadService] Failed to download image for: ${location.name}`);
                    }
                } catch (error) {
                    failed++;
                    console.error(`[ImageDownloadService] Error downloading image for ${location.name}:`, error);
                }
            }

            return {
                success: true,
                total: results.length,
                downloaded,
                failed,
                message: `Downloaded ${downloaded} out of ${results.length} images`
            };

        } catch (error) {
            console.error('[ImageDownloadService] Error in batch download:', error);
            return {
                success: false,
                error: error.message,
                message: 'Batch download failed'
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
    }

    /**
     * 記錄下載歷史
     * @param {string} googlePlaceId 
     * @param {string} locationId 
     * @param {string} originalUrl 
     * @param {string} localUrl 
     */
    async recordDownloadHistory(googlePlaceId, locationId, originalUrl, localUrl) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO image_download_history 
                (google_place_id, location_id, original_url, local_url, downloaded_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `);
            await stmt.bind(googlePlaceId, locationId, originalUrl, localUrl).run();
        } catch (error) {
            console.error('[ImageDownloadService] Error recording download history:', error);
        }
    }

    /**
     * 將ArrayBuffer轉換為base64
     * @param {ArrayBuffer} buffer 
     * @returns {string}
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * 獲取下載統計
     * @returns {Promise<object>}
     */
    async getDownloadStats() {
        try {
            // 總地點數
            const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM locations WHERE google_place_id IS NOT NULL');
            const totalResult = await totalStmt.first();
            
            // 已下載圖片的地點數
            const downloadedStmt = this.db.prepare(`
                SELECT COUNT(*) as downloaded 
                FROM locations 
                WHERE google_place_id IS NOT NULL 
                AND thumbnail_url IS NOT NULL 
                AND thumbnail_url != '' 
                AND thumbnail_url NOT LIKE '%maps.googleapis.com%'
                AND thumbnail_url NOT LIKE '%placehold.co%'
            `);
            const downloadedResult = await downloadedStmt.first();
            
            // 需要下載的地點數
            const needsDownloadStmt = this.db.prepare(`
                SELECT COUNT(*) as needs_download 
                FROM locations 
                WHERE google_place_id IS NOT NULL 
                AND (thumbnail_url IS NULL OR thumbnail_url LIKE '%maps.googleapis.com%')
            `);
            const needsDownloadResult = await needsDownloadStmt.first();

            return {
                total: totalResult?.total || 0,
                downloaded: downloadedResult?.downloaded || 0,
                needsDownload: needsDownloadResult?.needs_download || 0
            };
        } catch (error) {
            console.error('[ImageDownloadService] Error getting download stats:', error);
            return {
                total: 0,
                downloaded: 0,
                needsDownload: 0
            };
        }
    }
} 