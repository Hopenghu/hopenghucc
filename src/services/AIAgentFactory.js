/**
 * AIAgentFactory - AI Agent 工廠類
 * 負責創建和管理 AI Agent 實例
 * 符合「讓 AI 變成程式」的理念
 * 
 * 理念對應：
 * - 「程式要判斷的事 → 交給 AI」: Agent 封裝 AI 判斷邏輯
 * - 「讓 AI 變成程式」: Agent 將 AI 能力模組化、可重用
 */

import { TravelPlannerAgent } from './agents/TravelPlannerAgent.js';
import { KnowledgeExtractorAgent } from './agents/KnowledgeExtractorAgent.js';
import { RecommendationAgent } from './agents/RecommendationAgent.js';
import { ConversationAgent } from './agents/ConversationAgent.js';

export class AIAgentFactory {
  /**
   * 創建 AI Agent 工廠實例
   * @param {Object} serviceFactory - ServiceFactory 實例
   * @param {Object} options - 可選配置
   */
  constructor(serviceFactory, options = {}) {
    if (!serviceFactory) {
      throw new Error('ServiceFactory is required for AIAgentFactory');
    }
    
    this.serviceFactory = serviceFactory;
    this.options = {
      enableLogging: options.enableLogging ?? true,
      enableCaching: options.enableCaching ?? true,
      ...options
    };
    
    // Agent 實例緩存（單例模式）
    this._agents = new Map();
    
    // 延遲初始化服務（避免循環依賴）
    this._aiService = null;
    this._recommendationService = null;
  }

  /**
   * 獲取 AIService（延遲初始化）
   * @returns {Object} AIService 實例
   * @private
   */
  _getAIService() {
    if (!this._aiService) {
      this._aiService = this.serviceFactory.getService('aiService');
    }
    return this._aiService;
  }

  /**
   * 獲取 RecommendationService（延遲初始化）
   * @returns {Object} RecommendationService 實例
   * @private
   */
  _getRecommendationService() {
    if (!this._recommendationService) {
      try {
        this._recommendationService = this.serviceFactory.getService('recommendationService');
      } catch (error) {
        // RecommendationService 可能不存在，返回 null
        if (this.options.enableLogging) {
          console.warn('[AIAgentFactory] RecommendationService not available:', error.message);
        }
        return null;
      }
    }
    return this._recommendationService;
  }

  /**
   * 創建 AI Agent
   * @param {string} agentType - Agent 類型
   * @param {Object} config - Agent 配置
   * @returns {Object} AI Agent 實例
   */
  createAgent(agentType, config = {}) {
    const cacheKey = `${agentType}_${JSON.stringify(config)}`;
    
    // 如果啟用緩存且已存在，返回緩存的實例
    if (this.options.enableCaching && this._agents.has(cacheKey)) {
      if (this.options.enableLogging) {
        console.log(`[AIAgentFactory] Returning cached agent: ${agentType}`);
      }
      return this._agents.get(cacheKey);
    }

    if (this.options.enableLogging) {
      console.log(`[AIAgentFactory] Creating agent: ${agentType}`);
    }

    const aiService = this._getAIService();
    let agent;

    try {
      switch (agentType) {
        case 'travel_planner':
        case 'travelPlanner':
          agent = new TravelPlannerAgent(aiService, config);
          break;

        case 'knowledge_extractor':
        case 'knowledgeExtractor':
          agent = new KnowledgeExtractorAgent(aiService, config);
          break;

        case 'recommendation':
        case 'recommendationEngine':
          const recommendationService = this._getRecommendationService();
          agent = new RecommendationAgent(aiService, recommendationService, config);
          break;

        case 'conversation':
        case 'conversationAgent':
          agent = new ConversationAgent(aiService, config);
          break;

        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }

      // 初始化 Agent
      agent.initialize().catch(error => {
        console.error(`[AIAgentFactory] Error initializing agent ${agentType}:`, error);
      });

      // 如果啟用緩存，保存實例
      if (this.options.enableCaching) {
        this._agents.set(cacheKey, agent);
      }

      return agent;
    } catch (error) {
      console.error(`[AIAgentFactory] Error creating agent ${agentType}:`, error);
      throw error;
    }
  }

  /**
   * 獲取或創建 Agent（單例模式）
   * @param {string} agentType - Agent 類型
   * @param {Object} config - Agent 配置
   * @returns {Object} AI Agent 實例
   */
  getAgent(agentType, config = {}) {
    return this.createAgent(agentType, config);
  }

  /**
   * 創建多個 Agent 並編排執行
   * @param {Array} agentConfigs - Agent 配置列表
   * @returns {Array} Agent 實例列表
   */
  createAgentChain(agentConfigs) {
    return agentConfigs.map(config => {
      const { type, ...agentConfig } = config;
      return this.createAgent(type, agentConfig);
    });
  }

  /**
   * 清除 Agent 緩存
   * @param {string} agentType - Agent 類型（可選，如果不提供則清除所有）
   */
  clearCache(agentType = null) {
    if (agentType) {
      // 清除特定類型的 Agent
      const keysToDelete = [];
      for (const [key, agent] of this._agents.entries()) {
        if (key.startsWith(agentType)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this._agents.delete(key));
    } else {
      // 清除所有緩存
      this._agents.clear();
    }
  }

  /**
   * 獲取所有 Agent 的狀態
   * @returns {Array} Agent 狀態列表
   */
  getAllAgentStates() {
    const states = [];
    for (const [key, agent] of this._agents.entries()) {
      states.push({
        cacheKey: key,
        state: agent.getState()
      });
    }
    return states;
  }

  /**
   * 獲取 Agent 統計信息
   * @returns {Object} 統計信息
   */
  getStats() {
    const stats = {
      totalAgents: this._agents.size,
      agentsByType: {},
      totalUsage: 0,
      lastUsed: null
    };

    for (const [key, agent] of this._agents.entries()) {
      const agentState = agent.getState();
      const type = agentState.agentType;
      
      if (!stats.agentsByType[type]) {
        stats.agentsByType[type] = {
          count: 0,
          totalUsage: 0
        };
      }
      
      stats.agentsByType[type].count++;
      stats.agentsByType[type].totalUsage += agentState.usageCount;
      stats.totalUsage += agentState.usageCount;
      
      if (!stats.lastUsed || agentState.lastUsed > stats.lastUsed) {
        stats.lastUsed = agentState.lastUsed;
      }
    }

    return stats;
  }
}

