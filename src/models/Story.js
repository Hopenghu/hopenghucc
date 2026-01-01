// Story 物件類別 - 「故事」核心物件
// 基於「人、事、時、地、物」哲學架構
// 故事 = 人 + 時 + 地 + 事（Action）

export class Story {
  constructor(data = {}) {
    // 基本屬性
    this.id = data.id || null;
    
    // 核心關聯：「人、時、地」
    this.person_id = data.person_id || null; // 「人」
    this.location_id = data.location_id || null; // 「地」
    this.time = data.time || null; // 「時」- 時間戳記或時間描述
    
    // 「事」（Action）
    this.action_type = data.action_type || null; // 'visited', 'want_to_visit', 'want_to_revisit', 'created', 'shared'
    this.description = data.description || null; // 故事描述
    this.user_description = data.user_description || null; // 使用者自訂描述
    
    // 狀態
    this.status = data.status || 'active'; // 'active', 'archived', 'deleted'
    
    // 時間戳記
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // 關聯資料（延遲載入）
    this._person = null; // Person 物件
    this._location = null; // Location 物件
  }

  /**
   * 從資料庫記錄創建 Story 物件
   * @param {object} dbRecord - 資料庫記錄
   * @returns {Story}
   */
  static fromDbRecord(dbRecord) {
    if (!dbRecord) return null;
    return new Story({
      id: dbRecord.id,
      person_id: dbRecord.person_id || dbRecord.user_id, // 支援兩種欄位名稱
      location_id: dbRecord.location_id,
      time: dbRecord.time || dbRecord.created_at,
      action_type: dbRecord.action_type || dbRecord.status, // 支援 user_locations 表的 status
      description: dbRecord.description,
      user_description: dbRecord.user_description,
      status: dbRecord.status || 'active',
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at
    });
  }

  /**
   * 從 user_locations 記錄創建 Story 物件
   * @param {object} userLocationRecord - user_locations 表記錄
   * @returns {Story}
   */
  static fromUserLocationRecord(userLocationRecord) {
    if (!userLocationRecord) return null;
    return new Story({
      id: userLocationRecord.id,
      person_id: userLocationRecord.user_id,
      location_id: userLocationRecord.location_id,
      time: userLocationRecord.created_at,
      action_type: userLocationRecord.status, // 'visited', 'want_to_visit', 'want_to_revisit'
      description: userLocationRecord.user_description,
      user_description: userLocationRecord.user_description,
      status: 'active',
      created_at: userLocationRecord.created_at,
      updated_at: userLocationRecord.updated_at
    });
  }

  /**
   * 轉換為資料庫記錄格式
   * @returns {object}
   */
  toDbRecord() {
    return {
      id: this.id,
      person_id: this.person_id,
      location_id: this.location_id,
      time: this.time,
      action_type: this.action_type,
      description: this.description,
      user_description: this.user_description,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * 轉換為 JSON（用於 API 回應）
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      person_id: this.person_id,
      location_id: this.location_id,
      time: this.time,
      action_type: this.action_type,
      description: this.description,
      user_description: this.user_description,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // 如果已載入關聯物件，包含它們
      person: this._person ? this._person.toJSON() : null,
      location: this._location ? this._location.toJSON() : null
    };
  }

  /**
   * 獲取故事標題（自動生成）
   * @returns {string}
   */
  getTitle() {
    if (this.description) {
      return this.description.substring(0, 50) + (this.description.length > 50 ? '...' : '');
    }
    
    const actionNames = {
      'visited': '來過',
      'want_to_visit': '想來',
      'want_to_revisit': '想再來',
      'created': '建立了',
      'shared': '分享了'
    };
    
    const actionName = actionNames[this.action_type] || this.action_type;
    return `${actionName} ${this._location ? this._location.name : '地點'}`;
  }

  /**
   * 驗證物件有效性
   * @returns {boolean}
   */
  isValid() {
    return !!(this.person_id && this.location_id && this.action_type);
  }

  /**
   * 檢查是否為特定類型的行動
   * @param {string} actionType - 行動類型
   * @returns {boolean}
   */
  isActionType(actionType) {
    return this.action_type === actionType;
  }
}

