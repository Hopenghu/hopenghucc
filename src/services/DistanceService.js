/**
 * 距離計算服務 - 整合 Google Maps Distance Matrix API
 */
export class DistanceService {
  constructor(db, googleMapsApiKey) {
    if (!db) {
      throw new Error("Database connection is required for DistanceService.");
    }
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API key is required for DistanceService.");
    }
    this.db = db;
    this.apiKey = googleMapsApiKey;
    this.apiBaseUrl = "https://maps.googleapis.com/maps/api/distancematrix/json";
    this.cacheExpiryDays = 30; // 快取 30 天
  }

  /**
   * 計算兩地點之間的距離和時間
   */
  async calculateDistance(fromLocationId, toLocationId, travelMode = 'driving') {
    try {
      // 檢查快取
      const cached = await this.getCachedDistance(fromLocationId, toLocationId, travelMode);
      if (cached && !this.isCacheExpired(cached)) {
        console.log('[DistanceService] Using cached distance');
        return {
          distance_meters: cached.distance_meters,
          duration_seconds: cached.duration_seconds,
          distance_text: cached.distance_text,
          duration_text: cached.duration_text,
          from_cache: true
        };
      }

      // 獲取地點座標
      const fromLocation = await this.db.prepare(
        'SELECT latitude, longitude FROM locations WHERE id = ?'
      ).bind(fromLocationId).first();

      const toLocation = await this.db.prepare(
        'SELECT latitude, longitude FROM locations WHERE id = ?'
      ).bind(toLocationId).first();

      if (!fromLocation || !toLocation) {
        throw new Error('Location not found');
      }

      // 呼叫 Google Maps Distance Matrix API
      const origins = `${fromLocation.latitude},${fromLocation.longitude}`;
      const destinations = `${toLocation.latitude},${toLocation.longitude}`;
      
      const url = `${this.apiBaseUrl}?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=${travelMode}&language=zh-TW&key=${this.apiKey}`;

      console.log('[DistanceService] Calling Google Maps Distance Matrix API');

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.rows || !data.rows[0] || !data.rows[0].elements || !data.rows[0].elements[0]) {
        console.error('[DistanceService] API error:', data);
        throw new Error(`Distance Matrix API error: ${data.status}`);
      }

      const element = data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }

      const result = {
        distance_meters: element.distance.value,
        duration_seconds: element.duration.value,
        distance_text: element.distance.text,
        duration_text: element.duration.text,
        from_cache: false
      };

      // 儲存到快取
      await this.cacheDistance(fromLocationId, toLocationId, travelMode, result);

      return result;
    } catch (error) {
      console.error('[DistanceService] Error calculating distance:', error);
      throw error;
    }
  }

  /**
   * 獲取快取的距離資訊
   */
  async getCachedDistance(fromLocationId, toLocationId, travelMode) {
    try {
      const cached = await this.db.prepare(
        `SELECT * FROM location_distances 
         WHERE from_location_id = ? AND to_location_id = ? AND travel_mode = ?`
      ).bind(fromLocationId, toLocationId, travelMode).first();

      return cached;
    } catch (error) {
      console.error('[DistanceService] Error getting cached distance:', error);
      return null;
    }
  }

  /**
   * 快取距離資訊
   */
  async cacheDistance(fromLocationId, toLocationId, travelMode, result) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.cacheExpiryDays);

      await this.db.prepare(
        `INSERT OR REPLACE INTO location_distances 
         (from_location_id, to_location_id, distance_meters, duration_seconds, 
          distance_text, duration_text, travel_mode, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        fromLocationId,
        toLocationId,
        result.distance_meters,
        result.duration_seconds,
        result.distance_text,
        result.duration_text,
        travelMode,
        expiresAt.toISOString()
      ).run();

      return true;
    } catch (error) {
      console.error('[DistanceService] Error caching distance:', error);
      return false;
    }
  }

  /**
   * 檢查快取是否過期
   */
  isCacheExpired(cached) {
    if (!cached.expires_at) {
      return true;
    }
    const expiresAt = new Date(cached.expires_at);
    return expiresAt < new Date();
  }

  /**
   * 從查詢中識別地點並計算距離
   */
  async calculateDistanceFromQuery(query, locationService) {
    try {
      // 簡單的地點識別（可以改進）
      // 尋找 "從 A 到 B" 或 "A 到 B 的距離" 等模式
      const patterns = [
        /從\s*([^到]+)\s*到\s*([^的]+)/,
        /([^到]+)\s*到\s*([^的距離]+)\s*的距離/,
        /([^到]+)\s*到\s*([^多久]+)\s*多久/
      ];

      let fromName = null;
      let toName = null;

      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) {
          fromName = match[1].trim();
          toName = match[2].trim();
          break;
        }
      }

      if (!fromName || !toName) {
        return null;
      }

      // 查詢地點
      const fromLocation = await this.db.prepare(
        'SELECT id FROM locations WHERE name LIKE ? LIMIT 1'
      ).bind(`%${fromName}%`).first();

      const toLocation = await this.db.prepare(
        'SELECT id FROM locations WHERE name LIKE ? LIMIT 1'
      ).bind(`%${toName}%`).first();

      if (!fromLocation || !toLocation) {
        return null;
      }

      // 計算距離
      return await this.calculateDistance(fromLocation.id, toLocation.id);
    } catch (error) {
      console.error('[DistanceService] Error calculating distance from query:', error);
      return null;
    }
  }
}
