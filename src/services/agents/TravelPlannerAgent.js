/**
 * TravelPlannerAgent - 行程規劃 AI Agent
 * 專門處理行程規劃相關的 AI 任務
 * 符合「讓 AI 變成程式」的理念
 */

import { BaseAgent } from './BaseAgent.js';

export class TravelPlannerAgent extends BaseAgent {
  /**
   * 創建行程規劃 Agent
   * @param {Object} aiService - AIService 實例
   * @param {Object} config - Agent 配置
   */
  constructor(aiService, config = {}) {
    super(aiService, {
      mode: 'traveler', // 預設使用旅客模式（Gemini）
      ...config
    });
  }

  /**
   * 執行行程規劃
   * @param {Object} input - 輸入數據
   *   - userId: 用戶 ID
   *   - sessionId: 會話 ID
   *   - query: 用戶查詢
   *   - context: 上下文信息（可選）
   * @returns {Promise<Object>} 規劃結果
   */
  async _execute(input) {
    const { userId, sessionId, query, context = {} } = input;
    
    if (!query) {
      throw new Error('Query is required for TravelPlannerAgent');
    }

    // 使用 AI Service 處理查詢
    const result = await this.aiService.handleQuery(
      userId,
      sessionId,
      query,
      this.config.mode || 'traveler',
      context.ctx
    );

    return {
      success: true,
      message: result.message || result.response,
      suggestions: this._extractSuggestions(result),
      metadata: {
        agentType: 'TravelPlannerAgent',
        mode: this.config.mode,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 從 AI 回應中提取建議
   * @param {Object} result - AI 回應結果
   * @returns {Array} 建議列表
   * @private
   */
  _extractSuggestions(result) {
    // 簡單的建議提取邏輯
    // 可以根據實際需求改進
    const suggestions = [];
    const message = result.message || result.response || '';
    
    // 提取地點建議（簡單實現）
    const locationPatterns = [
      /推薦.*?([\u4e00-\u9fa5]+)/g,
      /可以去.*?([\u4e00-\u9fa5]+)/g,
      /([\u4e00-\u9fa5]+).*?不錯/g
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 1) {
          suggestions.push({
            type: 'location',
            value: match[1],
            confidence: 0.7
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * 優化行程
   * @param {Object} itinerary - 行程數據
   * @param {Object} preferences - 用戶偏好
   * @returns {Promise<Object>} 優化後的行程
   */
  async optimizeItinerary(itinerary, preferences = {}) {
    const query = `請優化以下行程：${JSON.stringify(itinerary)}。偏好：${JSON.stringify(preferences)}`;
    
    return await this.execute({
      userId: preferences.userId,
      sessionId: preferences.sessionId || `session_${Date.now()}`,
      query,
      context: preferences
    });
  }
}

