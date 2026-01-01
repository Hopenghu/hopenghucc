// RecommendationService - 推薦系統服務
// 基於「人、事、時、地、物」哲學架構
// 提供個性化地點推薦

import { StoryModule } from './StoryModule.js';
import { LocationModule } from './LocationModule.js';
import { PersonModule } from './PersonModule.js';

export class RecommendationService {
  constructor(db, googleMapsApiKey = null) {
    if (!db) {
      throw new Error('Database connection is required for RecommendationService');
    }
    this.db = db;
    this.storyModule = new StoryModule(db);
    this.locationModule = new LocationModule(db, googleMapsApiKey);
    this.personModule = new PersonModule(db);
  }

  /**
   * 基於用戶故事推薦相關地點
   * @param {string} userId - 用戶 ID
   * @param {number} limit - 推薦數量（預設 10）
   * @returns {Promise<array>} 推薦地點陣列
   */
  async recommendLocationsByStories(userId, limit = 10) {
    try {
      // 1. 獲取用戶的故事
      const userStories = await this.storyModule.getPersonTimeline(userId);
      
      if (userStories.length === 0) {
        // 如果沒有故事，返回熱門地點
        return await this.getPopularLocations(limit);
      }

      // 2. 分析用戶偏好
      const userPreferences = this.analyzeUserPreferences(userStories);
      
      // 3. 基於偏好推薦地點
      const recommendations = await this.getRecommendationsByPreferences(
        userPreferences,
        userStories,
        limit
      );

      return recommendations;
    } catch (error) {
      console.error('[RecommendationService] Error recommending by stories:', error);
      throw error;
    }
  }

  /**
   * 分析用戶偏好
   * @param {array} stories - 用戶故事陣列
   * @returns {object} 用戶偏好物件
   */
  analyzeUserPreferences(stories) {
    const preferences = {
      visitedTypes: {}, // 訪問過的地點類型
      preferredTypes: {}, // 偏好的地點類型
      visitedLocations: new Set(), // 已訪問的地點 ID
      actionWeights: {
        visited: 3, // 來過權重最高
        want_to_revisit: 2, // 想再來次之
        want_to_visit: 1 // 想來權重最低
      }
    };

    stories.forEach(story => {
      const actionType = story.action_type || story.status;
      const weight = preferences.actionWeights[actionType] || 1;
      
      // 記錄已訪問的地點
      if (story.location_id) {
        preferences.visitedLocations.add(story.location_id);
      }

      // 分析地點類型偏好
      if (story._location && story._location.googleTypes) {
        const types = Array.isArray(story._location.googleTypes) 
          ? story._location.googleTypes 
          : JSON.parse(story._location.googleTypes || '[]');
        
        types.forEach(type => {
          if (!preferences.preferredTypes[type]) {
            preferences.preferredTypes[type] = 0;
          }
          preferences.preferredTypes[type] += weight;
        });
      }
    });

    return preferences;
  }

  /**
   * 基於偏好獲取推薦
   * @param {object} preferences - 用戶偏好
   * @param {array} userStories - 用戶故事
   * @param {number} limit - 推薦數量
   * @returns {Promise<array>}
   */
  async getRecommendationsByPreferences(preferences, userStories, limit) {
    try {
      // 1. 獲取所有地點（排除已訪問的）
      const allLocations = await this.locationModule.getLocationsPaginated(100, 0);
      const candidateLocations = allLocations.locations.filter(
        loc => !preferences.visitedLocations.has(loc.id)
      );

      // 2. 計算每個地點的推薦分數
      const scoredLocations = await Promise.all(
        candidateLocations.map(async (location) => {
          const score = await this.calculateRecommendationScore(
            location,
            preferences,
            userStories
          );
          return { location, score };
        })
      );

      // 3. 按分數排序並返回前 N 個
      return scoredLocations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          ...item.location.toJSON(),
          recommendation_score: item.score,
          recommendation_reason: this.generateRecommendationReason(
            item.location,
            item.score,
            preferences
          )
        }));
    } catch (error) {
      console.error('[RecommendationService] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * 計算推薦分數
   * @param {object} location - Location 物件
   * @param {object} preferences - 用戶偏好
   * @param {array} userStories - 用戶故事
   * @returns {Promise<number>} 推薦分數
   */
  async calculateRecommendationScore(location, preferences, userStories) {
    let score = 0;

    // 1. 類型匹配分數（0-40 分）
    if (location.googleTypes) {
      const types = Array.isArray(location.googleTypes)
        ? location.googleTypes
        : JSON.parse(location.googleTypes || '[]');
      
      types.forEach(type => {
        const typeScore = preferences.preferredTypes[type] || 0;
        score += typeScore * 2; // 類型匹配加權
      });
      
      // 限制類型分數不超過 40
      score = Math.min(score, 40);
    }

    // 2. 評分分數（0-30 分）
    if (location.google_rating) {
      score += (location.google_rating / 5) * 30;
    }

    // 3. 評分人數分數（0-15 分）
    if (location.google_user_ratings_total) {
      const ratingCountScore = Math.min(
        Math.log10(location.google_user_ratings_total + 1) * 5,
        15
      );
      score += ratingCountScore;
    }

    // 4. 相似用戶推薦分數（0-15 分）- 協同過濾
    const similarUserScore = await this.getSimilarUserScore(location, userStories);
    score += similarUserScore;

    return Math.round(score * 100) / 100; // 保留兩位小數
  }

  /**
   * 獲取相似用戶推薦分數（協同過濾）
   * @param {object} location - Location 物件
   * @param {array} userStories - 當前用戶故事
   * @returns {Promise<number>} 相似用戶分數（0-15）
   */
  async getSimilarUserScore(location, userStories) {
    try {
      // 獲取訪問過此地點的其他用戶
      const otherUsersStories = await this.db.prepare(
        `SELECT DISTINCT user_id 
         FROM user_locations 
         WHERE location_id = ? AND status = 'visited'`
      ).bind(location.id).all();

      if (otherUsersStories.results.length === 0) {
        return 0;
      }

      // 計算相似度
      let totalSimilarity = 0;
      let count = 0;

      for (const otherUser of otherUsersStories.results.slice(0, 10)) {
        // 獲取其他用戶的故事
        const otherUserStories = await this.storyModule.getPersonTimeline(otherUser.user_id);
        
        // 計算相似度（基於共同訪問的地點）
        const similarity = this.calculateUserSimilarity(userStories, otherUserStories);
        
        if (similarity > 0) {
          totalSimilarity += similarity;
          count++;
        }
      }

      if (count === 0) {
        return 0;
      }

      // 返回平均相似度分數（0-15）
      const avgSimilarity = totalSimilarity / count;
      return Math.min(avgSimilarity * 15, 15);
    } catch (error) {
      console.error('[RecommendationService] Error getting similar user score:', error);
      return 0;
    }
  }

  /**
   * 計算用戶相似度
   * @param {array} user1Stories - 用戶1的故事
   * @param {array} user2Stories - 用戶2的故事
   * @returns {number} 相似度（0-1）
   */
  calculateUserSimilarity(user1Stories, user2Stories) {
    if (user1Stories.length === 0 || user2Stories.length === 0) {
      return 0;
    }

    const user1Locations = new Set(
      user1Stories.map(s => s.location_id).filter(Boolean)
    );
    const user2Locations = new Set(
      user2Stories.map(s => s.location_id).filter(Boolean)
    );

    // 計算交集和並集
    const intersection = new Set(
      [...user1Locations].filter(x => user2Locations.has(x))
    );
    const union = new Set([...user1Locations, ...user2Locations]);

    // Jaccard 相似度
    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * 生成推薦理由
   * @param {object} location - Location 物件
   * @param {number} score - 推薦分數
   * @param {object} preferences - 用戶偏好
   * @returns {string} 推薦理由
   */
  generateRecommendationReason(location, score, preferences) {
    const reasons = [];

    // 類型匹配
    if (location.googleTypes) {
      const types = Array.isArray(location.googleTypes)
        ? location.googleTypes
        : JSON.parse(location.googleTypes || '[]');
      
      const matchedTypes = types.filter(type => preferences.preferredTypes[type] > 0);
      if (matchedTypes.length > 0) {
        reasons.push(`符合您喜歡的${matchedTypes[0]}類型`);
      }
    }

    // 高評分
    if (location.google_rating && location.google_rating >= 4.5) {
      reasons.push('評分很高');
    }

    // 多人評分
    if (location.google_user_ratings_total && location.google_user_ratings_total > 100) {
      reasons.push('受到多人推薦');
    }

    return reasons.length > 0 ? reasons.join('、') : '推薦給您';
  }

  /**
   * 獲取熱門地點（用於新用戶或無故事用戶）
   * @param {number} limit - 數量
   * @returns {Promise<array>}
   */
  async getPopularLocations(limit = 10) {
    try {
      const result = await this.db.prepare(
        `SELECT l.*, 
                COUNT(ul.id) as visit_count,
                AVG(l.google_rating) as avg_rating
         FROM locations l
         LEFT JOIN user_locations ul ON l.id = ul.location_id AND ul.status = 'visited'
         WHERE l.google_rating IS NOT NULL
         GROUP BY l.id
         ORDER BY visit_count DESC, avg_rating DESC
         LIMIT ?`
      ).bind(limit).all();

      const { Location } = await import('../models/Location.js');
      return result.results.map(record => {
        const location = Location.fromDbRecord(record);
        return {
          ...location.toJSON(),
          recommendation_score: 50, // 預設分數
          recommendation_reason: '熱門地點'
        };
      });
    } catch (error) {
      console.error('[RecommendationService] Error getting popular locations:', error);
      throw error;
    }
  }

  /**
   * 基於地點相似度推薦
   * @param {string} locationId - 參考地點 ID
   * @param {number} limit - 推薦數量
   * @returns {Promise<array>}
   */
  async recommendSimilarLocations(locationId, limit = 5) {
    try {
      const referenceLocation = await this.locationModule.getLocationById(locationId);
      if (!referenceLocation) {
        return [];
      }

      const allLocations = await this.locationModule.getLocationsPaginated(100, 0);
      const candidateLocations = allLocations.locations.filter(
        loc => loc.id !== locationId
      );

      // 計算相似度
      const scoredLocations = await Promise.all(
        candidateLocations.map(async (location) => {
          const similarity = this.calculateLocationSimilarity(referenceLocation, location);
          return { location, similarity };
        })
      );

      return scoredLocations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => ({
          ...item.location.toJSON(),
          recommendation_score: item.similarity * 100,
          recommendation_reason: `與${referenceLocation.name}相似`
        }));
    } catch (error) {
      console.error('[RecommendationService] Error recommending similar locations:', error);
      throw error;
    }
  }

  /**
   * 計算地點相似度
   * @param {object} location1 - 地點1
   * @param {object} location2 - 地點2
   * @returns {number} 相似度（0-1）
   */
  calculateLocationSimilarity(location1, location2) {
    let similarity = 0;
    let factors = 0;

    // 類型相似度
    if (location1.googleTypes && location2.googleTypes) {
      const types1 = Array.isArray(location1.googleTypes)
        ? location1.googleTypes
        : JSON.parse(location1.googleTypes || '[]');
      const types2 = Array.isArray(location2.googleTypes)
        ? location2.googleTypes
        : JSON.parse(location2.googleTypes || '[]');
      
      const intersection = types1.filter(t => types2.includes(t));
      const union = [...new Set([...types1, ...types2])];
      
      if (union.length > 0) {
        similarity += (intersection.length / union.length) * 0.6;
        factors++;
      }
    }

    // 評分相似度
    if (location1.google_rating && location2.google_rating) {
      const ratingDiff = Math.abs(location1.google_rating - location2.google_rating);
      similarity += (1 - ratingDiff / 5) * 0.4;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }
}

