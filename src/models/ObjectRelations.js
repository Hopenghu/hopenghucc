// ObjectRelations - 物件關係管理
// 基於「人、事、時、地、物」哲學架構
// 管理 Person、Location、Story 之間的關係

import { Person } from './Person.js';
import { Location } from './Location.js';
import { Story } from './Story.js';

export class ObjectRelations {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for ObjectRelations');
    }
    this.db = db;
  }

  /**
   * 獲取 Person 的所有 Location（透過 Story）
   * @param {string} personId - Person ID
   * @param {string} actionType - 可選，篩選行動類型
   * @returns {Promise<Location[]>}
   */
  async getPersonLocations(personId, actionType = null) {
    try {
      let query = `
        SELECT DISTINCT l.*
        FROM locations l
        INNER JOIN user_locations ul ON l.id = ul.location_id
        WHERE ul.user_id = ?
      `;
      
      const params = [personId];
      
      if (actionType) {
        query += ' AND ul.status = ?';
        params.push(actionType);
      }
      
      query += ' ORDER BY ul.created_at DESC';
      
      const result = await this.db.prepare(query).bind(...params).all();
      
      return result.results.map(record => Location.fromDbRecord(record));
    } catch (error) {
      console.error('[ObjectRelations] Error getting person locations:', error);
      throw error;
    }
  }

  /**
   * 獲取 Person 的所有 Story
   * @param {string} personId - Person ID
   * @param {string} actionType - 可選，篩選行動類型
   * @returns {Promise<Story[]>}
   */
  async getPersonStories(personId, actionType = null) {
    try {
      let query = `
        SELECT ul.*, l.name as location_name, l.address as location_address
        FROM user_locations ul
        INNER JOIN locations l ON ul.location_id = l.id
        WHERE ul.user_id = ?
      `;
      
      const params = [personId];
      
      if (actionType) {
        query += ' AND ul.status = ?';
        params.push(actionType);
      }
      
      query += ' ORDER BY ul.created_at DESC';
      
      const result = await this.db.prepare(query).bind(...params).all();
      
      return result.results.map(record => Story.fromUserLocationRecord(record));
    } catch (error) {
      console.error('[ObjectRelations] Error getting person stories:', error);
      throw error;
    }
  }

  /**
   * 獲取 Location 的所有 Person（透過 Story）
   * @param {string} locationId - Location ID
   * @param {string} actionType - 可選，篩選行動類型
   * @returns {Promise<Person[]>}
   */
  async getLocationPersons(locationId, actionType = null) {
    try {
      let query = `
        SELECT DISTINCT u.*
        FROM users u
        INNER JOIN user_locations ul ON u.id = ul.user_id
        WHERE ul.location_id = ?
      `;
      
      const params = [locationId];
      
      if (actionType) {
        query += ' AND ul.status = ?';
        params.push(actionType);
      }
      
      query += ' ORDER BY ul.created_at DESC';
      
      const result = await this.db.prepare(query).bind(...params).all();
      
      return result.results.map(record => Person.fromDbRecord(record));
    } catch (error) {
      console.error('[ObjectRelations] Error getting location persons:', error);
      throw error;
    }
  }

  /**
   * 獲取 Location 的所有 Story
   * @param {string} locationId - Location ID
   * @param {string} actionType - 可選，篩選行動類型
   * @returns {Promise<Story[]>}
   */
  async getLocationStories(locationId, actionType = null) {
    try {
      let query = `
        SELECT ul.*
        FROM user_locations ul
        WHERE ul.location_id = ?
      `;
      
      const params = [locationId];
      
      if (actionType) {
        query += ' AND ul.status = ?';
        params.push(actionType);
      }
      
      query += ' ORDER BY ul.created_at DESC';
      
      const result = await this.db.prepare(query).bind(...params).all();
      
      return result.results.map(record => Story.fromUserLocationRecord(record));
    } catch (error) {
      console.error('[ObjectRelations] Error getting location stories:', error);
      throw error;
    }
  }

  /**
   * 創建新的 Story（人 + 時 + 地 + 事）
   * @param {string} personId - Person ID
   * @param {string} locationId - Location ID
   * @param {string} actionType - 行動類型
   * @param {string} description - 可選，描述
   * @returns {Promise<Story>}
   */
  async createStory(personId, locationId, actionType, description = null) {
    try {
      // 檢查是否已存在相同的 story
      const existing = await this.db.prepare(
        `SELECT * FROM user_locations 
         WHERE user_id = ? AND location_id = ? AND status = ?`
      ).bind(personId, locationId, actionType).first();

      if (existing) {
        // 更新現有記錄
        await this.db.prepare(
          `UPDATE user_locations 
           SET user_description = ?, updated_at = datetime('now')
           WHERE id = ?`
        ).bind(description, existing.id).run();
        
        return Story.fromUserLocationRecord({
          ...existing,
          user_description: description,
          updated_at: new Date().toISOString()
        });
      }

      // 創建新記錄
      const result = await this.db.prepare(
        `INSERT INTO user_locations (user_id, location_id, status, user_description, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(personId, locationId, actionType, description).run();

      if (!result.meta.last_row_id) {
        throw new Error('Failed to create story');
      }

      const newRecord = await this.db.prepare(
        `SELECT * FROM user_locations WHERE id = ?`
      ).bind(result.meta.last_row_id).first();

      return Story.fromUserLocationRecord(newRecord);
    } catch (error) {
      console.error('[ObjectRelations] Error creating story:', error);
      throw error;
    }
  }

  /**
   * 獲取完整的故事（包含 Person 和 Location 物件）
   * @param {string} storyId - Story ID
   * @returns {Promise<Story|null>}
   */
  async getFullStory(storyId) {
    try {
      const storyRecord = await this.db.prepare(
        `SELECT ul.* FROM user_locations ul WHERE ul.id = ?`
      ).bind(storyId).first();

      if (!storyRecord) return null;

      const story = Story.fromUserLocationRecord(storyRecord);

      // 載入關聯的 Person
      const personRecord = await this.db.prepare(
        `SELECT * FROM users WHERE id = ?`
      ).bind(story.person_id).first();
      if (personRecord) {
        story._person = Person.fromDbRecord(personRecord);
      }

      // 載入關聯的 Location
      const locationRecord = await this.db.prepare(
        `SELECT * FROM locations WHERE id = ?`
      ).bind(story.location_id).first();
      if (locationRecord) {
        story._location = Location.fromDbRecord(locationRecord);
      }

      return story;
    } catch (error) {
      console.error('[ObjectRelations] Error getting full story:', error);
      throw error;
    }
  }

  /**
   * 獲取 Person 的故事時間線
   * @param {string} personId - Person ID
   * @returns {Promise<Story[]>} 按時間排序的故事陣列
   */
  async getPersonTimeline(personId) {
    try {
      const stories = await this.getPersonStories(personId);
      
      // 按時間排序（最新的在前）
      return stories.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
    } catch (error) {
      console.error('[ObjectRelations] Error getting person timeline:', error);
      throw error;
    }
  }

  /**
   * 獲取 Location 的互動統計
   * @param {string} locationId - Location ID
   * @returns {Promise<object>} 統計資訊
   */
  async getLocationStats(locationId) {
    try {
      const result = await this.db.prepare(
        `SELECT 
          status,
          COUNT(*) as count
         FROM user_locations
         WHERE location_id = ?
         GROUP BY status`
      ).bind(locationId).all();

      const stats = {
        visited: 0,
        want_to_visit: 0,
        want_to_revisit: 0,
        total: 0
      };

      result.results.forEach(row => {
        const status = row.status;
        const count = row.count || 0;
        stats[status] = count;
        stats.total += count;
      });

      return stats;
    } catch (error) {
      console.error('[ObjectRelations] Error getting location stats:', error);
      throw error;
    }
  }
}

