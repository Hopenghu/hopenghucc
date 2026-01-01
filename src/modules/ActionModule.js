// ActionModule - 「事」模組
// 基於「人、事、時、地、物」哲學架構
// 管理行動（Action）相關的操作和狀態

export class ActionModule {
  constructor() {
    // 定義所有支援的行動類型
    this.actionTypes = {
      // 地點相關行動
      VISITED: 'visited',           // 來過
      WANT_TO_VISIT: 'want_to_visit', // 想來
      WANT_TO_REVISIT: 'want_to_revisit', // 想再來
      CREATED: 'created',           // 建立了地點
      SHARED: 'shared',             // 分享了地點
      
      // 商家相關行動
      CLAIMED: 'claimed',           // 認領了地點
      UPDATED: 'updated',           // 更新了資訊
      
      // 其他行動
      LIKED: 'liked',               // 喜歡
      COMMENTED: 'commented',       // 評論
      FOLLOWED: 'followed'          // 關注
    };

    // 行動類型的中文名稱
    this.actionTypeNames = {
      'visited': '來過',
      'want_to_visit': '想來',
      'want_to_revisit': '想再來',
      'created': '建立了',
      'shared': '分享了',
      'claimed': '認領了',
      'updated': '更新了',
      'liked': '喜歡了',
      'commented': '評論了',
      'followed': '關注了'
    };

    // 行動類型的圖標
    this.actionTypeIcons = {
      'visited': '✓',
      'want_to_visit': '❤',
      'want_to_revisit': '🔄',
      'created': '➕',
      'shared': '📤',
      'claimed': '🏪',
      'updated': '✏️',
      'liked': '👍',
      'commented': '💬',
      'followed': '👁'
    };

    // 行動類型的顏色
    this.actionTypeColors = {
      'visited': 'green',
      'want_to_visit': 'blue',
      'want_to_revisit': 'purple',
      'created': 'orange',
      'shared': 'gray',
      'claimed': 'yellow',
      'updated': 'teal',
      'liked': 'red',
      'commented': 'indigo',
      'followed': 'pink'
    };
  }

  /**
   * 獲取行動類型的中文名稱
   * @param {string} actionType - 行動類型
   * @returns {string}
   */
  getActionTypeName(actionType) {
    return this.actionTypeNames[actionType] || actionType;
  }

  /**
   * 獲取行動類型的圖標
   * @param {string} actionType - 行動類型
   * @returns {string}
   */
  getActionTypeIcon(actionType) {
    return this.actionTypeIcons[actionType] || '•';
  }

  /**
   * 獲取行動類型的顏色
   * @param {string} actionType - 行動類型
   * @returns {string}
   */
  getActionTypeColor(actionType) {
    return this.actionTypeColors[actionType] || 'gray';
  }

  /**
   * 驗證行動類型是否有效
   * @param {string} actionType - 行動類型
   * @returns {boolean}
   */
  isValidActionType(actionType) {
    return Object.values(this.actionTypes).includes(actionType);
  }

  /**
   * 獲取所有支援的行動類型
   * @returns {array}
   */
  getAllActionTypes() {
    return Object.values(this.actionTypes);
  }

  /**
   * 獲取地點相關的行動類型
   * @returns {array}
   */
  getLocationActionTypes() {
    return [
      this.actionTypes.VISITED,
      this.actionTypes.WANT_TO_VISIT,
      this.actionTypes.WANT_TO_REVISIT,
      this.actionTypes.CREATED,
      this.actionTypes.SHARED
    ];
  }

  /**
   * 獲取商家相關的行動類型
   * @returns {array}
   */
  getMerchantActionTypes() {
    return [
      this.actionTypes.CLAIMED,
      this.actionTypes.UPDATED
    ];
  }

  /**
   * 生成行動描述（用於 Story）
   * @param {string} actionType - 行動類型
   * @param {string} locationName - 地點名稱（可選）
   * @returns {string}
   */
  generateActionDescription(actionType, locationName = null) {
    const actionName = this.getActionTypeName(actionType);
    const icon = this.getActionTypeIcon(actionType);
    
    if (locationName) {
      return `${icon} ${actionName} ${locationName}`;
    }
    
    return `${icon} ${actionName}`;
  }

  /**
   * 獲取行動的 CSS 類別（用於樣式）
   * @param {string} actionType - 行動類型
   * @returns {string}
   */
  getActionCssClass(actionType) {
    const color = this.getActionTypeColor(actionType);
    return `action-${actionType} action-color-${color}`;
  }

  /**
   * 獲取行動的按鈕樣式類別
   * @param {string} actionType - 行動類型
   * @param {boolean} isActive - 是否為當前狀態
   * @returns {string}
   */
  getActionButtonClass(actionType, isActive = false) {
    const baseClass = this.getActionCssClass(actionType);
    const color = this.getActionTypeColor(actionType);
    
    if (isActive) {
      return `bg-${color}-500 text-white ${baseClass}`;
    }
    
    return `bg-gray-200 text-gray-700 hover:bg-${color}-100 ${baseClass}`;
  }

  /**
   * 從使用者輸入中識別行動類型
   * @param {string} input - 使用者輸入
   * @returns {string|null}
   */
  identifyActionFromInput(input) {
    if (!input) return null;
    
    const lowerInput = input.toLowerCase();
    
    // 檢查各種可能的表達方式
    if (lowerInput.includes('來過') || lowerInput.includes('去過') || lowerInput.includes('造訪過')) {
      return this.actionTypes.VISITED;
    }
    
    if (lowerInput.includes('想來') || lowerInput.includes('想去') || lowerInput.includes('計劃')) {
      return this.actionTypes.WANT_TO_VISIT;
    }
    
    if (lowerInput.includes('想再來') || lowerInput.includes('想再去') || lowerInput.includes('還想')) {
      return this.actionTypes.WANT_TO_REVISIT;
    }
    
    if (lowerInput.includes('建立') || lowerInput.includes('新增') || lowerInput.includes('創建')) {
      return this.actionTypes.CREATED;
    }
    
    if (lowerInput.includes('分享') || lowerInput.includes('推薦')) {
      return this.actionTypes.SHARED;
    }
    
    if (lowerInput.includes('認領') || lowerInput.includes('claim')) {
      return this.actionTypes.CLAIMED;
    }
    
    return null;
  }

  /**
   * 獲取行動統計資訊
   * @param {array} stories - Story 物件陣列
   * @returns {object} 統計資訊
   */
  getActionStatistics(stories) {
    const stats = {};
    
    // 初始化所有行動類型的計數
    Object.values(this.actionTypes).forEach(actionType => {
      stats[actionType] = 0;
    });
    
    // 統計
    if (Array.isArray(stories)) {
      stories.forEach(story => {
        if (story && story.action_type && stats.hasOwnProperty(story.action_type)) {
          stats[story.action_type]++;
        }
      });
    }
    
    // 計算總數
    stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return stats;
  }

  /**
   * 過濾 Story 陣列 by 行動類型
   * @param {array} stories - Story 物件陣列
   * @param {string} actionType - 行動類型
   * @returns {array}
   */
  filterStoriesByAction(stories, actionType) {
    if (!Array.isArray(stories) || !actionType) {
      return [];
    }
    
    return stories.filter(story => story && story.action_type === actionType);
  }

  /**
   * 排序 Story 陣列（按行動類型優先級）
   * @param {array} stories - Story 物件陣列
   * @returns {array}
   */
  sortStoriesByActionPriority(stories) {
    if (!Array.isArray(stories)) {
      return [];
    }
    
    // 定義優先級（數字越小優先級越高）
    const priority = {
      [this.actionTypes.CREATED]: 1,
      [this.actionTypes.CLAIMED]: 2,
      [this.actionTypes.VISITED]: 3,
      [this.actionTypes.WANT_TO_REVISIT]: 4,
      [this.actionTypes.WANT_TO_VISIT]: 5,
      [this.actionTypes.SHARED]: 6,
      [this.actionTypes.UPDATED]: 7,
      [this.actionTypes.LIKED]: 8,
      [this.actionTypes.COMMENTED]: 9,
      [this.actionTypes.FOLLOWED]: 10
    };
    
    return [...stories].sort((a, b) => {
      const priorityA = priority[a?.action_type] || 999;
      const priorityB = priority[b?.action_type] || 999;
      return priorityA - priorityB;
    });
  }
}

