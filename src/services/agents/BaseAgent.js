/**
 * BaseAgent - AI Agent 基類
 * 所有 AI Agent 的基礎類，定義統一的接口和通用功能
 * 符合「讓 AI 變成程式」的理念
 */

export class BaseAgent {
  /**
   * 創建 AI Agent 實例
   * @param {Object} aiService - AIService 實例
   * @param {Object} config - Agent 配置
   */
  constructor(aiService, config = {}) {
    if (!aiService) {
      throw new Error('AIService is required for BaseAgent');
    }
    
    this.aiService = aiService;
    this.config = {
      mode: config.mode || null, // 'traveler' 或 'resident'
      context: config.context || {},
      options: config.options || {},
      ...config
    };
    
    // Agent 狀態
    this.state = {
      initialized: false,
      lastUsed: null,
      usageCount: 0
    };
  }

  /**
   * 初始化 Agent
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.state.initialized) {
      return;
    }
    
    await this._onInitialize();
    this.state.initialized = true;
    this.state.lastUsed = new Date();
  }

  /**
   * 子類可以覆蓋此方法進行初始化
   * @protected
   */
  async _onInitialize() {
    // 預設為空，子類可以覆蓋
  }

  /**
   * 執行 Agent 的主要功能
   * @param {Object} input - 輸入數據
   * @returns {Promise<Object>} 執行結果
   */
  async execute(input) {
    if (!this.state.initialized) {
      await this.initialize();
    }
    
    this.state.usageCount++;
    this.state.lastUsed = new Date();
    
    try {
      return await this._execute(input);
    } catch (error) {
      console.error(`[${this.constructor.name}] Execution error:`, error);
      throw error;
    }
  }

  /**
   * 子類必須實現此方法
   * @param {Object} input - 輸入數據
   * @returns {Promise<Object>} 執行結果
   * @protected
   * @abstract
   */
  async _execute(input) {
    throw new Error('_execute method must be implemented by subclass');
  }

  /**
   * 獲取 Agent 狀態
   * @returns {Object} Agent 狀態
   */
  getState() {
    return {
      ...this.state,
      config: this.config,
      agentType: this.constructor.name
    };
  }

  /**
   * 重置 Agent 狀態
   */
  reset() {
    this.state.usageCount = 0;
    this.state.lastUsed = null;
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
}

