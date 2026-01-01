// ImageScheduler - 圖片定期更新排程服務
// 基於「人、事、時、地、物」哲學架構
// 管理圖片定期更新任務

export class ImageScheduler {
  constructor(db, googleMapsApiKey, r2Bucket = null) {
    if (!db) {
      throw new Error('Database connection is required for ImageScheduler');
    }
    this.db = db;
    this.googleMapsApiKey = googleMapsApiKey;
    this.r2Bucket = r2Bucket;
  }

  /**
   * 執行定期圖片更新任務
   * @param {object} options - 選項
   * @returns {Promise<object>} 執行結果
   */
  async runScheduledUpdate(options = {}) {
    const {
      batchSize = 10,
      maxAge = 30, // 天數
      forceUpdate = false
    } = options;

    try {
      const { R2ImageService } = await import('./R2ImageService.js');
      const r2ImageService = new R2ImageService(this.db, this.googleMapsApiKey, this.r2Bucket);

      // 獲取需要更新的圖片
      const imagesToUpdate = await this.getImagesNeedingUpdate(maxAge, forceUpdate, batchSize);

      if (imagesToUpdate.length === 0) {
        return {
          success: true,
          message: 'No images need updating',
          total: 0,
          updated: 0,
          failed: 0
        };
      }

      const results = {
        total: imagesToUpdate.length,
        updated: 0,
        failed: 0,
        errors: []
      };

      // 批量更新
      for (const image of imagesToUpdate) {
        try {
          const result = await r2ImageService.downloadAndStoreImage(
            image.location_id,
            image.google_place_id,
            null // 使用當前版本
          );

          if (result.success) {
            results.updated++;
            console.log(`[ImageScheduler] Updated image for location: ${image.location_id}`);
          } else {
            results.failed++;
            results.errors.push({
              locationId: image.location_id,
              error: result.message
            });
          }

          // 避免過度請求，添加小延遲
          await this.delay(100);
        } catch (error) {
          results.failed++;
          results.errors.push({
            locationId: image.location_id,
            error: error.message
          });
          console.error(`[ImageScheduler] Error updating image for location ${image.location_id}:`, error);
        }
      }

      // 記錄任務執行歷史
      await this.recordSchedulerHistory(results);

      return {
        success: true,
        ...results,
        message: `Updated ${results.updated} out of ${results.total} images`
      };
    } catch (error) {
      console.error('[ImageScheduler] Error in scheduled update:', error);
      throw error;
    }
  }

  /**
   * 獲取需要更新的圖片列表
   * @param {number} maxAge - 最大天數
   * @param {boolean} forceUpdate - 是否強制更新
   * @param {number} limit - 數量限制
   * @returns {Promise<array>}
   */
  async getImagesNeedingUpdate(maxAge = 30, forceUpdate = false, limit = 50) {
    try {
      let query = `
        SELECT l.id as location_id, l.google_place_id, l.thumbnail_url, l.updated_at
        FROM locations l
        WHERE l.google_place_id IS NOT NULL
      `;

      if (forceUpdate) {
        // 強制更新：更新所有有 Google Place ID 的地點
        query += ` AND l.thumbnail_url IS NOT NULL AND l.thumbnail_url != ''`;
      } else {
        // 正常更新：只更新過期或缺失的圖片
        query += ` AND (
          l.thumbnail_url IS NULL 
          OR l.thumbnail_url = ''
          OR l.thumbnail_url LIKE '%maps.googleapis.com%'
          OR l.updated_at < datetime('now', '-${maxAge} days')
        )`;
      }

      query += ` ORDER BY l.updated_at ASC NULLS FIRST LIMIT ?`;

      const result = await this.db.prepare(query).bind(limit).all();
      return result.results || [];
    } catch (error) {
      console.error('[ImageScheduler] Error getting images needing update:', error);
      return [];
    }
  }

  /**
   * 記錄排程任務執行歷史
   * @param {object} results - 執行結果
   */
  async recordSchedulerHistory(results) {
    try {
      await this.db.prepare(
        `INSERT INTO scheduler_history 
         (task_type, total, success, failed, executed_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).bind('image_update', results.total, results.updated, results.failed).run();
    } catch (error) {
      console.error('[ImageScheduler] Error recording scheduler history:', error);
      // 不拋出錯誤，因為這不是關鍵操作
    }
  }

  /**
   * 獲取排程統計
   * @returns {Promise<object>}
   */
  async getSchedulerStats() {
    try {
      // 獲取最近一次執行記錄
      const lastRun = await this.db.prepare(
        `SELECT * FROM scheduler_history 
         WHERE task_type = 'image_update'
         ORDER BY executed_at DESC
         LIMIT 1`
      ).first();

      // 獲取需要更新的圖片數量
      const needsUpdate = await this.getImagesNeedingUpdate(30, false, 1000);
      const needsUpdateCount = needsUpdate.length;

      // 獲取總圖片數量
      const totalImages = await this.db.prepare(
        `SELECT COUNT(*) as count FROM locations WHERE google_place_id IS NOT NULL`
      ).first();

      return {
        lastRun: lastRun || null,
        needsUpdate: needsUpdateCount,
        totalImages: totalImages?.count || 0,
        nextScheduledRun: this.calculateNextRunTime()
      };
    } catch (error) {
      console.error('[ImageScheduler] Error getting scheduler stats:', error);
      return {
        lastRun: null,
        needsUpdate: 0,
        totalImages: 0,
        nextScheduledRun: null
      };
    }
  }

  /**
   * 計算下次執行時間（每天凌晨 2 點）
   * @returns {string}
   */
  calculateNextRunTime() {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(2, 0, 0, 0);
    
    // 如果已經過了今天的 2 點，則設定為明天的 2 點
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.toISOString();
  }

  /**
   * 延遲函數
   * @param {number} ms - 毫秒數
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

