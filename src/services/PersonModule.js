// PersonModule - Person 模組服務
// 基於「人、事、時、地、物」哲學架構
// 整合 Person 物件和相關功能

import { Person } from '../models/Person.js';
import { ObjectRelations } from '../models/ObjectRelations.js';
import { TimeModule } from '../modules/TimeModule.js';
import { ActionModule } from '../modules/ActionModule.js';

export class PersonModule {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for PersonModule');
    }
    this.db = db;
    this.relations = new ObjectRelations(db);
    this.timeModule = new TimeModule();
    this.actionModule = new ActionModule();
  }

  /**
   * 根據 ID 獲取 Person
   * @param {string} personId - Person ID
   * @returns {Promise<Person|null>}
   */
  async getPersonById(personId) {
    try {
      const record = await this.db.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(personId).first();

      return record ? Person.fromDbRecord(record) : null;
    } catch (error) {
      console.error('[PersonModule] Error getting person:', error);
      throw error;
    }
  }

  /**
   * 根據 Email 獲取 Person
   * @param {string} email - Email
   * @returns {Promise<Person|null>}
   */
  async getPersonByEmail(email) {
    try {
      const record = await this.db.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(email).first();

      return record ? Person.fromDbRecord(record) : null;
    } catch (error) {
      console.error('[PersonModule] Error getting person by email:', error);
      throw error;
    }
  }

  /**
   * 獲取 Person 的完整資訊（包含關聯資料）
   * @param {string} personId - Person ID
   * @returns {Promise<object>}
   */
  async getPersonProfile(personId) {
    try {
      const person = await this.getPersonById(personId);
      if (!person) return null;

      // 獲取相關地點
      const locations = await this.relations.getPersonLocations(personId);
      
      // 獲取故事時間線
      const timeline = await this.relations.getPersonTimeline(personId);
      
      // 使用 TimeModule 和 ActionModule 豐富故事資料
      const enrichedTimeline = timeline.map(story => ({
        ...story.toJSON(),
        timeDescription: this.timeModule.getStoryTimeDescription(story),
        actionName: this.actionModule.getActionTypeName(story.action_type),
        actionIcon: this.actionModule.getActionTypeIcon(story.action_type),
        actionColor: this.actionModule.getActionTypeColor(story.action_type)
      }));

      // 獲取行動統計
      const actionStats = this.actionModule.getActionStatistics(timeline);

      return {
        person: person.toJSON(),
        locations: locations.map(loc => loc.toJSON()),
        timeline: enrichedTimeline,
        statistics: {
          totalLocations: locations.length,
          totalStories: timeline.length,
          actionStats: actionStats
        }
      };
    } catch (error) {
      console.error('[PersonModule] Error getting person profile:', error);
      throw error;
    }
  }

  /**
   * 更新 Person 資訊
   * @param {string} personId - Person ID
   * @param {object} updates - 要更新的欄位
   * @returns {Promise<Person>}
   */
  async updatePerson(personId, updates) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }

      if (updates.avatar_url !== undefined) {
        updateFields.push('avatar_url = ?');
        updateValues.push(updates.avatar_url);
      }

      if (updates.user_type !== undefined) {
        updateFields.push('user_type = ?');
        updateValues.push(updates.user_type);
        updateFields.push('is_merchant = ?');
        updateValues.push(updates.user_type === 'merchant' ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return await this.getPersonById(personId);
      }

      updateFields.push('updated_at = datetime("now")');
      updateValues.push(personId);

      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.db.prepare(sql).bind(...updateValues).run();

      return await this.getPersonById(personId);
    } catch (error) {
      console.error('[PersonModule] Error updating person:', error);
      throw error;
    }
  }
}

