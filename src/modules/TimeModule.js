// TimeModule - 「時」模組
// 基於「人、事、時、地、物」哲學架構
// 管理時間相關的操作和格式化

export class TimeModule {
  constructor() {
    // 時間格式配置
    this.dateFormat = 'YYYY-MM-DD';
    this.datetimeFormat = 'YYYY-MM-DD HH:mm:ss';
    this.timezone = 'Asia/Taipei'; // 澎湖時區
  }

  /**
   * 獲取當前時間戳記（ISO 格式）
   * @returns {string}
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * 獲取當前時間（SQLite datetime 格式）
   * @returns {string}
   */
  getCurrentDatetime() {
    const now = new Date();
    return this.formatDatetime(now);
  }

  /**
   * 格式化日期時間為 SQLite 格式
   * @param {Date|string} date - 日期物件或字串
   * @returns {string}
   */
  formatDatetime(date) {
    if (!date) return null;
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 格式化日期
   * @param {Date|string} date - 日期物件或字串
   * @returns {string}
   */
  formatDate(date) {
    if (!date) return null;
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化為相對時間（例如：3 天前、2 小時前）
   * @param {Date|string} date - 日期物件或字串
   * @returns {string}
   */
  formatRelativeTime(date) {
    if (!date) return '未知時間';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '無效時間';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return '剛剛';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 30) {
      return `${diffDays} 天前`;
    } else if (diffMonths < 12) {
      return `${diffMonths} 個月前`;
    } else {
      return `${diffYears} 年前`;
    }
  }

  /**
   * 格式化為中文日期時間
   * @param {Date|string} date - 日期物件或字串
   * @returns {string}
   */
  formatChineseDatetime(date) {
    if (!date) return '未知時間';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '無效時間';
    
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    
    return `${year}年${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 解析時間描述（例如：「3 天前」、「上個月」）
   * @param {string} timeDescription - 時間描述
   * @returns {Date|null}
   */
  parseTimeDescription(timeDescription) {
    if (!timeDescription) return null;
    
    const now = new Date();
    const desc = timeDescription.toLowerCase().trim();
    
    // 處理「X 天前」
    const daysAgoMatch = desc.match(/(\d+)\s*天前/);
    if (daysAgoMatch) {
      const days = parseInt(daysAgoMatch[1]);
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date;
    }
    
    // 處理「X 小時前」
    const hoursAgoMatch = desc.match(/(\d+)\s*小時前/);
    if (hoursAgoMatch) {
      const hours = parseInt(hoursAgoMatch[1]);
      const date = new Date(now);
      date.setHours(date.getHours() - hours);
      return date;
    }
    
    // 處理「上個月」
    if (desc.includes('上個月')) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - 1);
      return date;
    }
    
    // 處理「去年」
    if (desc.includes('去年')) {
      const date = new Date(now);
      date.setFullYear(date.getFullYear() - 1);
      return date;
    }
    
    // 嘗試直接解析為日期
    const parsed = new Date(timeDescription);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    return null;
  }

  /**
   * 計算時間差
   * @param {Date|string} startDate - 開始時間
   * @param {Date|string} endDate - 結束時間（預設為現在）
   * @returns {object} 包含 days, hours, minutes, seconds
   */
  calculateTimeDifference(startDate, endDate = null) {
    if (!startDate) return null;
    
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    return {
      days: diffDays,
      hours: diffHours % 24,
      minutes: diffMinutes % 60,
      seconds: diffSeconds % 60,
      totalSeconds: diffSeconds,
      totalMinutes: diffMinutes,
      totalHours: diffHours,
      totalDays: diffDays
    };
  }

  /**
   * 檢查時間是否在範圍內
   * @param {Date|string} date - 要檢查的時間
   * @param {Date|string} startDate - 開始時間
   * @param {Date|string} endDate - 結束時間
   * @returns {boolean}
   */
  isInTimeRange(date, startDate, endDate) {
    if (!date || !startDate || !endDate) return false;
    
    const d = date instanceof Date ? date : new Date(date);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    if (isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }
    
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
  }

  /**
   * 獲取時間範圍的 SQL WHERE 條件
   * @param {string} columnName - 資料庫欄位名稱
   * @param {Date|string} startDate - 開始時間（可選）
   * @param {Date|string} endDate - 結束時間（可選）
   * @returns {object} { sql: string, params: array }
   */
  getTimeRangeCondition(columnName, startDate = null, endDate = null) {
    const conditions = [];
    const params = [];
    
    if (startDate) {
      conditions.push(`${columnName} >= ?`);
      params.push(this.formatDatetime(startDate));
    }
    
    if (endDate) {
      conditions.push(`${columnName} <= ?`);
      params.push(this.formatDatetime(endDate));
    }
    
    if (conditions.length === 0) {
      return { sql: '', params: [] };
    }
    
    return {
      sql: conditions.join(' AND '),
      params
    };
  }

  /**
   * 為 Story 物件生成時間描述
   * @param {object} story - Story 物件
   * @returns {string}
   */
  getStoryTimeDescription(story) {
    if (!story) return '未知時間';
    
    if (story.time) {
      return this.formatRelativeTime(story.time);
    }
    
    if (story.created_at) {
      return this.formatRelativeTime(story.created_at);
    }
    
    return '未知時間';
  }
}

