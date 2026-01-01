// R2ImageService - Cloudflare R2 圖片存儲服務
// 基於「人、事、時、地、物」哲學架構
// 管理圖片下載、存儲和版本控制

import { LocationService } from './locationService.js';

export class R2ImageService {
  constructor(db, googleMapsApiKey, r2Bucket = null) {
    if (!db) {
      throw new Error('Database connection is required for R2ImageService');
    }
    this.db = db;
    this.googleMapsApiKey = googleMapsApiKey;
    this.r2Bucket = r2Bucket;
    this.locationService = new LocationService(db, googleMapsApiKey);
  }

  /**
   * 下載並存儲圖片到 R2
   * @param {string} locationId - 地點 ID
   * @param {string} googlePlaceId - Google Place ID
   * @param {number} version - 圖片版本號（可選）
   * @returns {Promise<object>} 下載結果
   */
  async downloadAndStoreImage(locationId, googlePlaceId, version = null) {
    try {
      if (!this.r2Bucket) {
        console.warn('[R2ImageService] R2 bucket not configured, using fallback method');
        return await this.downloadAndStoreImageFallback(locationId, googlePlaceId);
      }

      // 1. 從 Google Places API 獲取圖片 URL
      const locationDetails = await this.locationService.fetchPlaceDetails(googlePlaceId);
      
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

      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // 3. 生成 R2 物件鍵（包含版本控制）
      const imageKey = this.generateImageKey(locationId, googlePlaceId, version);
      
      // 4. 上傳到 R2
      await this.r2Bucket.put(imageKey, imageBuffer, {
        httpMetadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=31536000' // 1 年緩存
        },
        customMetadata: {
          locationId: locationId,
          googlePlaceId: googlePlaceId,
          version: version ? version.toString() : '1',
          downloadedAt: new Date().toISOString()
        }
      });

      // 5. 生成公開 URL（使用 R2 公開 URL 或自定義域名）
      const publicUrl = this.getPublicUrl(imageKey);
      
      // 6. 更新資料庫
      await this.updateLocationThumbnail(locationId, publicUrl, version);
      
      // 7. 記錄下載歷史
      await this.recordDownloadHistory(locationId, googlePlaceId, googleImageUrl, publicUrl, imageBuffer.byteLength, contentType);

      return {
        success: true,
        url: publicUrl,
        key: imageKey,
        size: imageBuffer.byteLength,
        contentType: contentType
      };
    } catch (error) {
      console.error('[R2ImageService] Error downloading and storing image:', error);
      throw error;
    }
  }

  /**
   * 降級方案：如果 R2 不可用，使用資料庫存儲
   */
  async downloadAndStoreImageFallback(locationId, googlePlaceId) {
    try {
      const locationDetails = await this.locationService.fetchPlaceDetails(googlePlaceId);
      
      if (!locationDetails || !locationDetails.photoUrls || locationDetails.photoUrls.length === 0) {
        return {
          success: false,
          message: 'No photos available from Google Places API'
        };
      }

      const googleImageUrl = locationDetails.photoUrls[0];
      const imageResponse = await fetch(googleImageUrl);
      
      if (!imageResponse.ok) {
        return {
          success: false,
          message: 'Failed to download image'
        };
      }

      // 使用代理 URL 作為降級方案
      const proxyUrl = `/api/image/proxy/?url=${encodeURIComponent(googleImageUrl)}`;
      
      await this.updateLocationThumbnail(locationId, proxyUrl, null);
      
      return {
        success: true,
        url: proxyUrl,
        key: null,
        size: 0,
        contentType: imageResponse.headers.get('content-type') || 'image/jpeg'
      };
    } catch (error) {
      console.error('[R2ImageService] Error in fallback method:', error);
      throw error;
    }
  }

  /**
   * 生成圖片鍵（用於 R2 存儲）
   * @param {string} locationId - 地點 ID
   * @param {string} googlePlaceId - Google Place ID
   * @param {number} version - 版本號
   * @returns {string}
   */
  generateImageKey(locationId, googlePlaceId, version = null) {
    const timestamp = Date.now();
    const versionStr = version ? `v${version}` : 'v1';
    return `locations/${locationId}/${googlePlaceId}_${versionStr}_${timestamp}.jpg`;
  }

  /**
   * 獲取公開 URL
   * @param {string} key - R2 物件鍵
   * @returns {string}
   */
  getPublicUrl(key) {
    // 如果配置了自定義域名，使用自定義域名
    // 否則使用 R2 公開 URL
    // 這裡先返回代理 URL，實際應該配置 R2 公開訪問
    return `/api/image/r2/${encodeURIComponent(key)}`;
  }

  /**
   * 更新地點縮圖
   * @param {string} locationId - 地點 ID
   * @param {string} thumbnailUrl - 縮圖 URL
   * @param {number} version - 版本號
   */
  async updateLocationThumbnail(locationId, thumbnailUrl, version) {
    try {
      await this.db.prepare(
        `UPDATE locations 
         SET thumbnail_url = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).bind(thumbnailUrl, locationId).run();

      // 如果提供了版本號，記錄版本資訊
      if (version) {
        await this.db.prepare(
          `INSERT OR REPLACE INTO image_versions (location_id, version, url, created_at)
           VALUES (?, ?, ?, datetime('now'))`
        ).bind(locationId, version, thumbnailUrl).run();
      }
    } catch (error) {
      console.error('[R2ImageService] Error updating thumbnail:', error);
      throw error;
    }
  }

  /**
   * 記錄下載歷史
   */
  async recordDownloadHistory(locationId, googlePlaceId, originalUrl, localUrl, fileSize, contentType) {
    try {
      await this.db.prepare(
        `INSERT INTO image_download_history 
         (google_place_id, location_id, original_url, local_url, downloaded_at, file_size, content_type)
         VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`
      ).bind(googlePlaceId, locationId, originalUrl, localUrl, fileSize, contentType).run();
    } catch (error) {
      console.error('[R2ImageService] Error recording download history:', error);
      // 不拋出錯誤，因為這不是關鍵操作
    }
  }

  /**
   * 獲取圖片版本列表
   * @param {string} locationId - 地點 ID
   * @returns {Promise<array>}
   */
  async getImageVersions(locationId) {
    try {
      const result = await this.db.prepare(
        `SELECT version, url, created_at
         FROM image_versions
         WHERE location_id = ?
         ORDER BY version DESC`
      ).bind(locationId).all();

      return result.results || [];
    } catch (error) {
      console.error('[R2ImageService] Error getting image versions:', error);
      return [];
    }
  }

  /**
   * 獲取需要更新的圖片列表（過期或缺失的圖片）
   * @param {number} limit - 數量限制
   * @returns {Promise<array>}
   */
  async getImagesNeedingUpdate(limit = 50) {
    try {
      // 獲取沒有縮圖或縮圖過期的地點
      const result = await this.db.prepare(
        `SELECT l.id, l.google_place_id, l.thumbnail_url, l.updated_at
         FROM locations l
         WHERE l.google_place_id IS NOT NULL
           AND (
             l.thumbnail_url IS NULL 
             OR l.thumbnail_url = ''
             OR l.updated_at < datetime('now', '-30 days')
           )
         ORDER BY l.updated_at ASC NULLS FIRST
         LIMIT ?`
      ).bind(limit).all();

      return result.results || [];
    } catch (error) {
      console.error('[R2ImageService] Error getting images needing update:', error);
      return [];
    }
  }

  /**
   * 批量更新圖片
   * @param {number} batchSize - 批次大小
   * @returns {Promise<object>} 更新結果
   */
  async batchUpdateImages(batchSize = 10) {
    try {
      const imagesToUpdate = await this.getImagesNeedingUpdate(batchSize);
      const results = {
        total: imagesToUpdate.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (const image of imagesToUpdate) {
        try {
          const result = await this.downloadAndStoreImage(
            image.id,
            image.google_place_id,
            null // 使用當前版本
          );
          
          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push({
              locationId: image.id,
              error: result.message
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            locationId: image.id,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('[R2ImageService] Error in batch update:', error);
      throw error;
    }
  }

  /**
   * 從 R2 獲取圖片
   * @param {string} key - R2 物件鍵
   * @returns {Promise<Response|null>}
   */
  async getImageFromR2(key) {
    try {
      if (!this.r2Bucket) {
        return null;
      }

      const object = await this.r2Bucket.get(key);
      if (!object) {
        return null;
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
          'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000'
        }
      });
    } catch (error) {
      console.error('[R2ImageService] Error getting image from R2:', error);
      return null;
    }
  }
}

