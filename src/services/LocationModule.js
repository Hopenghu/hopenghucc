// LocationModule - Location 模組服務
// 基於「人、事、時、地、物」哲學架構
// 整合 Location 物件和 LocationService

import { Location } from '../models/Location.js';
import { ObjectRelations } from '../models/ObjectRelations.js';
import { TimeModule } from '../modules/TimeModule.js';
import { ActionModule } from '../modules/ActionModule.js';
import { LocationService } from './LocationService.js';

export class LocationModule {
  constructor(db, googleMapsApiKey = null) {
    if (!db) {
      throw new Error('Database connection is required for LocationModule');
    }
    this.db = db;
    this.locationService = new LocationService(db, googleMapsApiKey);
    this.relations = new ObjectRelations(db);
    this.timeModule = new TimeModule();
    this.actionModule = new ActionModule();
  }

  /**
   * 根據 ID 獲取 Location
   * @param {string} locationId - Location ID
   * @param {string} userId - 可選，當前使用者 ID（用於包含使用者狀態）
   * @returns {Promise<Location|null>}
   */
  async getLocationById(locationId, userId = null) {
    try {
      const record = await this.db.prepare(
        'SELECT * FROM locations WHERE id = ?'
      ).bind(locationId).first();

      if (!record) return null;

      const location = Location.fromDbRecord(record);

      // 如果提供了使用者 ID，獲取使用者狀態
      if (userId) {
        const userLocation = await this.db.prepare(
          'SELECT status FROM user_locations WHERE user_id = ? AND location_id = ? LIMIT 1'
        ).bind(userId, locationId).first();

        if (userLocation) {
          location._user_status = userLocation.status;
        }
      }

      return location;
    } catch (error) {
      console.error('[LocationModule] Error getting location:', error);
      throw error;
    }
  }

  /**
   * 獲取 Location 的完整資訊（包含關聯資料）
   * @param {string} locationId - Location ID
   * @param {string} userId - 可選，當前使用者 ID
   * @returns {Promise<object>}
   */
  async getLocationProfile(locationId, userId = null) {
    try {
      const location = await this.getLocationById(locationId, userId);
      if (!location) return null;

      // 獲取相關的 Person（透過 Story）
      const persons = await this.relations.getLocationPersons(locationId);
      
      // 獲取故事
      const stories = await this.relations.getLocationStories(locationId);
      
      // 使用 TimeModule 和 ActionModule 豐富故事資料
      const enrichedStories = stories.map(story => ({
        ...story.toJSON(),
        timeDescription: this.timeModule.getStoryTimeDescription(story),
        actionName: this.actionModule.getActionTypeName(story.action_type),
        actionIcon: this.actionModule.getActionTypeIcon(story.action_type),
        actionColor: this.actionModule.getActionTypeColor(story.action_type)
      }));

      // 獲取互動統計
      const stats = await this.relations.getLocationStats(locationId);
      const actionStats = this.actionModule.getActionStatistics(stories);

      return {
        location: location.toJSON(userId),
        relatedPersons: persons.map(p => p.toJSON()),
        stories: enrichedStories,
        statistics: {
          ...stats,
          actionStats: actionStats
        }
      };
    } catch (error) {
      console.error('[LocationModule] Error getting location profile:', error);
      throw error;
    }
  }

  /**
   * 創建新的 Location（使用 LocationService）
   * @param {object} locationData - 地點資料
   * @param {string} createdBy - 創建者 Person ID
   * @returns {Promise<Location>}
   */
  async createLocation(locationData, createdBy = null) {
    try {
      // 使用現有的 LocationService 創建地點
      const result = await this.locationService.createLocation(locationData, createdBy);
      
      if (!result || !result.id) {
        throw new Error('Failed to create location');
      }

      return await this.getLocationById(result.id);
    } catch (error) {
      console.error('[LocationModule] Error creating location:', error);
      throw error;
    }
  }

  /**
   * 更新 Location 資訊
   * @param {string} locationId - Location ID
   * @param {object} updates - 要更新的欄位
   * @returns {Promise<Location>}
   */
  async updateLocation(locationId, updates) {
    try {
      // 使用現有的 LocationService 更新地點
      await this.locationService.updateLocation(locationId, updates);
      
      return await this.getLocationById(locationId);
    } catch (error) {
      console.error('[LocationModule] Error updating location:', error);
      throw error;
    }
  }

  /**
   * 獲取分頁的地點列表
   * @param {number} limit - 每頁數量
   * @param {number} offset - 偏移量
   * @param {string} userId - 可選，當前使用者 ID
   * @returns {Promise<{locations: Location[], total: number}>}
   */
  async getLocationsPaginated(limit = 12, offset = 0, userId = null) {
    try {
      // 使用現有的 LocationService
      const result = await this.locationService.getLocationsPaginated(limit, offset, userId);
      
      // 轉換為 Location 物件
      const locations = result.locations.map(record => Location.fromDbRecord(record));
      
      return {
        locations,
        total: result.total || locations.length,
        hasMore: result.hasMore || false
      };
    } catch (error) {
      console.error('[LocationModule] Error getting paginated locations:', error);
      throw error;
    }
  }
}

