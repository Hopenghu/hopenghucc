// StoryModule - Story 模組服務
// 基於「人、事、時、地、物」哲學架構
// 整合 Story 物件和相關功能

import { Story } from '../models/Story.js';
import { ObjectRelations } from '../models/ObjectRelations.js';
import { TimeModule } from '../modules/TimeModule.js';
import { ActionModule } from '../modules/ActionModule.js';

export class StoryModule {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for StoryModule');
    }
    this.db = db;
    this.relations = new ObjectRelations(db);
    this.timeModule = new TimeModule();
    this.actionModule = new ActionModule();
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
      // 驗證行動類型
      if (!this.actionModule.isValidActionType(actionType)) {
        throw new Error(`Invalid action type: ${actionType}`);
      }

      // 使用 ObjectRelations 創建故事
      const story = await this.relations.createStory(personId, locationId, actionType, description);
      
      return story;
    } catch (error) {
      console.error('[StoryModule] Error creating story:', error);
      throw error;
    }
  }

  /**
   * 獲取完整的 Story（包含 Person 和 Location）
   * @param {string} storyId - Story ID
   * @returns {Promise<object|null>}
   */
  async getFullStory(storyId) {
    try {
      const story = await this.relations.getFullStory(storyId);
      if (!story) return null;

      // 豐富故事資料
      return {
        ...story.toJSON(),
        timeDescription: this.timeModule.getStoryTimeDescription(story),
        actionName: this.actionModule.getActionTypeName(story.action_type),
        actionIcon: this.actionModule.getActionTypeIcon(story.action_type),
        actionColor: this.actionModule.getActionTypeColor(story.action_type),
        actionDescription: this.actionModule.generateActionDescription(
          story.action_type,
          story._location?.name
        )
      };
    } catch (error) {
      console.error('[StoryModule] Error getting full story:', error);
      throw error;
    }
  }

  /**
   * 獲取 Person 的故事時間線
   * @param {string} personId - Person ID
   * @param {string} actionType - 可選，篩選行動類型
   * @returns {Promise<array>}
   */
  async getPersonTimeline(personId, actionType = null) {
    try {
      const timeline = await this.relations.getPersonTimeline(personId);
      
      // 如果指定了行動類型，過濾
      let stories = timeline;
      if (actionType) {
        stories = this.actionModule.filterStoriesByAction(timeline, actionType);
      }

      // 豐富故事資料
      return stories.map(story => ({
        ...story.toJSON(),
        timeDescription: this.timeModule.getStoryTimeDescription(story),
        actionName: this.actionModule.getActionTypeName(story.action_type),
        actionIcon: this.actionModule.getActionTypeIcon(story.action_type),
        actionColor: this.actionModule.getActionTypeColor(story.action_type),
        actionDescription: this.actionModule.generateActionDescription(
          story.action_type,
          story._location?.name
        )
      }));
    } catch (error) {
      console.error('[StoryModule] Error getting person timeline:', error);
      throw error;
    }
  }

  /**
   * 獲取 Location 的故事
   * @param {string} locationId - Location ID
   * @param {string} actionType - 可選，篩選行動類型
   * @returns {Promise<array>}
   */
  async getLocationStories(locationId, actionType = null) {
    try {
      const stories = await this.relations.getLocationStories(locationId, actionType);
      
      // 豐富故事資料
      return stories.map(story => ({
        ...story.toJSON(),
        timeDescription: this.timeModule.getStoryTimeDescription(story),
        actionName: this.actionModule.getActionTypeName(story.action_type),
        actionIcon: this.actionModule.getActionTypeIcon(story.action_type),
        actionColor: this.actionModule.getActionTypeColor(story.action_type)
      }));
    } catch (error) {
      console.error('[StoryModule] Error getting location stories:', error);
      throw error;
    }
  }

  /**
   * 獲取故事統計
   * @param {string} personId - 可選，Person ID
   * @param {string} locationId - 可選，Location ID
   * @returns {Promise<object>}
   */
  async getStoryStatistics(personId = null, locationId = null) {
    try {
      let stories = [];

      if (personId) {
        stories = await this.relations.getPersonStories(personId);
      } else if (locationId) {
        stories = await this.relations.getLocationStories(locationId);
      } else {
        throw new Error('Either personId or locationId must be provided');
      }

      // 使用 ActionModule 獲取統計
      const actionStats = this.actionModule.getActionStatistics(stories);

      // 時間統計
      const timeStats = {
        total: stories.length,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0
      };

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      stories.forEach(story => {
        const storyTime = story.created_at ? new Date(story.created_at) : null;
        if (storyTime) {
          if (storyTime >= weekAgo) timeStats.thisWeek++;
          if (storyTime >= monthAgo) timeStats.thisMonth++;
          if (storyTime >= yearAgo) timeStats.thisYear++;
        }
      });

      return {
        actionStats,
        timeStats
      };
    } catch (error) {
      console.error('[StoryModule] Error getting story statistics:', error);
      throw error;
    }
  }

  /**
   * 更新 Story
   * @param {string} storyId - Story ID
   * @param {object} updates - 要更新的欄位
   * @returns {Promise<Story>}
   */
  async updateStory(storyId, updates) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (updates.user_description !== undefined) {
        updateFields.push('user_description = ?');
        updateValues.push(updates.user_description);
      }

      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }

      if (updateFields.length === 0) {
        return await this.relations.getFullStory(storyId);
      }

      updateFields.push('updated_at = datetime("now")');
      updateValues.push(storyId);

      const sql = `UPDATE user_locations SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.db.prepare(sql).bind(...updateValues).run();

      return await this.relations.getFullStory(storyId);
    } catch (error) {
      console.error('[StoryModule] Error updating story:', error);
      throw error;
    }
  }
}

