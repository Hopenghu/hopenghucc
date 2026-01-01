/**
 * Unified Logger Utility
 * 統一日誌工具
 * 
 * 提供結構化日誌記錄、錯誤追蹤和性能日誌功能
 */

/**
 * 日誌級別
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

/**
 * 日誌級別名稱映射
 */
const LogLevelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

/**
 * 日誌配置
 */
class LoggerConfig {
  constructor() {
    this.minLevel = LogLevel.INFO; // 默認只記錄 INFO 及以上級別
    this.enableConsole = true; // 是否輸出到控制台
    this.enableDatabase = false; // 是否存儲到數據庫（可選）
    this.enablePerformanceLogging = true; // 是否記錄性能日誌
    this.enableErrorTracking = true; // 是否追蹤錯誤
    this.maxLogLength = 10000; // 最大日誌長度
  }

  /**
   * 設置最小日誌級別
   * @param {number} level - 日誌級別
   */
  setMinLevel(level) {
    this.minLevel = level;
  }

  /**
   * 啟用/禁用控制台輸出
   * @param {boolean} enable - 是否啟用
   */
  setConsoleOutput(enable) {
    this.enableConsole = enable;
  }

  /**
   * 啟用/禁用數據庫存儲
   * @param {boolean} enable - 是否啟用
   */
  setDatabaseStorage(enable) {
    this.enableDatabase = enable;
  }
}

// 全局配置實例
const loggerConfig = new LoggerConfig();

/**
 * 日誌條目結構
 */
class LogEntry {
  constructor(level, message, context = {}) {
    this.timestamp = new Date().toISOString();
    this.level = level;
    this.levelName = LogLevelNames[level];
    this.message = message;
    this.context = context;
    this.error = context.error || null;
    this.stack = context.error?.stack || null;
    this.userId = context.userId || null;
    this.requestId = context.requestId || null;
    this.path = context.path || null;
    this.method = context.method || null;
    this.duration = context.duration || null;
    this.metadata = context.metadata || {};
  }

  /**
   * 轉換為 JSON 字符串
   * @returns {string}
   */
  toJSON() {
    return JSON.stringify({
      timestamp: this.timestamp,
      level: this.levelName,
      message: this.message,
      ...(this.error && { error: this.error.message, stack: this.stack }),
      ...(this.userId && { userId: this.userId }),
      ...(this.requestId && { requestId: this.requestId }),
      ...(this.path && { path: this.path }),
      ...(this.method && { method: this.method }),
      ...(this.duration && { duration: `${this.duration}ms` }),
      ...(Object.keys(this.metadata).length > 0 && { metadata: this.metadata })
    });
  }

  /**
   * 轉換為控制台輸出格式
   * @returns {string}
   */
  toConsoleString() {
    const prefix = `[${this.levelName}] [${new Date(this.timestamp).toLocaleTimeString()}]`;
    let output = `${prefix} ${this.message}`;
    
    if (this.error) {
      output += `\n  Error: ${this.error.message}`;
      if (this.stack) {
        output += `\n  Stack: ${this.stack.split('\n').slice(0, 3).join('\n')}`;
      }
    }
    
    if (this.path) {
      output += `\n  Path: ${this.method} ${this.path}`;
    }
    
    if (this.duration) {
      output += `\n  Duration: ${this.duration}ms`;
    }
    
    if (Object.keys(this.metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(this.metadata, null, 2)}`;
    }
    
    return output;
  }
}

/**
 * 統一日誌器
 */
class Logger {
  constructor(name = 'App') {
    this.name = name;
  }

  /**
   * 記錄日誌
   * @param {number} level - 日誌級別
   * @param {string} message - 日誌消息
   * @param {object} context - 上下文信息
   */
  log(level, message, context = {}) {
    // 檢查日誌級別
    if (level < loggerConfig.minLevel) {
      return;
    }

    // 限制消息長度
    if (message.length > loggerConfig.maxLogLength) {
      message = message.substring(0, loggerConfig.maxLogLength) + '... (truncated)';
    }

    const entry = new LogEntry(level, message, {
      ...context,
      logger: this.name
    });

    // 輸出到控制台
    if (loggerConfig.enableConsole) {
      this._outputToConsole(entry);
    }

    // 存儲到數據庫（如果啟用）
    if (loggerConfig.enableDatabase && context.db) {
      this._storeToDatabase(entry, context.db).catch(err => {
        console.error('[Logger] Failed to store log to database:', err);
      });
    }
  }

  /**
   * 輸出到控制台
   * @param {LogEntry} entry - 日誌條目
   */
  _outputToConsole(entry) {
    const consoleMethod = this._getConsoleMethod(entry.level);
    consoleMethod(entry.toConsoleString());
  }

  /**
   * 獲取對應的控制台方法
   * @param {number} level - 日誌級別
   * @returns {Function}
   */
  _getConsoleMethod(level) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 存儲到數據庫
   * @param {LogEntry} entry - 日誌條目
   * @param {object} db - 數據庫實例
   */
  async _storeToDatabase(entry, db) {
    try {
      // 這裡可以實現數據庫存儲邏輯
      // 例如：存儲到 logs 表
      const stmt = db.prepare(`
        INSERT INTO application_logs 
        (timestamp, level, message, error_message, stack, user_id, request_id, path, method, duration, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        entry.timestamp,
        entry.levelName,
        entry.message,
        entry.error?.message || null,
        entry.stack || null,
        entry.userId || null,
        entry.requestId || null,
        entry.path || null,
        entry.method || null,
        entry.duration || null,
        JSON.stringify(entry.metadata)
      ).run();
    } catch (error) {
      // 如果數據庫存儲失敗，只記錄到控制台，不拋出錯誤
      console.error('[Logger] Database storage failed:', error);
    }
  }

  /**
   * 記錄調試信息
   */
  debug(message, context = {}) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 記錄信息
   */
  info(message, context = {}) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 記錄警告
   */
  warn(message, context = {}) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * 記錄錯誤
   */
  error(message, error = null, context = {}) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error || new Error(message)
    });
  }

  /**
   * 記錄致命錯誤
   */
  fatal(message, error = null, context = {}) {
    this.log(LogLevel.FATAL, message, {
      ...context,
      error: error || new Error(message)
    });
  }

  /**
   * 記錄性能指標
   */
  performance(operation, duration, context = {}) {
    if (!loggerConfig.enablePerformanceLogging) {
      return;
    }
    
    this.log(LogLevel.INFO, `Performance: ${operation}`, {
      ...context,
      duration,
      metadata: {
        ...context.metadata,
        operation,
        performance: true
      }
    });
  }

  /**
   * 記錄 API 請求
   */
  apiRequest(method, path, duration, statusCode, context = {}) {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;
    
    this.log(level, `API Request: ${method} ${path} - ${statusCode}`, {
      ...context,
      method,
      path,
      duration,
      statusCode,
      metadata: {
        ...context.metadata,
        apiRequest: true
      }
    });
  }

  /**
   * 記錄數據庫查詢
   */
  databaseQuery(query, duration, context = {}) {
    if (!loggerConfig.enablePerformanceLogging) {
      return;
    }
    
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    
    this.log(level, `Database Query: ${query.substring(0, 100)}...`, {
      ...context,
      duration,
      metadata: {
        ...context.metadata,
        databaseQuery: true,
        query: query.substring(0, 500) // 限制查詢長度
      }
    });
  }
}

/**
 * 創建日誌器實例
 * @param {string} name - 日誌器名稱
 * @returns {Logger}
 */
export function createLogger(name) {
  return new Logger(name);
}

/**
 * 默認日誌器
 */
export const logger = createLogger('App');

/**
 * 配置日誌器
 * @param {object} config - 配置選項
 */
export function configureLogger(config) {
  if (config.minLevel !== undefined) {
    loggerConfig.setMinLevel(config.minLevel);
  }
  if (config.enableConsole !== undefined) {
    loggerConfig.setConsoleOutput(config.enableConsole);
  }
  if (config.enableDatabase !== undefined) {
    loggerConfig.setDatabaseStorage(config.enableDatabase);
  }
  if (config.enablePerformanceLogging !== undefined) {
    loggerConfig.enablePerformanceLogging = config.enablePerformanceLogging;
  }
  if (config.enableErrorTracking !== undefined) {
    loggerConfig.enableErrorTracking = config.enableErrorTracking;
  }
}

/**
 * 獲取當前配置
 * @returns {object}
 */
export function getLoggerConfig() {
  return {
    minLevel: loggerConfig.minLevel,
    enableConsole: loggerConfig.enableConsole,
    enableDatabase: loggerConfig.enableDatabase,
    enablePerformanceLogging: loggerConfig.enablePerformanceLogging,
    enableErrorTracking: loggerConfig.enableErrorTracking
  };
}

/**
 * 錯誤追蹤裝飾器
 * 自動記錄函數執行時間和錯誤
 */
export function withErrorTracking(fn, options = {}) {
  const loggerName = options.logger || 'App';
  const log = createLogger(loggerName);
  const operation = options.operation || fn.name || 'unknown';

  return async (...args) => {
    const startTime = Date.now();
    const requestId = options.requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      log.debug(`Starting ${operation}`, {
        requestId,
        ...options.context
      });

      const result = await fn(...args);
      
      const duration = Date.now() - startTime;
      log.performance(operation, duration, {
        requestId,
        ...options.context
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`Error in ${operation}`, error, {
        requestId,
        duration,
        ...options.context
      });
      throw error;
    }
  };
}

