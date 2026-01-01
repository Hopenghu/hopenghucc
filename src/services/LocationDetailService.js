/**
 * LocationDetailService - 地點詳情服務
 * 優化地點詳情頁面的數據查詢，減少數據庫查詢次數
 */

export class LocationDetailService {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for LocationDetailService');
    }
    this.db = db;
  }

  /**
   * 批量獲取地點詳情所需的所有數據
   * 這將多個查詢合併為更少的查詢，提高性能
   * 
   * @param {string} locationId - 地點 ID
   * @param {string|null} userId - 用戶 ID（可選）
   * @returns {Promise<object>} 包含所有地點詳情數據的對象
   */
  async getLocationDetailData(locationId, userId = null) {
    try {
      // 使用 Promise.all 並行執行不相關的查詢
      const [
        locationResult,
        favoriteData,
        ratingData,
        commentsResult
      ] = await Promise.all([
        // 1. 獲取地點基本信息
        this.db.prepare(
          `SELECT * FROM locations WHERE id = ?`
        ).bind(locationId).first(),

        // 2. 獲取收藏數據（收藏數量和用戶是否收藏）
        userId 
          ? this.db.prepare(
              `SELECT 
                COUNT(*) as total_favorites,
                MAX(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as is_favorited
              FROM location_favorites
              WHERE location_id = ?`
            ).bind(userId, locationId).first()
          : this.db.prepare(
              `SELECT COUNT(*) as total_favorites, 0 as is_favorited
               FROM location_favorites
               WHERE location_id = ?`
            ).bind(locationId).first(),

        // 3. 獲取評分數據（平均評分、總評分數、評分分布、用戶評分）
        userId
          ? this.db.prepare(
              `SELECT 
                AVG(rating) as average_rating,
                COUNT(*) as rating_count,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
                MAX(CASE WHEN user_id = ? THEN rating ELSE NULL END) as user_rating,
                MAX(CASE WHEN user_id = ? THEN comment ELSE NULL END) as user_rating_comment
              FROM location_ratings
              WHERE location_id = ?`
            ).bind(userId, userId, locationId).first()
          : this.db.prepare(
              `SELECT 
                AVG(rating) as average_rating,
                COUNT(*) as rating_count,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
                NULL as user_rating,
                NULL as user_rating_comment
              FROM location_ratings
              WHERE location_id = ?`
            ).bind(locationId).first(),

        // 4. 獲取評論（前10條）
        this.db.prepare(
          `SELECT 
            lc.*,
            u.name as user_name,
            u.email as user_email,
            u.avatar_url as user_avatar
          FROM location_comments lc
          LEFT JOIN users u ON lc.user_id = u.id
          WHERE lc.location_id = ?
          ORDER BY lc.created_at DESC
          LIMIT 10`
        ).bind(locationId).all()
      ]);

      // 處理結果
      const location = locationResult;
      const favoriteCount = favoriteData?.total_favorites || 0;
      const isFavorited = (favoriteData?.is_favorited || 0) === 1;
      
      const ratingInfo = {
        average: ratingData?.average_rating ? parseFloat(ratingData.average_rating).toFixed(1) : null,
        total: ratingData?.total_ratings || 0,
        userRating: ratingData?.user_rating || null
      };

      const comments = (commentsResult?.results || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_name: comment.user_name || comment.user_email || '匿名用戶',
        user_avatar: comment.user_avatar
      }));

      return {
        location,
        favoriteCount,
        isFavorited,
        ratingInfo,
        comments
      };
    } catch (error) {
      console.error('[LocationDetailService] Error getting location detail data:', error);
      throw error;
    }
  }

  /**
   * 批量獲取驗證相關數據
   * @param {string} locationId - 地點 ID
   * @param {string|null} userId - 用戶 ID（可選）
   * @returns {Promise<object>} 驗證相關數據
   */
  async getVerificationData(locationId, userId = null) {
    try {
      if (!userId) {
        // 如果沒有用戶，只獲取地點的驗證狀態
        const verificationStatus = await this.db.prepare(
          `SELECT 
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COUNT(*) as total_verifications
          FROM business_verifications
          WHERE location_id = ?`
        ).bind(locationId).first();

        return {
          verificationStatus: {
            approved: (verificationStatus?.approved_count || 0) > 0,
            pending: (verificationStatus?.pending_count || 0) > 0,
            total: verificationStatus?.total_verifications || 0
          },
          userVerification: null,
          isUserVerified: false
        };
      }

      // 如果有用戶，並行獲取所有驗證數據
      const [
        verificationStatus,
        userVerifications,
        isUserVerifiedResult
      ] = await Promise.all([
        // 地點的驗證狀態
        this.db.prepare(
          `SELECT 
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COUNT(*) as total_verifications
          FROM business_verifications
          WHERE location_id = ?`
        ).bind(locationId).first(),

        // 用戶的所有驗證申請
        this.db.prepare(
          `SELECT * FROM business_verifications
           WHERE user_id = ?`
        ).bind(userId).all(),

        // 用戶是否已驗證此地點
        this.db.prepare(
          `SELECT 1 FROM business_verifications
           WHERE user_id = ? AND location_id = ? AND status = 'approved'
           LIMIT 1`
        ).bind(userId, locationId).first()
      ]);

      const userVerification = (userVerifications?.results || []).find(
        v => v.location_id === locationId
      ) || null;

      return {
        verificationStatus: {
          approved: (verificationStatus?.approved_count || 0) > 0,
          pending: (verificationStatus?.pending_count || 0) > 0,
          total: verificationStatus?.total_verifications || 0
        },
        userVerification,
        isUserVerified: !!isUserVerifiedResult
      };
    } catch (error) {
      console.error('[LocationDetailService] Error getting verification data:', error);
      throw error;
    }
  }
}

