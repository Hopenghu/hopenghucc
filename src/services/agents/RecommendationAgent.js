/**
 * RecommendationAgent - 推薦 AI Agent
 * 專門處理推薦相關的 AI 任務
 * 符合「程式要判斷的事 → 交給 AI」的理念
 */

import { BaseAgent } from './BaseAgent.js';

export class RecommendationAgent extends BaseAgent {
  /**
   * 創建推薦 Agent
   * @param {Object} aiService - AIService 實例
   * @param {Object} recommendationService - RecommendationService 實例（可選）
   * @param {Object} config - Agent 配置
   */
  constructor(aiService, recommendationService = null, config = {}) {
    super(aiService, config);
    this.recommendationService = recommendationService;
  }

  /**
   * 執行推薦
   * @param {Object} input - 輸入數據
   *   - userId: 用戶 ID
   *   - sessionId: 會話 ID
   *   - query: 用戶查詢或偏好
   *   - context: 上下文信息（可選）
   * @returns {Promise<Object>} 推薦結果
   */
  async _execute(input) {
    const { userId, sessionId, query, context = {} } = input;
    
    // 如果有 RecommendationService，優先使用
    if (this.recommendationService) {
      try {
        const recommendations = await this.recommendationService.getRecommendations(
          userId,
          query,
          context
        );
        
        return {
          success: true,
          recommendations,
          source: 'RecommendationService',
          metadata: {
            agentType: 'RecommendationAgent',
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.warn('[RecommendationAgent] RecommendationService failed, falling back to AI:', error);
      }
    }

    // 回退到 AI 推薦
    const result = await this.aiService.handleQuery(
      userId,
      sessionId,
      `請根據以下需求推薦：${query}`,
      this.config.mode || null,
      context.ctx
    );

    return {
      success: true,
      recommendations: this._parseRecommendations(result),
      source: 'AIService',
      metadata: {
        agentType: 'RecommendationAgent',
        mode: this.config.mode,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 從 AI 回應中解析推薦
   * @param {Object} result - AI 回應結果
   * @returns {Array} 推薦列表
   * @private
   */
  _parseRecommendations(result) {
    const message = result.message || result.response || '';
    const recommendations = [];
    
    // 簡單的解析邏輯
    // 可以根據實際需求改進
    const lines = message.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 0 && (trimmed.includes('推薦') || trimmed.includes('建議'))) {
        recommendations.push({
          type: 'general',
          content: trimmed,
          confidence: 0.7
        });
      }
    });

    return recommendations;
  }

  /**
   * 個性化推薦
   * @param {string} userId - 用戶 ID
   * @param {Object} preferences - 用戶偏好
   * @returns {Promise<Object>} 個性化推薦
   */
  async getPersonalizedRecommendations(userId, preferences = {}) {
    const query = `根據我的偏好推薦：${JSON.stringify(preferences)}`;
    
    return await this.execute({
      userId,
      sessionId: `personalized_${Date.now()}`,
      query,
      context: { preferences }
    });
  }
}

