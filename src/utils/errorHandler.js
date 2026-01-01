/**
 * 錯誤處理工具
 * 提供統一的錯誤邊界和服務降級策略
 */

import { pageTemplate } from '../components/layout.js';

/**
 * 服務健康狀態檢查
 */
export class ServiceHealthChecker {
  /**
   * 檢查數據庫連接
   * @param {object} db - D1 數據庫實例
   * @returns {Promise<{healthy: boolean, error?: string}>}
   */
  static async checkDatabase(db) {
    if (!db) {
      return { healthy: false, error: 'Database not initialized' };
    }
    
    try {
      // 執行簡單查詢測試連接
      await db.prepare('SELECT 1').first();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message || 'Database connection failed' 
      };
    }
  }

  /**
   * 檢查服務是否可用
   * @param {object} service - 服務實例
   * @param {string} serviceName - 服務名稱
   * @returns {{healthy: boolean, error?: string}}
   */
  static checkService(service, serviceName) {
    if (!service) {
      return { 
        healthy: false, 
        error: `${serviceName} not initialized` 
      };
    }
    return { healthy: true };
  }
}

/**
 * 錯誤響應生成器
 */
export class ErrorResponseBuilder {
  /**
   * 生成友好的錯誤頁面
   * @param {object} options - 選項
   * @param {string} options.title - 錯誤標題
   * @param {string} options.message - 錯誤訊息
   * @param {number} options.statusCode - HTTP 狀態碼
   * @param {object} options.user - 當前用戶
   * @param {string} options.nonce - CSP nonce
   * @param {string} options.cssContent - CSS 內容
   * @param {string} options.suggestion - 建議操作
   * @returns {Response}
   */
  static buildErrorPage({ 
    title = '發生錯誤', 
    message = '處理您的請求時發生錯誤',
    statusCode = 500,
    user = null,
    nonce = '',
    cssContent = '',
    suggestion = null
  }) {
    const suggestionHtml = suggestion ? `
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-800"><strong>建議：</strong> ${suggestion}</p>
      </div>
    ` : '';

    const content = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">${title}</h1>
          <p class="text-gray-600 mb-6">${message}</p>
          ${suggestionHtml}
          <div class="mt-6">
            <a href="/" class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              返回首頁
            </a>
          </div>
        </div>
      </div>
    `;

    return new Response(pageTemplate({
      title: title,
      content: content,
      user: user,
      nonce: nonce,
      cssContent: cssContent
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  }

  /**
   * 生成 JSON 錯誤響應
   * @param {string} error - 錯誤訊息
   * @param {number} statusCode - HTTP 狀態碼
   * @param {object} details - 額外詳情
   * @returns {Response}
   */
  static buildJSONError(error, statusCode = 500, details = {}) {
    return new Response(JSON.stringify({
      success: false,
      error: error,
      ...details
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  /**
   * 生成服務不可用錯誤頁面
   * @param {object} options - 選項
   * @returns {Response}
   */
  static buildServiceUnavailablePage(options) {
    return this.buildErrorPage({
      title: '服務暫時不可用',
      message: '系統正在維護中，請稍後再試。',
      statusCode: 503,
      suggestion: '如果問題持續存在，請聯繫管理員。',
      ...options
    });
  }

  /**
   * 生成數據庫錯誤頁面
   * @param {object} options - 選項
   * @returns {Response}
   */
  static buildDatabaseErrorPage(options) {
    return this.buildErrorPage({
      title: '數據庫連接錯誤',
      message: '無法連接到數據庫，請稍後再試。',
      statusCode: 503,
      suggestion: '系統管理員已收到通知，正在處理中。',
      ...options
    });
  }
}

/**
 * 錯誤處理裝飾器
 * 用於包裝異步函數，自動處理錯誤
 */
export function withErrorHandling(fn, options = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[ErrorHandler] Error in ${fn.name || 'anonymous'}:`, error);
      
      // 根據錯誤類型返回不同的響應
      if (error.message && error.message.includes('no such table')) {
        return ErrorResponseBuilder.buildErrorPage({
          title: '數據庫表不存在',
          message: '系統正在初始化，請稍後再試。',
          statusCode: 503,
          suggestion: '如果問題持續存在，請聯繫管理員運行數據庫遷移。',
          ...options
        });
      }
      
      if (error.message && error.message.includes('Database')) {
        return ErrorResponseBuilder.buildDatabaseErrorPage(options);
      }
      
      // 默認錯誤響應
      return ErrorResponseBuilder.buildErrorPage({
        title: '發生錯誤',
        message: error.message || '處理您的請求時發生未知錯誤',
        statusCode: 500,
        ...options
      });
    }
  };
}

