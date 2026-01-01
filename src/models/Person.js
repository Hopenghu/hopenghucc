// Person 物件類別 - 「人」核心物件
// 基於「人、事、時、地、物」哲學架構

export class Person {
  constructor(data = {}) {
    // 基本屬性
    this.id = data.id || null;
    this.email = data.email || null;
    this.name = data.name || null;
    this.avatar_url = data.avatar_url || null;
    this.role = data.role || 'user';
    
    // 使用者類型（基於 AI 問答系統）
    this.user_type = data.user_type || 'traveler'; // 'traveler', 'local', 'merchant'
    this.is_merchant = data.is_merchant || false;
    
    // 時間戳記
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    
    // 關聯資料（延遲載入）
    this._locations = null; // 使用者相關的地點
    this._stories = null; // 使用者的故事
    this._interactions = null; // 使用者的互動記錄
  }

  /**
   * 從資料庫記錄創建 Person 物件
   * @param {object} dbRecord - 資料庫記錄
   * @returns {Person}
   */
  static fromDbRecord(dbRecord) {
    if (!dbRecord) return null;
    return new Person({
      id: dbRecord.id,
      email: dbRecord.email,
      name: dbRecord.name,
      avatar_url: dbRecord.avatar_url,
      role: dbRecord.role,
      user_type: dbRecord.user_type,
      is_merchant: dbRecord.is_merchant,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at
    });
  }

  /**
   * 轉換為資料庫記錄格式
   * @returns {object}
   */
  toDbRecord() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      avatar_url: this.avatar_url,
      role: this.role,
      user_type: this.user_type,
      is_merchant: this.is_merchant,
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
      email: this.email,
      name: this.name,
      avatar_url: this.avatar_url,
      role: this.role,
      user_type: this.user_type,
      is_merchant: this.is_merchant,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * 檢查是否為管理員
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * 檢查是否為商家
   * @returns {boolean}
   */
  isMerchant() {
    return this.is_merchant || this.user_type === 'merchant';
  }

  /**
   * 檢查是否為本地居民
   * @returns {boolean}
   */
  isLocal() {
    return this.user_type === 'local';
  }

  /**
   * 檢查是否為旅客
   * @returns {boolean}
   */
  isTraveler() {
    return this.user_type === 'traveler' || (!this.is_merchant && !this.isLocal());
  }

  /**
   * 更新使用者類型
   * @param {string} userType - 'traveler', 'local', 'merchant'
   * @param {object} db - 資料庫連接（可選，用於即時更新）
   */
  async setUserType(userType, db = null) {
    this.user_type = userType;
    this.is_merchant = userType === 'merchant';
    
    if (db && this.id) {
      try {
        await db.prepare(
          `UPDATE users SET user_type = ?, is_merchant = ? WHERE id = ?`
        ).bind(userType, this.is_merchant ? 1 : 0, this.id).run();
      } catch (error) {
        console.error('[Person] Error updating user type:', error);
        throw error;
      }
    }
  }

  /**
   * 驗證物件有效性
   * @returns {boolean}
   */
  isValid() {
    return !!(this.id && this.email);
  }
}

