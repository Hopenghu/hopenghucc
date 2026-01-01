/**
 * Cache Monitor Utility
 * 緩存監控工具
 * 
 * 提供緩存命中率追蹤、性能指標收集和統計功能
 */

/**
 * 緩存統計數據結構
 */
class CacheStats {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.total = 0;
    this.totalResponseTime = 0; // 總響應時間（毫秒）
    this.cacheResponseTime = 0; // 緩存響應時間（毫秒）
    this.missResponseTime = 0; // 未命中響應時間（毫秒）
    this.startTime = Date.now();
  }

  /**
   * 記錄緩存命中
   * @param {number} responseTime - 響應時間（毫秒）
   */
  recordHit(responseTime = 0) {
    this.hits++;
    this.total++;
    this.totalResponseTime += responseTime;
    this.cacheResponseTime += responseTime;
  }

  /**
   * 記錄緩存未命中
   * @param {number} responseTime - 響應時間（毫秒）
   */
  recordMiss(responseTime = 0) {
    this.misses++;
    this.total++;
    this.totalResponseTime += responseTime;
    this.missResponseTime += responseTime;
  }

  /**
   * 獲取緩存命中率
   * @returns {number} 命中率（0-1）
   */
  getHitRate() {
    if (this.total === 0) return 0;
    return this.hits / this.total;
  }

  /**
   * 獲取平均響應時間
   * @returns {number} 平均響應時間（毫秒）
   */
  getAverageResponseTime() {
    if (this.total === 0) return 0;
    return this.totalResponseTime / this.total;
  }

  /**
   * 獲取緩存命中平均響應時間
   * @returns {number} 平均響應時間（毫秒）
   */
  getAverageCacheResponseTime() {
    if (this.hits === 0) return 0;
    return this.cacheResponseTime / this.hits;
  }

  /**
   * 獲取緩存未命中平均響應時間
   * @returns {number} 平均響應時間（毫秒）
   */
  getAverageMissResponseTime() {
    if (this.misses === 0) return 0;
    return this.missResponseTime / this.misses;
  }

  /**
   * 獲取統計摘要
   * @returns {object} 統計摘要對象
   */
  getSummary() {
    return {
      hits: this.hits,
      misses: this.misses,
      total: this.total,
      hitRate: this.getHitRate(),
      hitRatePercent: (this.getHitRate() * 100).toFixed(2) + '%',
      averageResponseTime: this.getAverageResponseTime().toFixed(2) + 'ms',
      averageCacheResponseTime: this.getAverageCacheResponseTime().toFixed(2) + 'ms',
      averageMissResponseTime: this.getAverageMissResponseTime().toFixed(2) + 'ms',
      uptime: Date.now() - this.startTime,
      uptimeMinutes: ((Date.now() - this.startTime) / 60000).toFixed(2) + ' minutes'
    };
  }

  /**
   * 重置統計
   */
  reset() {
    this.hits = 0;
    this.misses = 0;
    this.total = 0;
    this.totalResponseTime = 0;
    this.cacheResponseTime = 0;
    this.missResponseTime = 0;
    this.startTime = Date.now();
  }
}

/**
 * 全局緩存統計（按緩存鍵前綴分組）
 */
const globalCacheStats = new Map();

/**
 * 獲取或創建緩存統計對象
 * @param {string} cacheKey - 緩存鍵前綴
 * @returns {CacheStats} 緩存統計對象
 */
function getCacheStats(cacheKey) {
  if (!globalCacheStats.has(cacheKey)) {
    globalCacheStats.set(cacheKey, new CacheStats());
  }
  return globalCacheStats.get(cacheKey);
}

/**
 * 記錄緩存命中
 * @param {string} cacheKey - 緩存鍵前綴
 * @param {number} responseTime - 響應時間（毫秒）
 */
export function recordCacheHit(cacheKey, responseTime = 0) {
  const stats = getCacheStats(cacheKey);
  stats.recordHit(responseTime);
  console.log(`[CacheMonitor] Hit for ${cacheKey}: ${stats.getHitRate() * 100}% hit rate`);
}

/**
 * 記錄緩存未命中
 * @param {string} cacheKey - 緩存鍵前綴
 * @param {number} responseTime - 響應時間（毫秒）
 */
export function recordCacheMiss(cacheKey, responseTime = 0) {
  const stats = getCacheStats(cacheKey);
  stats.recordMiss(responseTime);
  console.log(`[CacheMonitor] Miss for ${cacheKey}: ${stats.getHitRate() * 100}% hit rate`);
}

/**
 * 獲取緩存統計摘要
 * @param {string} cacheKey - 緩存鍵前綴（可選，如果不提供則返回所有統計）
 * @returns {object} 統計摘要對象
 */
export function getCacheStatsSummary(cacheKey = null) {
  if (cacheKey) {
    const stats = getCacheStats(cacheKey);
    return {
      [cacheKey]: stats.getSummary()
    };
  }

  // 返回所有統計
  const summary = {};
  for (const [key, stats] of globalCacheStats.entries()) {
    summary[key] = stats.getSummary();
  }
  return summary;
}

/**
 * 重置緩存統計
 * @param {string} cacheKey - 緩存鍵前綴（可選，如果不提供則重置所有統計）
 */
export function resetCacheStats(cacheKey = null) {
  if (cacheKey) {
    const stats = getCacheStats(cacheKey);
    stats.reset();
    console.log(`[CacheMonitor] Reset stats for ${cacheKey}`);
  } else {
    globalCacheStats.clear();
    console.log('[CacheMonitor] Reset all stats');
  }
}

/**
 * 增強緩存裝飾器，添加監控功能
 * @param {Function} handler - API 處理函數
 * @param {object} options - 緩存選項
 * @returns {Function} 包裝後的處理函數
 */
export function withCacheMonitoring(handler, options = {}) {
  const {
    cacheKey = 'api',
    enableMonitoring = true
  } = options;

  return async (request, env, ...args) => {
    if (!enableMonitoring) {
      return await handler(request, env, ...args);
    }

    const startTime = Date.now();
    let response;
    let isCacheHit = false;

    try {
      // 這裡假設 handler 已經被 withCache 包裝
      // 我們需要從響應頭中判斷是否為緩存命中
      response = await handler(request, env, ...args);
      
      // 檢查響應頭判斷緩存狀態
      const cacheStatus = response.headers.get('X-Cache-Status');
      const responseTime = Date.now() - startTime;

      if (cacheStatus === 'HIT') {
        recordCacheHit(cacheKey, responseTime);
        isCacheHit = true;
      } else {
        recordCacheMiss(cacheKey, responseTime);
      }

      // 添加監控頭
      const headers = new Headers(response.headers);
      const stats = getCacheStats(cacheKey);
      headers.set('X-Cache-Hit-Rate', (stats.getHitRate() * 100).toFixed(2) + '%');
      headers.set('X-Cache-Total-Requests', stats.total.toString());
      headers.set('X-Response-Time', responseTime + 'ms');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      recordCacheMiss(cacheKey, responseTime);
      throw error;
    }
  };
}

/**
 * 獲取所有緩存統計的 JSON 格式
 * @returns {string} JSON 字符串
 */
export function getCacheStatsJSON() {
  return JSON.stringify(getCacheStatsSummary(), null, 2);
}

/**
 * 性能指標收集器
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * 記錄性能指標
   * @param {string} metricName - 指標名稱
   * @param {number} value - 指標值
   * @param {object} tags - 可選標籤
   */
  record(metricName, value, tags = {}) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
        tags: tags
      });
    }

    const metric = this.metrics.get(metricName);
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.values.push(value);

    // 只保留最近 1000 個值
    if (metric.values.length > 1000) {
      metric.values.shift();
    }
  }

  /**
   * 獲取指標統計
   * @param {string} metricName - 指標名稱
   * @returns {object} 統計對象
   */
  getStats(metricName) {
    if (!this.metrics.has(metricName)) {
      return null;
    }

    const metric = this.metrics.get(metricName);
    const avg = metric.sum / metric.count;
    
    // 計算中位數
    const sorted = [...metric.values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      name: metricName,
      count: metric.count,
      sum: metric.sum,
      average: avg,
      median: median,
      min: metric.min === Infinity ? 0 : metric.min,
      max: metric.max === -Infinity ? 0 : metric.max,
      tags: metric.tags
    };
  }

  /**
   * 獲取所有指標統計
   * @returns {object} 所有指標統計
   */
  getAllStats() {
    const stats = {};
    for (const metricName of this.metrics.keys()) {
      stats[metricName] = this.getStats(metricName);
    }
    return stats;
  }

  /**
   * 重置指標
   * @param {string} metricName - 指標名稱（可選）
   */
  reset(metricName = null) {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
  }
}

// 全局性能指標實例
export const performanceMetrics = new PerformanceMetrics();

/**
 * 記錄 API 響應時間
 * @param {string} apiPath - API 路徑
 * @param {number} responseTime - 響應時間（毫秒）
 */
export function recordAPIResponseTime(apiPath, responseTime) {
  performanceMetrics.record(`api.response_time.${apiPath}`, responseTime, {
    path: apiPath
  });
}

/**
 * 記錄數據庫查詢時間
 * @param {string} queryType - 查詢類型
 * @param {number} queryTime - 查詢時間（毫秒）
 */
export function recordDatabaseQueryTime(queryType, queryTime) {
  performanceMetrics.record(`db.query_time.${queryType}`, queryTime, {
    type: queryType
  });
}

