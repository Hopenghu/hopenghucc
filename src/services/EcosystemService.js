/**
 * EcosystemService - 生態平衡服務
 * 監控和評估網站的生態健康狀況
 * 符合「服務生命，讓世界更好更平衡」的理念
 * 
 * 理念對應：
 * - 「去處理，活在世界的生物」: 監控用戶福祉
 * - 「有更好的生活」: 追蹤用戶滿意度和體驗
 * - 「世界是球、更好更平衡」: 確保資源使用平衡、社區健康
 */

export class EcosystemService {
  /**
   * 創建生態平衡服務實例
   * @param {Object} db - 數據庫連接
   * @param {Object} options - 可選配置
   */
  constructor(db, options = {}) {
    if (!db) {
      throw new Error('Database connection is required for EcosystemService');
    }
    
    this.db = db;
    this.options = {
      enableLogging: options.enableLogging ?? true,
      enableCaching: options.enableCaching ?? true,
      cacheTTL: options.cacheTTL ?? 3600000, // 1 小時
      ...options
    };
    
    // 緩存
    this._cache = new Map();
    this._cacheTimestamps = new Map();
  }

  /**
   * 追蹤用戶福祉（User Wellbeing）
   * 符合「有更好的生活」理念
   * 
   * @param {string} userId - 用戶 ID
   * @param {Object} metrics - 福祉指標
   * @returns {Promise<Object>} 追蹤結果
   */
  async trackUserWellbeing(userId, metrics = {}) {
    try {
      const wellbeingData = {
        userId,
        satisfaction: metrics.satisfaction || null,
        engagement: metrics.engagement || null,
        experience: metrics.experience || null,
        timestamp: new Date().toISOString(),
        metadata: metrics.metadata || {}
      };

      // 儲存到數據庫（如果表存在）
      try {
        await this.db.prepare(
          `INSERT INTO user_wellbeing_tracking 
           (user_id, satisfaction_score, engagement_score, experience_score, tracked_at, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          userId,
          wellbeingData.satisfaction,
          wellbeingData.engagement,
          wellbeingData.experience,
          wellbeingData.timestamp,
          JSON.stringify(wellbeingData.metadata)
        ).run();
      } catch (error) {
        // 表可能不存在，記錄但不中斷
        if (this.options.enableLogging) {
          console.warn('[EcosystemService] Wellbeing tracking table may not exist:', error.message);
        }
      }

      return {
        success: true,
        data: wellbeingData
      };
    } catch (error) {
      console.error('[EcosystemService] Error tracking user wellbeing:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶福祉指標
   * @param {string} userId - 用戶 ID
   * @param {Object} options - 查詢選項
   * @returns {Promise<Object>} 福祉指標
   */
  async getUserWellbeing(userId, options = {}) {
    const cacheKey = `wellbeing_${userId}_${JSON.stringify(options)}`;
    
    // 檢查緩存
    if (this.options.enableCaching && this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      const timestamp = this._cacheTimestamps.get(cacheKey);
      const age = Date.now() - timestamp;
      
      if (age < this.options.cacheTTL) {
        return cached;
      }
    }

    try {
      const limit = options.limit || 30;
      const days = options.days || 30;
      
      // 查詢最近的福祉數據
      const result = await this.db.prepare(
        `SELECT 
           AVG(satisfaction_score) as avg_satisfaction,
           AVG(engagement_score) as avg_engagement,
           AVG(experience_score) as avg_experience,
           COUNT(*) as tracking_count
         FROM user_wellbeing_tracking
         WHERE user_id = ? 
           AND tracked_at >= datetime('now', '-' || ? || ' days')
         LIMIT ?`
      ).bind(userId, days, limit).first();

      const wellbeing = {
        userId,
        averageSatisfaction: result?.avg_satisfaction || null,
        averageEngagement: result?.avg_engagement || null,
        averageExperience: result?.avg_experience || null,
        trackingCount: result?.tracking_count || 0,
        period: `${days} days`,
        timestamp: new Date().toISOString()
      };

      // 緩存結果
      if (this.options.enableCaching) {
        this._cache.set(cacheKey, wellbeing);
        this._cacheTimestamps.set(cacheKey, Date.now());
      }

      return wellbeing;
    } catch (error) {
      // 表可能不存在，返回預設值
      if (this.options.enableLogging) {
        console.warn('[EcosystemService] Wellbeing table may not exist:', error.message);
      }
      
      return {
        userId,
        averageSatisfaction: null,
        averageEngagement: null,
        averageExperience: null,
        trackingCount: 0,
        period: `${options.days || 30} days`,
        timestamp: new Date().toISOString(),
        note: 'Data not available'
      };
    }
  }

  /**
   * 追蹤資源使用（Resource Usage）
   * 符合「世界是球、更好更平衡」理念
   * 
   * @param {Object} usage - 資源使用數據
   * @returns {Promise<Object>} 追蹤結果
   */
  async trackResourceUsage(usage = {}) {
    try {
      const resourceData = {
        apiCalls: usage.apiCalls || 0,
        aiCalls: usage.aiCalls || 0,
        storage: usage.storage || 0,
        bandwidth: usage.bandwidth || 0,
        cost: usage.cost || 0,
        timestamp: new Date().toISOString(),
        metadata: usage.metadata || {}
      };

      // 儲存到數據庫（如果表存在）
      try {
        await this.db.prepare(
          `INSERT INTO resource_usage_tracking 
           (api_calls, ai_calls, storage_mb, bandwidth_mb, cost_usd, tracked_at, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          resourceData.apiCalls,
          resourceData.aiCalls,
          resourceData.storage,
          resourceData.bandwidth,
          resourceData.cost,
          resourceData.timestamp,
          JSON.stringify(resourceData.metadata)
        ).run();
      } catch (error) {
        if (this.options.enableLogging) {
          console.warn('[EcosystemService] Resource usage table may not exist:', error.message);
        }
      }

      return {
        success: true,
        data: resourceData
      };
    } catch (error) {
      console.error('[EcosystemService] Error tracking resource usage:', error);
      throw error;
    }
  }

  /**
   * 獲取資源使用統計
   * @param {Object} options - 查詢選項
   * @returns {Promise<Object>} 資源使用統計
   */
  async getResourceUsage(options = {}) {
    const cacheKey = `resource_${JSON.stringify(options)}`;
    
    // 檢查緩存
    if (this.options.enableCaching && this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      const timestamp = this._cacheTimestamps.get(cacheKey);
      const age = Date.now() - timestamp;
      
      if (age < this.options.cacheTTL) {
        return cached;
      }
    }

    try {
      const days = options.days || 7;
      
      const result = await this.db.prepare(
        `SELECT 
           SUM(api_calls) as total_api_calls,
           SUM(ai_calls) as total_ai_calls,
           AVG(storage_mb) as avg_storage,
           SUM(bandwidth_mb) as total_bandwidth,
           SUM(cost_usd) as total_cost
         FROM resource_usage_tracking
         WHERE tracked_at >= datetime('now', '-' || ? || ' days')`
      ).bind(days).first();

      const usage = {
        period: `${days} days`,
        totalApiCalls: result?.total_api_calls || 0,
        totalAiCalls: result?.total_ai_calls || 0,
        averageStorage: result?.avg_storage || 0,
        totalBandwidth: result?.total_bandwidth || 0,
        totalCost: result?.total_cost || 0,
        timestamp: new Date().toISOString()
      };

      // 緩存結果
      if (this.options.enableCaching) {
        this._cache.set(cacheKey, usage);
        this._cacheTimestamps.set(cacheKey, Date.now());
      }

      return usage;
    } catch (error) {
      if (this.options.enableLogging) {
        console.warn('[EcosystemService] Resource usage table may not exist:', error.message);
      }
      
      return {
        period: `${options.days || 7} days`,
        totalApiCalls: 0,
        totalAiCalls: 0,
        averageStorage: 0,
        totalBandwidth: 0,
        totalCost: 0,
        timestamp: new Date().toISOString(),
        note: 'Data not available'
      };
    }
  }

  /**
   * 追蹤社區健康（Community Health）
   * 符合「更好更平衡」理念
   * 
   * @param {Object} metrics - 社區指標
   * @returns {Promise<Object>} 追蹤結果
   */
  async trackCommunityHealth(metrics = {}) {
    try {
      const healthData = {
        activeUsers: metrics.activeUsers || 0,
        interactions: metrics.interactions || 0,
        contentDiversity: metrics.contentDiversity || 0,
        engagementRate: metrics.engagementRate || 0,
        timestamp: new Date().toISOString(),
        metadata: metrics.metadata || {}
      };

      // 儲存到數據庫（如果表存在）
      try {
        await this.db.prepare(
          `INSERT INTO community_health_tracking 
           (active_users, interactions, content_diversity, engagement_rate, tracked_at, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          healthData.activeUsers,
          healthData.interactions,
          healthData.contentDiversity,
          healthData.engagementRate,
          healthData.timestamp,
          JSON.stringify(healthData.metadata)
        ).run();
      } catch (error) {
        if (this.options.enableLogging) {
          console.warn('[EcosystemService] Community health table may not exist:', error.message);
        }
      }

      return {
        success: true,
        data: healthData
      };
    } catch (error) {
      console.error('[EcosystemService] Error tracking community health:', error);
      throw error;
    }
  }

  /**
   * 獲取社區健康指標
   * @param {Object} options - 查詢選項
   * @returns {Promise<Object>} 社區健康指標
   */
  async getCommunityHealth(options = {}) {
    const cacheKey = `community_${JSON.stringify(options)}`;
    
    // 檢查緩存
    if (this.options.enableCaching && this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      const timestamp = this._cacheTimestamps.get(cacheKey);
      const age = Date.now() - timestamp;
      
      if (age < this.options.cacheTTL) {
        return cached;
      }
    }

    try {
      const days = options.days || 7;
      
      const result = await this.db.prepare(
        `SELECT 
           AVG(active_users) as avg_active_users,
           SUM(interactions) as total_interactions,
           AVG(content_diversity) as avg_diversity,
           AVG(engagement_rate) as avg_engagement_rate
         FROM community_health_tracking
         WHERE tracked_at >= datetime('now', '-' || ? || ' days')`
      ).bind(days).first();

      const health = {
        period: `${days} days`,
        averageActiveUsers: result?.avg_active_users || 0,
        totalInteractions: result?.total_interactions || 0,
        averageDiversity: result?.avg_diversity || 0,
        averageEngagementRate: result?.avg_engagement_rate || 0,
        healthScore: this._calculateHealthScore(result),
        timestamp: new Date().toISOString()
      };

      // 緩存結果
      if (this.options.enableCaching) {
        this._cache.set(cacheKey, health);
        this._cacheTimestamps.set(cacheKey, Date.now());
      }

      return health;
    } catch (error) {
      if (this.options.enableLogging) {
        console.warn('[EcosystemService] Community health table may not exist:', error.message);
      }
      
      return {
        period: `${options.days || 7} days`,
        averageActiveUsers: 0,
        totalInteractions: 0,
        averageDiversity: 0,
        averageEngagementRate: 0,
        healthScore: 0,
        timestamp: new Date().toISOString(),
        note: 'Data not available'
      };
    }
  }

  /**
   * 計算健康分數
   * @param {Object} metrics - 指標數據
   * @returns {number} 健康分數 (0-100)
   * @private
   */
  _calculateHealthScore(metrics) {
    if (!metrics) return 0;
    
    // 簡單的健康分數計算
    // 可以根據實際需求改進
    const diversity = (metrics.avg_diversity || 0) * 30;
    const engagement = (metrics.avg_engagement_rate || 0) * 40;
    const activity = Math.min((metrics.avg_active_users || 0) / 100, 1) * 30;
    
    return Math.min(Math.round(diversity + engagement + activity), 100);
  }

  /**
   * 獲取完整的生態系統報告
   * @param {Object} options - 查詢選項
   * @returns {Promise<Object>} 生態系統報告
   */
  async getEcosystemReport(options = {}) {
    const [wellbeing, resourceUsage, communityHealth] = await Promise.all([
      this.getUserWellbeing(null, options), // 整體用戶福祉
      this.getResourceUsage(options),
      this.getCommunityHealth(options)
    ]);

    return {
      period: options.days || 7,
      wellbeing: wellbeing,
      resourceUsage: resourceUsage,
      communityHealth: communityHealth,
      overallScore: this._calculateOverallScore(wellbeing, resourceUsage, communityHealth),
      timestamp: new Date().toISOString(),
      recommendations: this._generateRecommendations(wellbeing, resourceUsage, communityHealth)
    };
  }

  /**
   * 計算總體分數
   * @param {Object} wellbeing - 福祉數據
   * @param {Object} resourceUsage - 資源使用數據
   * @param {Object} communityHealth - 社區健康數據
   * @returns {number} 總體分數 (0-100)
   * @private
   */
  _calculateOverallScore(wellbeing, resourceUsage, communityHealth) {
    // 簡單的總體分數計算
    // 可以根據實際需求改進
    const wellbeingScore = (wellbeing.averageSatisfaction || 0) * 0.4;
    const resourceScore = resourceUsage.totalCost > 0 
      ? Math.max(0, 100 - (resourceUsage.totalCost / 100)) * 0.3
      : 50 * 0.3;
    const healthScore = (communityHealth.healthScore || 0) * 0.3;
    
    return Math.min(Math.round(wellbeingScore + resourceScore + healthScore), 100);
  }

  /**
   * 生成改進建議
   * @param {Object} wellbeing - 福祉數據
   * @param {Object} resourceUsage - 資源使用數據
   * @param {Object} communityHealth - 社區健康數據
   * @returns {Array} 建議列表
   * @private
   */
  _generateRecommendations(wellbeing, resourceUsage, communityHealth) {
    const recommendations = [];
    
    // 基於福祉的建議
    if (wellbeing.averageSatisfaction && wellbeing.averageSatisfaction < 70) {
      recommendations.push({
        type: 'wellbeing',
        priority: 'high',
        message: '用戶滿意度較低，建議改進用戶體驗',
        action: 'review_user_feedback'
      });
    }
    
    // 基於資源使用的建議
    if (resourceUsage.totalCost > 100) {
      recommendations.push({
        type: 'resource',
        priority: 'medium',
        message: '資源使用成本較高，建議優化 API 調用',
        action: 'optimize_api_usage'
      });
    }
    
    // 基於社區健康的建議
    if (communityHealth.healthScore && communityHealth.healthScore < 60) {
      recommendations.push({
        type: 'community',
        priority: 'high',
        message: '社區健康度較低，建議增加用戶互動',
        action: 'improve_engagement'
      });
    }
    
    return recommendations;
  }

  /**
   * 清除緩存
   */
  clearCache() {
    this._cache.clear();
    this._cacheTimestamps.clear();
  }
}

