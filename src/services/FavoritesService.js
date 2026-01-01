// FavoritesService - 收藏服務
// 基於「人、事、時、地、物」哲學架構
// 管理用戶收藏、評分和評論功能

import { Location } from '../models/Location.js';
import { Person } from '../models/Person.js';

export class FavoritesService {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for FavoritesService');
    }
    this.db = db;
  }

  /**
   * 添加收藏
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @returns {Promise<boolean>} 是否成功
   */
  async addFavorite(userId, locationId) {
    try {
      const result = await this.db.prepare(
        `INSERT INTO location_favorites (user_id, location_id, created_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(user_id, location_id) DO NOTHING`
      ).bind(userId, locationId).run();

      return result.meta.changes > 0;
    } catch (error) {
      console.error('[FavoritesService] Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * 移除收藏
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @returns {Promise<boolean>} 是否成功
   */
  async removeFavorite(userId, locationId) {
    try {
      const result = await this.db.prepare(
        `DELETE FROM location_favorites 
         WHERE user_id = ? AND location_id = ?`
      ).bind(userId, locationId).run();

      return result.meta.changes > 0;
    } catch (error) {
      console.error('[FavoritesService] Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * 切換收藏狀態
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @returns {Promise<boolean>} 新的收藏狀態（true = 已收藏）
   */
  async toggleFavorite(userId, locationId) {
    try {
      const isFavorited = await this.isFavorited(userId, locationId);
      
      if (isFavorited) {
        await this.removeFavorite(userId, locationId);
        return false;
      } else {
        await this.addFavorite(userId, locationId);
        return true;
      }
    } catch (error) {
      console.error('[FavoritesService] Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * 檢查是否已收藏
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @returns {Promise<boolean>}
   */
  async isFavorited(userId, locationId) {
    try {
      const result = await this.db.prepare(
        `SELECT 1 FROM location_favorites 
         WHERE user_id = ? AND location_id = ? 
         LIMIT 1`
      ).bind(userId, locationId).first();

      return !!result;
    } catch (error) {
      console.error('[FavoritesService] Error checking favorite:', error);
      throw error;
    }
  }

  /**
   * 批量檢查多個地點的收藏狀態
   * 優化 N+1 查詢問題
   * @param {string} userId - 用戶 ID
   * @param {Array<string>} locationIds - 地點 ID 陣列
   * @returns {Promise<object>} 以 locationId 為 key 的布林值對象
   */
  async getBatchFavoriteStatuses(userId, locationIds) {
    if (!userId || !locationIds || locationIds.length === 0) {
      return {};
    }

    try {
      // 使用 IN 子句批量查詢
      const placeholders = locationIds.map(() => '?').join(',');
      const stmt = this.db.prepare(
        `SELECT location_id
         FROM location_favorites
         WHERE user_id = ? AND location_id IN (${placeholders})`
      );
      const { results } = await stmt.bind(userId, ...locationIds).all();
      
      // 構建收藏狀態映射
      const favoriteMap = {};
      if (results) {
        results.forEach(row => {
          favoriteMap[row.location_id] = true;
        });
      }
      
      // 確保所有地點都有狀態（未收藏的為 false）
      locationIds.forEach(id => {
        if (!(id in favoriteMap)) {
          favoriteMap[id] = false;
        }
      });
      
      return favoriteMap;
    } catch (error) {
      console.error('[FavoritesService] Error getting batch favorite statuses:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶的所有收藏
   * @param {string} userId - 用戶 ID
   * @param {number} limit - 數量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<object>}
   */
  async getUserFavorites(userId, limit = 20, offset = 0) {
    try {
      const result = await this.db.prepare(
        `SELECT l.*, lf.created_at as favorited_at
         FROM location_favorites lf
         JOIN locations l ON lf.location_id = l.id
         WHERE lf.user_id = ?
         ORDER BY lf.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(userId, limit, offset).all();

      const totalResult = await this.db.prepare(
        `SELECT COUNT(*) as total 
         FROM location_favorites 
         WHERE user_id = ?`
      ).bind(userId).first();

      return {
        locations: result.results.map(record => Location.fromDbRecord(record).toJSON()),
        total: totalResult?.total || 0,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < (totalResult?.total || 0)
      };
    } catch (error) {
      console.error('[FavoritesService] Error getting user favorites:', error);
      throw error;
    }
  }

  /**
   * 添加評分
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @param {number} rating - 評分（1-5）
   * @param {string} comment - 可選評論
   * @returns {Promise<boolean>}
   */
  async addRating(userId, locationId, rating, comment = null) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const result = await this.db.prepare(
        `INSERT INTO location_ratings (user_id, location_id, rating, comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(user_id, location_id) DO UPDATE SET
           rating = excluded.rating,
           comment = excluded.comment,
           updated_at = datetime('now')`
      ).bind(userId, locationId, rating, comment).run();

      return result.meta.changes > 0;
    } catch (error) {
      console.error('[FavoritesService] Error adding rating:', error);
      throw error;
    }
  }

  /**
   * 獲取地點的平均評分
   * @param {string} locationId - 地點 ID
   * @returns {Promise<object>}
   */
  async getLocationRating(locationId) {
    try {
      const result = await this.db.prepare(
        `SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as rating_count,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
         FROM location_ratings
         WHERE location_id = ?`
      ).bind(locationId).first();

      return {
        averageRating: result?.average_rating ? parseFloat(result.average_rating.toFixed(2)) : null,
        ratingCount: result?.rating_count || 0,
        distribution: {
          5: result?.five_star || 0,
          4: result?.four_star || 0,
          3: result?.three_star || 0,
          2: result?.two_star || 0,
          1: result?.one_star || 0
        }
      };
    } catch (error) {
      console.error('[FavoritesService] Error getting location rating:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶對地點的評分
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @returns {Promise<object|null>}
   */
  async getUserRating(userId, locationId) {
    try {
      const result = await this.db.prepare(
        `SELECT rating, comment, created_at, updated_at
         FROM location_ratings
         WHERE user_id = ? AND location_id = ?`
      ).bind(userId, locationId).first();

      return result || null;
    } catch (error) {
      console.error('[FavoritesService] Error getting user rating:', error);
      throw error;
    }
  }

  /**
   * 添加評論
   * @param {string} userId - 用戶 ID
   * @param {string} locationId - 地點 ID
   * @param {string} content - 評論內容
   * @returns {Promise<string>} 評論 ID
   */
  async addComment(userId, locationId, content) {
    try {
      if (!content || !content.trim()) {
        throw new Error('Comment content is required');
      }

      const result = await this.db.prepare(
        `INSERT INTO location_comments (user_id, location_id, content, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(userId, locationId, content.trim()).run();

      return result.meta.last_row_id?.toString() || null;
    } catch (error) {
      console.error('[FavoritesService] Error adding comment:', error);
      throw error;
    }
  }

  /**
   * 獲取地點的評論
   * @param {string} locationId - 地點 ID
   * @param {number} limit - 數量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<object>}
   */
  async getLocationComments(locationId, limit = 20, offset = 0) {
    try {
      const result = await this.db.prepare(
        `SELECT lc.*, u.name as user_name, u.avatar_url as user_avatar_url
         FROM location_comments lc
         JOIN users u ON lc.user_id = u.id
         WHERE lc.location_id = ?
         ORDER BY lc.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(locationId, limit, offset).all();

      const totalResult = await this.db.prepare(
        `SELECT COUNT(*) as total 
         FROM location_comments 
         WHERE location_id = ?`
      ).bind(locationId).first();

      return {
        comments: result.results.map(record => ({
          id: record.id,
          userId: record.user_id,
          locationId: record.location_id,
          content: record.content,
          userName: record.user_name,
          userAvatarUrl: record.user_avatar_url,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        })),
        total: totalResult?.total || 0,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < (totalResult?.total || 0)
      };
    } catch (error) {
      console.error('[FavoritesService] Error getting location comments:', error);
      throw error;
    }
  }

  /**
   * 獲取地點的收藏數量
   * @param {string} locationId - 地點 ID
   * @returns {Promise<number>}
   */
  async getFavoriteCount(locationId) {
    try {
      const result = await this.db.prepare(
        `SELECT COUNT(*) as count 
         FROM location_favorites 
         WHERE location_id = ?`
      ).bind(locationId).first();

      return result?.count || 0;
    } catch (error) {
      console.error('[FavoritesService] Error getting favorite count:', error);
      throw error;
    }
  }
}

