/**
 * DevelopmentEnvironment - 開發環境配置類
 * 統一管理開發環境配置、工具和調試功能
 */
export class DevelopmentEnvironment {
  /**
   * 創建開發環境實例
   * @param {Object} env - 環境變數
   * @param {Object} options - 配置選項
   */
  constructor(env, options = {}) {
    this.env = env;
    this.isDevelopment = options.isDevelopment ?? false;
    this.enableDebugLogging = options.enableDebugLogging ?? this.isDevelopment;
    this.enablePerformanceMonitoring = options.enablePerformanceMonitoring ?? this.isDevelopment;
    
    // 性能監控數據
    this.performanceMetrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      serviceInitializationTime: 0
    };
  }

  /**
   * 記錄性能指標
   * @param {string} metric - 指標名稱
   * @param {number} value - 指標值
   */
  recordMetric(metric, value) {
    if (!this.enablePerformanceMonitoring) return;
    
    if (metric === 'responseTime') {
      this.performanceMetrics.requestCount++;
      const currentAvg = this.performanceMetrics.averageResponseTime;
      const count = this.performanceMetrics.requestCount;
      this.performanceMetrics.averageResponseTime = 
        (currentAvg * (count - 1) + value) / count;
    } else if (metric === 'error') {
      this.performanceMetrics.errorCount++;
    } else if (metric === 'serviceInit') {
      this.performanceMetrics.serviceInitializationTime = value;
    }
  }

  /**
   * 獲取性能報告
   * @returns {Object} 性能指標
   */
  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 開發環境日誌
   * @param {string} level - 日誌級別
   * @param {string} message - 日誌訊息
   * @param {Object} data - 附加數據
   */
  log(level, message, data = {}) {
    if (!this.enableDebugLogging) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    const logMethod = level === 'error' ? console.error :
                     level === 'warn' ? console.warn :
                     level === 'info' ? console.info :
                     console.log;
    
    logMethod(`[DEV ${level.toUpperCase()}] ${timestamp} - ${message}`, data);
  }

  /**
   * 驗證環境配置
   * @returns {Object} 驗證結果
   */
  validateEnvironment() {
    const issues = [];
    const warnings = [];
    
    // 檢查必需的環境變數
    if (!this.env.DB) {
      issues.push('Database connection (DB) is missing');
    }
    
    if (!this.env.GOOGLE_MAPS_API_KEY) {
      warnings.push('GOOGLE_MAPS_API_KEY is missing - Location features may not work');
    }
    
    if (!this.env.OPENAI_API_KEY) {
      warnings.push('OPENAI_API_KEY is missing - AI features may not work');
    }
    
    if (!this.env.GEMINI_API_KEY) {
      warnings.push('GEMINI_API_KEY is missing - Gemini AI features may not work');
    }
    
    if (!this.env.JWT_SECRET) {
      issues.push('JWT_SECRET is missing - Authentication will not work');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 獲取環境信息（不包含敏感數據）
   * @returns {Object} 環境信息
   */
  getEnvironmentInfo() {
    return {
      isDevelopment: this.isDevelopment,
      hasDatabase: !!this.env.DB,
      hasGoogleMapsKey: !!this.env.GOOGLE_MAPS_API_KEY,
      hasOpenAIKey: !!this.env.OPENAI_API_KEY,
      hasGeminiKey: !!this.env.GEMINI_API_KEY,
      hasJWTSecret: !!this.env.JWT_SECRET,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 創建開發工具響應
   * @param {string} endpoint - 端點名稱
   * @returns {Response} 開發工具響應
   */
  createDevToolsResponse(endpoint) {
    if (!this.isDevelopment) {
      return new Response('Development tools are only available in development mode', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    switch (endpoint) {
      case 'performance':
        return new Response(JSON.stringify(this.getPerformanceReport(), null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'environment':
        return new Response(JSON.stringify(this.getEnvironmentInfo(), null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'validation':
        return new Response(JSON.stringify(this.validateEnvironment(), null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      default:
        return new Response('Unknown dev tool endpoint', { status: 404 });
    }
  }
}

