// SearchService - 搜尋服務
// 基於「人、事、時、地、物」哲學架構
// 提供地點搜尋、篩選和排序功能

import { Location } from '../models/Location.js';

export class SearchService {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for SearchService');
    }
    this.db = db;
  }

  /**
   * 搜尋地點
   * @param {string} query - 搜尋關鍵字
   * @param {object} filters - 篩選條件
   * @param {object} sortOptions - 排序選項
   * @param {number} limit - 結果數量
   * @param {number} offset - 偏移量
   * @returns {Promise<object>} 搜尋結果
   */
  async searchLocations(query, filters = {}, sortOptions = {}, limit = 20, offset = 0) {
    try {
      // 構建 SQL 查詢
      let sql = `
        SELECT l.*,
               COUNT(DISTINCT ul_visited.id) as visited_count,
               COUNT(DISTINCT ul_want.id) as want_to_visit_count
        FROM locations l
        LEFT JOIN user_locations ul_visited ON l.id = ul_visited.location_id AND ul_visited.status = 'visited'
        LEFT JOIN user_locations ul_want ON l.id = ul_want.location_id AND ul_want.status = 'want_to_visit'
        WHERE 1=1
      `;

      const params = [];

      // 關鍵字搜尋
      if (query && query.trim()) {
        const searchTerm = `%${query.trim()}%`;
        sql += ` AND (
          l.name LIKE ? OR
          l.address LIKE ? OR
          l.editorial_summary LIKE ?
        )`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // 類型篩選
      if (filters.types && filters.types.length > 0) {
        const typeConditions = filters.types.map(() => {
          return `l.google_types LIKE ?`;
        });
        sql += ` AND (${typeConditions.join(' OR ')})`;
        filters.types.forEach(type => {
          params.push(`%"${type}"%`);
        });
      }

      // 評分篩選
      if (filters.minRating !== undefined) {
        sql += ` AND l.google_rating >= ?`;
        params.push(filters.minRating);
      }

      // 營業狀態篩選
      if (filters.businessStatus) {
        sql += ` AND l.business_status = ?`;
        params.push(filters.businessStatus);
      }

      // 分組
      sql += ` GROUP BY l.id`;

      // 排序
      const sortBy = sortOptions.sortBy || 'relevance';
      const sortOrder = sortOptions.sortOrder || 'DESC';

      switch (sortBy) {
        case 'rating':
          sql += ` ORDER BY l.google_rating ${sortOrder} NULLS LAST`;
          break;
        case 'popularity':
          sql += ` ORDER BY visited_count ${sortOrder}, want_to_visit_count ${sortOrder}`;
          break;
        case 'name':
          sql += ` ORDER BY l.name ${sortOrder}`;
          break;
        case 'relevance':
        default:
          // 相關性排序：關鍵字匹配優先
          if (query && query.trim()) {
            sql += ` ORDER BY 
              CASE 
                WHEN l.name = ? THEN 1
                WHEN l.name LIKE ? THEN 2
                WHEN l.name LIKE ? THEN 3
                WHEN l.address LIKE ? THEN 4
                ELSE 5
              END,
              l.google_rating DESC NULLS LAST`;
            const exactMatch = query.trim();
            params.push(exactMatch, `${exactMatch}%`, `%${exactMatch}%`, `%${exactMatch}%`);
          } else {
            sql += ` ORDER BY l.google_rating DESC NULLS LAST, visited_count DESC`;
          }
          break;
      }

      // 分頁
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // 執行查詢
      const result = await this.db.prepare(sql).bind(...params).all();

      // 獲取總數
      const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT l.id) as total FROM')
                           .replace(/GROUP BY.*ORDER BY.*LIMIT.*OFFSET.*/, '');
      const countParams = params.slice(0, -2); // 移除 LIMIT 和 OFFSET 參數
      const countResult = await this.db.prepare(countSql).bind(...countParams).first();
      const total = countResult?.total || 0;

      // 轉換為 Location 物件
      const locations = result.results.map(record => {
        const location = Location.fromDbRecord(record);
        location.visited_count = record.visited_count || 0;
        location.want_to_visit_count = record.want_to_visit_count || 0;
        return location;
      });

      return {
        locations: locations.map(loc => loc.toJSON()),
        total: total,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('[SearchService] Error searching locations:', error);
      throw error;
    }
  }

  /**
   * 模糊搜尋地點名稱
   * @param {string} query - 搜尋關鍵字
   * @param {number} limit - 結果數量
   * @returns {Promise<array>} 地點陣列
   */
  async fuzzySearchLocationNames(query, limit = 10) {
    try {
      if (!query || !query.trim()) {
        return [];
      }

      const searchTerm = `%${query.trim()}%`;
      const result = await this.db.prepare(
        `SELECT id, name, address, google_types
         FROM locations
         WHERE name LIKE ? OR address LIKE ?
         ORDER BY 
           CASE 
             WHEN name = ? THEN 1
             WHEN name LIKE ? THEN 2
             ELSE 3
           END
         LIMIT ?`
      ).bind(
        searchTerm,
        searchTerm,
        query.trim(),
        `${query.trim()}%`,
        limit
      ).all();

      return result.results.map(record => ({
        id: record.id,
        name: record.name,
        address: record.address,
        types: record.google_types ? JSON.parse(record.google_types) : []
      }));
    } catch (error) {
      console.error('[SearchService] Error fuzzy searching:', error);
      throw error;
    }
  }

  /**
   * 獲取可用的搜尋篩選選項
   * @returns {Promise<object>} 篩選選項
   */
  async getSearchFilters() {
    try {
      // 獲取所有地點類型
      const typesResult = await this.db.prepare(
        `SELECT DISTINCT json_each.value as type
         FROM locations, json_each(google_types)
         WHERE google_types IS NOT NULL
         ORDER BY type`
      ).all();

      const types = typesResult.results.map(r => r.type).filter(Boolean);

      // 獲取評分範圍
      const ratingResult = await this.db.prepare(
        `SELECT 
          MIN(google_rating) as min_rating,
          MAX(google_rating) as max_rating,
          AVG(google_rating) as avg_rating
         FROM locations
         WHERE google_rating IS NOT NULL`
      ).first();

      return {
        types: types,
        ratingRange: {
          min: ratingResult?.min_rating || 0,
          max: ratingResult?.max_rating || 5,
          avg: ratingResult?.avg_rating || 0
        },
        businessStatuses: ['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY']
      };
    } catch (error) {
      console.error('[SearchService] Error getting search filters:', error);
      return {
        types: [],
        ratingRange: { min: 0, max: 5, avg: 0 },
        businessStatuses: []
      };
    }
  }

  /**
   * 獲取熱門搜尋關鍵字
   * @param {number} limit - 數量
   * @returns {Promise<array>} 關鍵字陣列
   */
  async getPopularSearchTerms(limit = 10) {
    try {
      // 這裡可以從搜尋記錄表中獲取，目前返回一些預設的熱門關鍵字
      const popularTerms = [
        '餐廳', '咖啡廳', '景點', '住宿', '海灘',
        '博物館', '公園', '夜市', '廟宇', '觀光'
      ];

      return popularTerms.slice(0, limit);
    } catch (error) {
      console.error('[SearchService] Error getting popular search terms:', error);
      return [];
    }
  }
}

