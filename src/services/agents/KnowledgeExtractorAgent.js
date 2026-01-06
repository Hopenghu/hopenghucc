/**
 * KnowledgeExtractorAgent - 知識提取 AI Agent
 * 專門處理從對話中提取知識的任務
 * 符合「人要做的事 → 教會 AI」的理念
 */

import { BaseAgent } from './BaseAgent.js';

export class KnowledgeExtractorAgent extends BaseAgent {
  /**
   * 創建知識提取 Agent
   * @param {Object} aiService - AIService 實例
   * @param {Object} config - Agent 配置
   */
  constructor(aiService, config = {}) {
    super(aiService, {
      mode: 'resident', // 預設使用居民模式（GPT）
      ...config
    });
  }

  /**
   * 執行知識提取
   * @param {Object} input - 輸入數據
   *   - userId: 用戶 ID
   *   - sessionId: 會話 ID
   *   - conversation: 對話內容
   *   - context: 上下文信息（可選）
   * @returns {Promise<Object>} 提取的知識
   */
  async _execute(input) {
    const { userId, sessionId, conversation, context = {} } = input;
    
    if (!conversation) {
      throw new Error('Conversation is required for KnowledgeExtractorAgent');
    }

    // 使用 AI Knowledge Service 提取知識
    const knowledgeService = this.aiService.knowledgeService;
    
    if (!knowledgeService) {
      throw new Error('AIKnowledgeService is not available');
    }

    // 提取知識
    const extractedKnowledge = await knowledgeService.processInteraction(
      userId,
      sessionId,
      conversation
    );

    return {
      success: true,
      knowledge: extractedKnowledge,
      metadata: {
        agentType: 'KnowledgeExtractorAgent',
        mode: this.config.mode,
        timestamp: new Date().toISOString(),
        userId,
        sessionId
      }
    };
  }

  /**
   * 驗證知識質量
   * @param {Object} knowledge - 知識對象
   * @returns {Promise<Object>} 驗證結果
   */
  async validateKnowledge(knowledge) {
    // 使用 AI 驗證知識質量
    const query = `請驗證以下知識的準確性和價值：${JSON.stringify(knowledge)}`;
    
    const result = await this.aiService.handleQuery(
      knowledge.userId,
      `validation_${Date.now()}`,
      query,
      'resident'
    );

    return {
      isValid: true, // 簡化實現，實際應該根據 AI 回應判斷
      confidence: 0.8,
      feedback: result.message || result.response,
      metadata: {
        validatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 批量提取知識
   * @param {Array} conversations - 對話列表
   * @returns {Promise<Array>} 提取的知識列表
   */
  async extractBatch(conversations) {
    const results = [];
    
    for (const conversation of conversations) {
      try {
        const result = await this.execute({
          userId: conversation.userId,
          sessionId: conversation.sessionId,
          conversation: conversation.content,
          context: conversation.context
        });
        results.push(result);
      } catch (error) {
        console.error(`[KnowledgeExtractorAgent] Error extracting from conversation:`, error);
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

