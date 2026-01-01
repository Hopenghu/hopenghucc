/**
 * BusinessVerificationService - 商家驗證服務
 * 處理商家驗證申請、審核和管理
 */
export class BusinessVerificationService {
    constructor(db) {
        if (!db) {
            throw new Error('Database connection is required for BusinessVerificationService');
        }
        this.db = db;
    }

    /**
     * 用戶申請驗證商家擁有權
     * @param {string} locationId - 地點 ID
     * @param {string} userId - 用戶 ID
     * @param {string} googlePlaceId - Google Place ID（可選）
     * @returns {Promise<object>} 驗證申請結果
     */
    async requestVerification(locationId, userId, googlePlaceId = null) {
        try {
            // 檢查是否已有待處理的申請
            const existing = await this.db.prepare(
                `SELECT id, status FROM business_verifications 
                 WHERE location_id = ? AND user_id = ? AND status = 'pending'`
            ).bind(locationId, userId).first();

            if (existing) {
                return {
                    success: false,
                    message: '您已經有一個待處理的驗證申請',
                    verificationId: existing.id
                };
            }

            // 如果沒有提供 googlePlaceId，嘗試從 locations 表獲取
            if (!googlePlaceId) {
                const location = await this.db.prepare(
                    'SELECT google_place_id FROM locations WHERE id = ?'
                ).bind(locationId).first();
                googlePlaceId = location?.google_place_id || null;
            }

            // 創建驗證申請（ID 由數據庫自動生成）
            const result = await this.db.prepare(`
                INSERT INTO business_verifications 
                (location_id, user_id, google_place_id, status, verification_method, requested_at)
                VALUES (?, ?, ?, 'pending', 'manual_review', datetime('now'))
            `).bind(locationId, userId, googlePlaceId).run();

            // 獲取剛創建的驗證申請 ID
            const verification = await this.db.prepare(
                `SELECT id FROM business_verifications 
                 WHERE location_id = ? AND user_id = ? AND status = 'pending'
                 ORDER BY requested_at DESC LIMIT 1`
            ).bind(locationId, userId).first();

            return {
                success: true,
                message: '驗證申請已提交，等待管理員審核',
                verificationId: verification?.id || null,
                status: 'pending'
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error requesting verification:', error);
            throw error;
        }
    }

    /**
     * 管理員批准驗證
     * @param {string} verificationId - 驗證申請 ID
     * @param {string} adminUserId - 管理員用戶 ID
     * @param {string} notes - 備註（可選）
     * @returns {Promise<object>} 批准結果
     */
    async approveVerification(verificationId, adminUserId, notes = null) {
        try {
            const verification = await this.db.prepare(
                'SELECT * FROM business_verifications WHERE id = ?'
            ).bind(verificationId).first();

            if (!verification) {
                return { success: false, message: '驗證申請不存在' };
            }

            if (verification.status !== 'pending') {
                return {
                    success: false,
                    message: `驗證申請狀態為 ${verification.status}，無法批准`
                };
            }

            // 更新驗證狀態
            await this.db.prepare(`
                UPDATE business_verifications 
                SET status = 'approved', 
                    verified_at = datetime('now'),
                    verified_by = ?,
                    notes = ?,
                    updated_at = datetime('now')
                WHERE id = ?
            `).bind(adminUserId, notes, verificationId).run();

            // 可以考慮在這裡更新 locations 表的驗證狀態
            // 例如添加 verified_by_user_id 字段

            return {
                success: true,
                message: '驗證已批准',
                verificationId: verificationId,
                status: 'approved'
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error approving verification:', error);
            throw error;
        }
    }

    /**
     * 管理員拒絕驗證
     * @param {string} verificationId - 驗證申請 ID
     * @param {string} adminUserId - 管理員用戶 ID
     * @param {string} rejectionReason - 拒絕原因
     * @returns {Promise<object>} 拒絕結果
     */
    /**
     * 批量批准驗證申請
     * @param {string[]} verificationIds - 驗證申請 ID 數組
     * @param {string} adminUserId - 管理員用戶 ID
     * @param {string} notes - 備註（可選）
     * @returns {Promise<object>} 批量操作結果
     */
    async batchApproveVerifications(verificationIds, adminUserId, notes = null) {
        if (!Array.isArray(verificationIds) || verificationIds.length === 0) {
            return {
                success: false,
                message: '請選擇至少一個驗證申請',
                approved: 0,
                failed: 0,
                errors: []
            };
        }

        const results = {
            success: true,
            approved: 0,
            failed: 0,
            errors: []
        };

        // 使用事務處理批量操作
        try {
            // 獲取所有待審核的驗證申請
            const placeholders = verificationIds.map(() => '?').join(',');
            const verifications = await this.db.prepare(
                `SELECT id, status FROM business_verifications 
                 WHERE id IN (${placeholders}) AND status = 'pending'`
            ).bind(...verificationIds).all();

            const validIds = verifications.results.map(v => v.id);
            const invalidIds = verificationIds.filter(id => !validIds.includes(id));

            if (invalidIds.length > 0) {
                results.errors.push({
                    ids: invalidIds,
                    message: '部分申請不存在或不是待審核狀態'
                });
            }

            // 批量更新
            if (validIds.length > 0) {
                const updatePlaceholders = validIds.map(() => '?').join(',');
                const now = new Date().toISOString();
                
                await this.db.prepare(
                    `UPDATE business_verifications 
                     SET status = 'approved', 
                         verified_at = ?, 
                         verified_by = ?, 
                         notes = ?,
                         updated_at = ?
                     WHERE id IN (${updatePlaceholders}) AND status = 'pending'`
                ).bind(now, adminUserId, notes || null, now, ...validIds).run();

                results.approved = validIds.length;
            }

            results.failed = invalidIds.length;
            results.message = `成功批准 ${results.approved} 個申請${results.failed > 0 ? `，${results.failed} 個失敗` : ''}`;

            return results;
        } catch (error) {
            console.error('[BusinessVerificationService] Error in batch approve:', error);
            return {
                success: false,
                message: '批量批准失敗：' + (error.message || '未知錯誤'),
                approved: 0,
                failed: verificationIds.length,
                errors: [{ message: error.message }]
            };
        }
    }

    /**
     * 批量拒絕驗證申請
     * @param {string[]} verificationIds - 驗證申請 ID 數組
     * @param {string} adminUserId - 管理員用戶 ID
     * @param {string} rejectionReason - 拒絕原因
     * @returns {Promise<object>} 批量操作結果
     */
    async batchRejectVerifications(verificationIds, adminUserId, rejectionReason) {
        if (!Array.isArray(verificationIds) || verificationIds.length === 0) {
            return {
                success: false,
                message: '請選擇至少一個驗證申請',
                rejected: 0,
                failed: 0,
                errors: []
            };
        }

        if (!rejectionReason || !rejectionReason.trim()) {
            return {
                success: false,
                message: '拒絕原因不能為空',
                rejected: 0,
                failed: verificationIds.length,
                errors: []
            };
        }

        const results = {
            success: true,
            rejected: 0,
            failed: 0,
            errors: []
        };

        try {
            // 獲取所有待審核的驗證申請
            const placeholders = verificationIds.map(() => '?').join(',');
            const verifications = await this.db.prepare(
                `SELECT id, status FROM business_verifications 
                 WHERE id IN (${placeholders}) AND status = 'pending'`
            ).bind(...verificationIds).all();

            const validIds = verifications.results.map(v => v.id);
            const invalidIds = verificationIds.filter(id => !validIds.includes(id));

            if (invalidIds.length > 0) {
                results.errors.push({
                    ids: invalidIds,
                    message: '部分申請不存在或不是待審核狀態'
                });
            }

            // 批量更新
            if (validIds.length > 0) {
                const updatePlaceholders = validIds.map(() => '?').join(',');
                const now = new Date().toISOString();
                
                await this.db.prepare(
                    `UPDATE business_verifications 
                     SET status = 'rejected', 
                         verified_at = ?, 
                         verified_by = ?, 
                         rejection_reason = ?,
                         updated_at = ?
                     WHERE id IN (${updatePlaceholders}) AND status = 'pending'`
                ).bind(now, adminUserId, rejectionReason.trim(), now, ...validIds).run();

                results.rejected = validIds.length;
            }

            results.failed = invalidIds.length;
            results.message = `成功拒絕 ${results.rejected} 個申請${results.failed > 0 ? `，${results.failed} 個失敗` : ''}`;

            return results;
        } catch (error) {
            console.error('[BusinessVerificationService] Error in batch reject:', error);
            return {
                success: false,
                message: '批量拒絕失敗：' + (error.message || '未知錯誤'),
                rejected: 0,
                failed: verificationIds.length,
                errors: [{ message: error.message }]
            };
        }
    }

    async rejectVerification(verificationId, adminUserId, rejectionReason) {
        try {
            const verification = await this.db.prepare(
                'SELECT * FROM business_verifications WHERE id = ?'
            ).bind(verificationId).first();

            if (!verification) {
                return { success: false, message: '驗證申請不存在' };
            }

            if (verification.status !== 'pending') {
                return {
                    success: false,
                    message: `驗證申請狀態為 ${verification.status}，無法拒絕`
                };
            }

            // 更新驗證狀態
            await this.db.prepare(`
                UPDATE business_verifications 
                SET status = 'rejected', 
                    verified_at = datetime('now'),
                    verified_by = ?,
                    rejection_reason = ?,
                    updated_at = datetime('now')
                WHERE id = ?
            `).bind(adminUserId, rejectionReason, verificationId).run();

            return {
                success: true,
                message: '驗證已拒絕',
                verificationId: verificationId,
                status: 'rejected'
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error rejecting verification:', error);
            throw error;
        }
    }

    /**
     * 獲取驗證申請詳情
     * @param {string} verificationId - 驗證申請 ID
     * @returns {Promise<object|null>} 驗證申請詳情
     */
    async getVerification(verificationId) {
        try {
            const verification = await this.db.prepare(
                `SELECT bv.*, 
                        u.email as user_email, u.name as user_name,
                        l.id as location_id,
                        l.name as location_name, 
                        l.address as location_address,
                        l.google_place_id as location_google_place_id,
                        l.phone_number as location_phone,
                        l.website as location_website,
                        l.latitude as location_latitude,
                        l.longitude as location_longitude,
                        admin.email as verified_by_email, admin.name as verified_by_name
                 FROM business_verifications bv
                 LEFT JOIN users u ON bv.user_id = u.id
                 LEFT JOIN locations l ON bv.location_id = l.id
                 LEFT JOIN users admin ON bv.verified_by = admin.id
                 WHERE bv.id = ?`
            ).bind(verificationId).first();

            return verification || null;
        } catch (error) {
            console.error('[BusinessVerificationService] Error getting verification:', error);
            throw error;
        }
    }

    /**
     * 獲取用戶的驗證申請列表
     * @param {string} userId - 用戶 ID
     * @returns {Promise<Array>} 驗證申請列表
     */
    async getUserVerifications(userId) {
        try {
            const { results } = await this.db.prepare(
                `SELECT bv.*, l.name as location_name, l.address as location_address
                 FROM business_verifications bv
                 LEFT JOIN locations l ON bv.location_id = l.id
                 WHERE bv.user_id = ?
                 ORDER BY bv.requested_at DESC`
            ).bind(userId).all();

            return results || [];
        } catch (error) {
            console.error('[BusinessVerificationService] Error getting user verifications:', error);
            throw error;
        }
    }

    /**
     * 獲取地點的驗證狀態
     * @param {string} locationId - 地點 ID
     * @returns {Promise<object|null>} 驗證狀態
     */
    async getLocationVerificationStatus(locationId) {
        try {
            const verification = await this.db.prepare(
                `SELECT bv.*, u.email as user_email, u.name as user_name
                 FROM business_verifications bv
                 LEFT JOIN users u ON bv.user_id = u.id
                 WHERE bv.location_id = ? AND bv.status = 'approved'
                 ORDER BY bv.verified_at DESC
                 LIMIT 1`
            ).bind(locationId).first();

            return verification || null;
        } catch (error) {
            console.error('[BusinessVerificationService] Error getting location verification status:', error);
            throw error;
        }
    }

    /**
     * 獲取所有待審核的驗證申請（管理員用）
     * @param {number} limit - 限制數量
     * @param {number} offset - 偏移量
     * @returns {Promise<object>} 驗證申請列表和總數
     */
    async getPendingVerifications(limit = 20, offset = 0) {
        try {
            const { results } = await this.db.prepare(
                `SELECT bv.*, 
                        u.email as user_email, u.name as user_name,
                        l.name as location_name, l.address as location_address
                 FROM business_verifications bv
                 LEFT JOIN users u ON bv.user_id = u.id
                 LEFT JOIN locations l ON bv.location_id = l.id
                 WHERE bv.status = 'pending'
                 ORDER BY bv.requested_at ASC
                 LIMIT ? OFFSET ?`
            ).bind(limit, offset).all();

            const totalResult = await this.db.prepare(
                'SELECT COUNT(*) as total FROM business_verifications WHERE status = ?'
            ).bind('pending').first();

            return {
                verifications: results || [],
                total: totalResult?.total || 0,
                limit,
                offset
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error getting pending verifications:', error);
            throw error;
        }
    }

    /**
     * 檢查用戶是否已驗證某個地點
     * @param {string} userId - 用戶 ID
     * @param {string} locationId - 地點 ID
     * @returns {Promise<boolean>} 是否已驗證
     */
    async isUserVerifiedForLocation(userId, locationId) {
        try {
            const verification = await this.db.prepare(
                `SELECT id FROM business_verifications 
                 WHERE user_id = ? AND location_id = ? AND status = 'approved'`
            ).bind(userId, locationId).first();

            return !!verification;
        } catch (error) {
            console.error('[BusinessVerificationService] Error checking verification:', error);
            return false;
        }
    }

    /**
     * 生成唯一 ID（使用 SQLite 的 randomblob 和 hex 函數）
     * 注意：實際 ID 由數據庫的 DEFAULT (lower(hex(randomblob(16)))) 生成
     * 此方法僅作為備用
     * @returns {string} 唯一 ID
     */
    generateId() {
        // 使用時間戳和隨機數生成 ID
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        return (timestamp + random).substring(0, 32);
    }

    /**
     * 管理員發起驗證流程（為 Place ID 預註冊）
     * @param {string} placeId - Google Place ID
     * @param {object} adminUser - 管理員用戶對象
     * @returns {Promise<object>} 操作結果
     */
    async adminInitiateForPlaceId(placeId, adminUser) {
        try {
            // 查找對應的地點
            const location = await this.db.prepare(
                'SELECT id, name FROM locations WHERE google_place_id = ?'
            ).bind(placeId).first();

            if (!location) {
                return {
                    success: false,
                    message: `找不到對應的 Place ID: ${placeId}`
                };
            }

            return {
                success: true,
                message: `已找到地點「${location.name}」，可以開始驗證流程`,
                locationId: location.id,
                placeId: placeId,
                adminEmail: adminUser ? adminUser.email : 'N/A'
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error in adminInitiateForPlaceId:', error);
            throw error;
        }
    }

    /**
     * 用戶申請驗證（兼容舊接口）
     * @param {string} placeId - Google Place ID
     * @param {object} user - 用戶對象
     * @returns {Promise<object>} 申請結果
     */
    async userRequestVerificationForPlaceId(placeId, user) {
        if (!user || !user.id) {
            return { success: false, message: "User not logged in or user ID not available." };
        }

        try {
            // 查找對應的地點
            const location = await this.db.prepare(
                'SELECT id FROM locations WHERE google_place_id = ?'
            ).bind(placeId).first();

            if (!location) {
                return {
                    success: false,
                    message: `找不到對應的 Place ID: ${placeId}，請先添加地點`
                };
            }

            // 使用新的 requestVerification 方法
            return await this.requestVerification(location.id, user.id, placeId);
        } catch (error) {
            console.error('[BusinessVerificationService] Error in userRequestVerificationForPlaceId:', error);
            throw error;
        }
    }
    /**
     * 獲取所有驗證申請（支援篩選）
     * @param {number} limit - 限制數量
     * @param {number} offset - 偏移量
     * @param {string} status - 狀態篩選（可選）
     * @returns {Promise<object>} 驗證申請列表和總數
     */
    async getAllVerifications(limit = 20, offset = 0, status = null, search = null) {
        try {
            let query = `
                SELECT bv.*, 
                       u.email as user_email, u.name as user_name,
                       l.name as location_name, l.address as location_address,
                       admin.email as verified_by_email, admin.name as verified_by_name
                FROM business_verifications bv
                LEFT JOIN users u ON bv.user_id = u.id
                LEFT JOIN locations l ON bv.location_id = l.id
                LEFT JOIN users admin ON bv.verified_by = admin.id
            `;

            let countQuery = `
                SELECT COUNT(*) as total 
                FROM business_verifications bv
                LEFT JOIN users u ON bv.user_id = u.id
                LEFT JOIN locations l ON bv.location_id = l.id
            `;
            
            const params = [];
            const countParams = [];
            const conditions = [];

            // 狀態篩選
            if (status) {
                conditions.push('bv.status = ?');
                params.push(status);
                countParams.push(status);
            }

            // 搜尋功能（支援商家名稱和申請人 Email）
            if (search && search.trim()) {
                const searchTerm = '%' + search.trim() + '%';
                conditions.push('(l.name LIKE ? OR u.email LIKE ? OR u.name LIKE ? OR l.address LIKE ?)');
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
                countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            // 組合 WHERE 子句
            if (conditions.length > 0) {
                const whereClause = ' WHERE ' + conditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }

            query += ' ORDER BY bv.requested_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const { results } = await this.db.prepare(query).bind(...params).all();
            const totalResult = await this.db.prepare(countQuery).bind(...countParams).first();

            return {
                verifications: results || [],
                total: totalResult?.total || 0,
                limit,
                offset,
                search: search || null
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error getting all verifications:', error);
            throw error;
        }
    }

    /**
     * 獲取驗證統計數據
     * @returns {Promise<object>} 統計數據
     */
    async getStatistics() {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    COUNT(*) as total
                FROM business_verifications
            `).first();

            return {
                pending: result?.pending || 0,
                approved: result?.approved || 0,
                rejected: result?.rejected || 0,
                total: result?.total || 0
            };
        } catch (error) {
            console.error('[BusinessVerificationService] Error getting statistics:', error);
            // 如果表不存在，返回全 0
            return { pending: 0, approved: 0, rejected: 0, total: 0 };
        }
    }
}
