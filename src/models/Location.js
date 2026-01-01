// Location 物件類別 - 「地」核心物件
// 基於「人、事、時、地、物」哲學架構
// 擴展現有的 LocationService 功能

export class Location {
  constructor(data = {}) {
    // 基本屬性
    this.id = data.id || null;
    this.name = data.name || null;
    this.address = data.address || null;
    this.latitude = data.latitude || null;
    this.longitude = data.longitude || null;
    
    // Google Places 相關
    this.google_place_id = data.google_place_id || null;
    this.google_types = data.google_types || null; // JSON 字串或陣列
    this.thumbnail_url = data.thumbnail_url || null;
    this.photo_url = data.photo_url || null;
    this.website = data.website || null;
    this.phone_number = data.phone_number || null;
    this.business_status = data.business_status || null;
    this.google_rating = data.google_rating || null;
    this.google_user_ratings_total = data.google_user_ratings_total || null;
    this.editorial_summary = data.editorial_summary || null;
    
    // 商家相關
    this.is_merchant = data.is_merchant || false;
    this.merchant_id = data.merchant_id || null; // 關聯的商家 Person ID
    
    // 時間戳記
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.created_by = data.created_by || null; // 創建者 Person ID
    
    // 關聯資料（延遲載入）
    this._creator = null; // 創建者 Person 物件
    this._merchant = null; // 商家 Person 物件
    this._stories = null; // 相關故事
    this._interactions = null; // 互動記錄
    this._user_status = null; // 當前使用者的狀態（如果提供 userId）
  }

  /**
   * 從資料庫記錄創建 Location 物件
   * @param {object} dbRecord - 資料庫記錄
   * @returns {Location}
   */
  static fromDbRecord(dbRecord) {
    if (!dbRecord) return null;
    
    // 解析 google_types（可能是 JSON 字串）
    let googleTypes = dbRecord.google_types;
    if (typeof googleTypes === 'string') {
      try {
        googleTypes = JSON.parse(googleTypes);
      } catch (e) {
        googleTypes = [];
      }
    }
    
    return new Location({
      id: dbRecord.id,
      name: dbRecord.name,
      address: dbRecord.address,
      latitude: dbRecord.latitude,
      longitude: dbRecord.longitude,
      google_place_id: dbRecord.google_place_id,
      google_types: googleTypes,
      thumbnail_url: dbRecord.thumbnail_url,
      photo_url: dbRecord.photo_url,
      website: dbRecord.website,
      phone_number: dbRecord.phone_number,
      business_status: dbRecord.business_status,
      google_rating: dbRecord.google_rating,
      google_user_ratings_total: dbRecord.google_user_ratings_total,
      editorial_summary: dbRecord.editorial_summary,
      is_merchant: dbRecord.is_merchant || false,
      merchant_id: dbRecord.merchant_id,
      created_at: dbRecord.created_at,
      updated_at: dbRecord.updated_at,
      created_by: dbRecord.created_by
    });
  }

  /**
   * 轉換為資料庫記錄格式
   * @returns {object}
   */
  toDbRecord() {
    // 確保 google_types 是 JSON 字串
    let googleTypes = this.google_types;
    if (Array.isArray(googleTypes)) {
      googleTypes = JSON.stringify(googleTypes);
    }
    
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      google_place_id: this.google_place_id,
      google_types: googleTypes,
      thumbnail_url: this.thumbnail_url,
      photo_url: this.photo_url,
      website: this.website,
      phone_number: this.phone_number,
      business_status: this.business_status,
      google_rating: this.google_rating,
      google_user_ratings_total: this.google_user_ratings_total,
      editorial_summary: this.editorial_summary,
      is_merchant: this.is_merchant ? 1 : 0,
      merchant_id: this.merchant_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by
    };
  }

  /**
   * 轉換為 JSON（用於 API 回應）
   * @param {string} userId - 可選，當前使用者 ID（用於包含使用者狀態）
   * @returns {object}
   */
  toJSON(userId = null) {
    const json = {
      id: this.id,
      name: this.name,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      google_place_id: this.google_place_id,
      google_types: Array.isArray(this.google_types) ? this.google_types : 
                    (typeof this.google_types === 'string' ? JSON.parse(this.google_types) : []),
      thumbnail_url: this.thumbnail_url,
      photo_url: this.photo_url,
      website: this.website,
      phone_number: this.phone_number,
      business_status: this.business_status,
      google_rating: this.google_rating,
      google_user_ratings_total: this.google_user_ratings_total,
      editorial_summary: this.editorial_summary,
      is_merchant: this.is_merchant,
      merchant_id: this.merchant_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by
    };
    
    // 如果提供了使用者 ID 且有使用者狀態，包含它
    if (userId && this._user_status) {
      json.user_location_status = this._user_status;
    }
    
    return json;
  }

  /**
   * 獲取地點類型（翻譯後）
   * @param {function} translateFn - 可選的翻譯函數
   * @returns {string}
   */
  getTypes(translateFn = null) {
    const types = Array.isArray(this.google_types) ? this.google_types : 
                  (typeof this.google_types === 'string' ? JSON.parse(this.google_types) : []);
    
    if (translateFn && typeof translateFn === 'function') {
      return types.map(type => translateFn(type)).join(', ');
    }
    
    return types.join(', ');
  }

  /**
   * 檢查是否有座標
   * @returns {boolean}
   */
  hasCoordinates() {
    return !!(this.latitude && this.longitude);
  }

  /**
   * 檢查是否為商家地點
   * @returns {boolean}
   */
  isMerchantLocation() {
    return this.is_merchant || !!this.merchant_id;
  }

  /**
   * 驗證物件有效性
   * @returns {boolean}
   */
  isValid() {
    return !!(this.id && this.name);
  }

  /**
   * 計算與另一個地點的距離（需要 Google Maps API）
   * @param {Location} otherLocation - 另一個地點
   * @param {object} distanceService - DistanceService 實例
   * @returns {Promise<object|null>} 距離資訊或 null
   */
  async getDistanceTo(otherLocation, distanceService) {
    if (!this.hasCoordinates() || !otherLocation.hasCoordinates() || !distanceService) {
      return null;
    }
    
    try {
      return await distanceService.calculateDistance(
        { lat: this.latitude, lng: this.longitude },
        { lat: otherLocation.latitude, lng: otherLocation.longitude }
      );
    } catch (error) {
      console.error('[Location] Error calculating distance:', error);
      return null;
    }
  }
}

