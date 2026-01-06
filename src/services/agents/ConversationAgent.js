/**
 * ConversationAgent - 對話 AI Agent
 * 專門處理一般對話和問答任務
 * 符合「程式要判斷的事 → 交給 AI」的理念
 */

import { BaseAgent } from './BaseAgent.js';

export class ConversationAgent extends BaseAgent {
  /**
   * 創建對話 Agent
   * @param {Object} aiService - AIService 實例
   * @param {Object} config - Agent 配置
   */
  constructor(aiService, config = {}) {
    super(aiService, {
      mode: null, // 自動判斷模式
      ...config
    });
  }

  /**
   * 執行對話
   * @param {Object} input - 輸入數據
   *   - userId: 用戶 ID
   *   - sessionId: 會話 ID
   *   - message: 用戶訊息
   *   - context: 上下文信息（可選）
   * @returns {Promise<Object>} 對話結果
   */
  async _execute(input) {
    const { userId, sessionId, message, context = {} } = input;
    
    if (!message) {
      throw new Error('Message is required for ConversationAgent');
    }

    // 使用 AI Service 處理對話
    const result = await this.aiService.handleQuery(
      userId,
      sessionId,
      message,
      this.config.mode || null, // 自動判斷模式
      context.ctx
    );

    return {
      success: true,
      response: result.message || result.response,
      sessionId: result.sessionId || sessionId,
      metadata: {
        agentType: 'ConversationAgent',
        mode: result.mode || this.config.mode,
        timestamp: new Date().toISOString(),
        relationshipDepth: result.relationshipDepth || null
      }
    };
  }

  /**
   * 繼續對話
   * @param {string} sessionId - 會話 ID
   * @param {string} message - 用戶訊息
   * @param {string} userId - 用戶 ID（可選）
   * @returns {Promise<Object>} 對話結果
   */
  async continueConversation(sessionId, message, userId = null) {
    return await this.execute({
      userId,
      sessionId,
      message,
      context: {}
    });
  }

  /**
   * 獲取對話歷史
   * @param {string} sessionId - 會話 ID
   * @param {number} limit - 限制數量
   * @returns {Promise<Array>} 對話歷史
   */
  async getConversationHistory(sessionId, limit = 50) {
    try {
      const result = await this.aiService.db.prepare(
        `SELECT message_type, message_content, created_at
         FROM ai_conversations
         WHERE session_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      ).bind(sessionId, limit).all();

      return result.results || [];
    } catch (error) {
      console.error('[ConversationAgent] Error getting conversation history:', error);
      return [];
    }
  }
}

