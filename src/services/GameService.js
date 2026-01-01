/**
 * 澎湖時光島主遊戲服務
 * 基於「人、事、時、地、物」哲學的遊戲化系統
 * 實現三元協同：游客、店家、在地人
 */

export class GameService {
    constructor(db) {
        if (!db) {
            throw new Error("Database connection is required for GameService.");
        }
        this.db = db;
    }

    /**
     * 創建記憶膠囊
     * @param {string} userId - 用戶ID
     * @param {string} locationId - 地點ID
     * @param {object} capsuleData - 膠囊數據
     * @returns {Promise<object>} 創建的記憶膠囊
     */
    async createMemoryCapsule(userId, locationId, capsuleData) {
        const { title, content, photo_url, capsule_type = 'memory' } = capsuleData;
        
        if (!userId || !locationId || !title) {
            throw new Error("用戶ID、地點ID和標題是必需的");
        }

        const capsuleId = crypto.randomUUID();
        const now = new Date().toISOString();

        try {
            // 創建記憶膠囊
            const stmt = this.db.prepare(
                `INSERT INTO memory_capsules 
                 (id, user_id, location_id, title, content, photo_url, capsule_type, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            
            await stmt.bind(
                capsuleId, userId, locationId, title, content, photo_url, capsule_type, now, now
            ).run();

            // 獲取創建的膠囊
            const capsule = await this.getMemoryCapsule(capsuleId);
            
            // 檢查並完成相關任務
            await this.checkAndCompleteTasks(userId, 'memory_upload');
            
            // 更新用戶遊戲點數
            await this.addUserPoints(userId, 10); // 上傳記憶獲得10點

            console.log(`[GameService] 成功創建記憶膠囊: ${capsuleId}`);
            return capsule;

        } catch (error) {
            console.error(`[GameService] 創建記憶膠囊失敗:`, error);
            throw new Error('創建記憶膠囊失敗');
        }
    }

    /**
     * 獲取記憶膠囊
     * @param {string} capsuleId - 膠囊ID
     * @returns {Promise<object|null>} 記憶膠囊對象
     */
    async getMemoryCapsule(capsuleId) {
        try {
            const stmt = this.db.prepare(
                `SELECT mc.*, u.name as user_name, u.avatar_url, u.game_role,
                        l.name as location_name, l.address, l.thumbnail_url
                 FROM memory_capsules mc
                 JOIN users u ON mc.user_id = u.id
                 JOIN locations l ON mc.location_id = l.id
                 WHERE mc.id = ? AND mc.status = 'active'`
            );
            
            const capsule = await stmt.bind(capsuleId).first();
            return capsule || null;

        } catch (error) {
            console.error(`[GameService] 獲取記憶膠囊失敗:`, error);
            throw new Error('獲取記憶膠囊失敗');
        }
    }

    /**
     * 獲取用戶的記憶膠囊列表
     * @param {string} userId - 用戶ID
     * @param {number} limit - 限制數量
     * @returns {Promise<Array>} 記憶膠囊列表
     */
    async getUserMemoryCapsules(userId, limit = 20) {
        try {
            const stmt = this.db.prepare(
                `SELECT mc.*, l.name as location_name, l.address, l.thumbnail_url
                 FROM memory_capsules mc
                 JOIN locations l ON mc.location_id = l.id
                 WHERE mc.user_id = ? AND mc.status = 'active'
                 ORDER BY mc.created_at DESC
                 LIMIT ?`
            );
            
            const { results } = await stmt.bind(userId, limit).all();
            return results || [];

        } catch (error) {
            console.error(`[GameService] 獲取用戶記憶膠囊失敗:`, error);
            throw new Error('獲取用戶記憶膠囊失敗');
        }
    }

    /**
     * 獲取地點的記憶膠囊列表
     * @param {string} locationId - 地點ID
     * @param {number} limit - 限制數量
     * @returns {Promise<Array>} 記憶膠囊列表
     */
    async getLocationMemoryCapsules(locationId, limit = 20) {
        try {
            const stmt = this.db.prepare(
                `SELECT mc.*, u.name as user_name, u.avatar_url, u.game_role
                 FROM memory_capsules mc
                 JOIN users u ON mc.user_id = u.id
                 WHERE mc.location_id = ? AND mc.status = 'active'
                 ORDER BY mc.created_at DESC
                 LIMIT ?`
            );
            
            const { results } = await stmt.bind(locationId, limit).all();
            return results || [];

        } catch (error) {
            console.error(`[GameService] 獲取地點記憶膠囊失敗:`, error);
            throw new Error('獲取地點記憶膠囊失敗');
        }
    }

    /**
     * 店家回覆記憶膠囊
     * @param {string} merchantUserId - 店家用戶ID
     * @param {string} capsuleId - 膠囊ID
     * @param {object} replyData - 回覆數據
     * @returns {Promise<object>} 創建的回覆
     */
    async createMerchantReply(merchantUserId, capsuleId, replyData) {
        const { reply_content, reply_type = 'greeting', special_offer } = replyData;
        
        if (!merchantUserId || !capsuleId || !reply_content) {
            throw new Error("店家用戶ID、膠囊ID和回覆內容是必需的");
        }

        // 檢查店家是否擁有該地點
        const capsule = await this.getMemoryCapsule(capsuleId);
        if (!capsule) {
            throw new Error("記憶膠囊不存在");
        }

        // 檢查店家是否擁有該地點（這裡需要擴展地點擁有權檢查）
        // 暫時允許所有用戶回覆，後續可以加入地點擁有權驗證

        const replyId = crypto.randomUUID();
        const now = new Date().toISOString();

        try {
            const stmt = this.db.prepare(
                `INSERT INTO merchant_replies 
                 (id, capsule_id, merchant_user_id, reply_content, reply_type, special_offer, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            );
            
            await stmt.bind(
                replyId, capsuleId, merchantUserId, reply_content, reply_type, special_offer, now, now
            ).run();

            // 獲取創建的回覆
            const reply = await this.getMerchantReply(replyId);
            
            // 檢查並完成相關任務
            await this.checkAndCompleteTasks(merchantUserId, 'merchant_reply');
            
            // 更新用戶遊戲點數
            await this.addUserPoints(merchantUserId, 15); // 回覆獲得15點

            console.log(`[GameService] 成功創建店家回覆: ${replyId}`);
            return reply;

        } catch (error) {
            console.error(`[GameService] 創建店家回覆失敗:`, error);
            throw new Error('創建店家回覆失敗');
        }
    }

    /**
     * 獲取店家回覆
     * @param {string} replyId - 回覆ID
     * @returns {Promise<object|null>} 回覆對象
     */
    async getMerchantReply(replyId) {
        try {
            const stmt = this.db.prepare(
                `SELECT mr.*, u.name as merchant_name, u.avatar_url, u.game_role
                 FROM merchant_replies mr
                 JOIN users u ON mr.merchant_user_id = u.id
                 WHERE mr.id = ? AND mr.status = 'active'`
            );
            
            const reply = await stmt.bind(replyId).first();
            return reply || null;

        } catch (error) {
            console.error(`[GameService] 獲取店家回覆失敗:`, error);
            throw new Error('獲取店家回覆失敗');
        }
    }

    /**
     * 獲取記憶膠囊的所有回覆
     * @param {string} capsuleId - 膠囊ID
     * @returns {Promise<Array>} 回覆列表
     */
    async getCapsuleReplies(capsuleId) {
        try {
            const stmt = this.db.prepare(
                `SELECT mr.*, u.name as merchant_name, u.avatar_url, u.game_role
                 FROM merchant_replies mr
                 JOIN users u ON mr.merchant_user_id = u.id
                 WHERE mr.capsule_id = ? AND mr.status = 'active'
                 ORDER BY mr.created_at ASC`
            );
            
            const { results } = await stmt.bind(capsuleId).all();
            return results || [];

        } catch (error) {
            console.error(`[GameService] 獲取膠囊回覆失敗:`, error);
            throw new Error('獲取膠囊回覆失敗');
        }
    }

    /**
     * 更新用戶遊戲角色
     * @param {string} userId - 用戶ID
     * @param {string} gameRole - 遊戲角色 (visitor, merchant, local)
     * @returns {Promise<boolean>} 更新成功狀態
     */
    async updateUserGameRole(userId, gameRole) {
        if (!['visitor', 'merchant', 'local'].includes(gameRole)) {
            throw new Error("無效的遊戲角色");
        }

        try {
            const stmt = this.db.prepare(
                `UPDATE users SET game_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            );
            
            const result = await stmt.bind(gameRole, userId).run();
            return result.meta.changes > 0;

        } catch (error) {
            console.error(`[GameService] 更新用戶遊戲角色失敗:`, error);
            throw new Error('更新用戶遊戲角色失敗');
        }
    }

    /**
     * 添加用戶遊戲點數
     * @param {string} userId - 用戶ID
     * @param {number} points - 點數
     * @returns {Promise<boolean>} 更新成功狀態
     */
    async addUserPoints(userId, points) {
        try {
            const stmt = this.db.prepare(
                `UPDATE users SET game_points = game_points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            );
            
            const result = await stmt.bind(points, userId).run();
            
            if (result.meta.changes > 0) {
                // 檢查是否可以升級
                await this.checkUserLevelUp(userId);
                return true;
            }
            return false;

        } catch (error) {
            console.error(`[GameService] 添加用戶點數失敗:`, error);
            throw new Error('添加用戶點數失敗');
        }
    }

    /**
     * 檢查用戶是否可以升級
     * @param {string} userId - 用戶ID
     * @returns {Promise<boolean>} 是否升級成功
     */
    async checkUserLevelUp(userId) {
        try {
            // 獲取用戶當前等級和點數
            const user = await this.db.prepare(
                'SELECT game_level, game_points FROM users WHERE id = ?'
            ).bind(userId).first();

            if (!user) return false;

            const currentLevel = user.game_level || 1;
            const currentPoints = user.game_points || 0;
            
            // 計算所需點數（每級需要 100 * level 點數）
            const requiredPoints = currentLevel * 100;
            
            if (currentPoints >= requiredPoints) {
                // 升級
                const newLevel = currentLevel + 1;
                const stmt = this.db.prepare(
                    `UPDATE users SET game_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                );
                
                await stmt.bind(newLevel, userId).run();
                
                // 檢查是否獲得「時光島主」勳章
                if (newLevel >= 10) {
                    await this.awardBadge(userId, 'island_master');
                }
                
                console.log(`[GameService] 用戶 ${userId} 升級到等級 ${newLevel}`);
                return true;
            }
            
            return false;

        } catch (error) {
            console.error(`[GameService] 檢查用戶升級失敗:`, error);
            return false;
        }
    }

    /**
     * 頒發勳章給用戶
     * @param {string} userId - 用戶ID
     * @param {string} badgeId - 勳章ID
     * @returns {Promise<boolean>} 頒發成功狀態
     */
    async awardBadge(userId, badgeId) {
        try {
            // 檢查用戶是否已經擁有該勳章
            const existing = await this.db.prepare(
                'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?'
            ).bind(userId, badgeId).first();

            if (existing) {
                return false; // 已經擁有該勳章
            }

            // 頒發勳章
            const badgeAwardId = crypto.randomUUID();
            const stmt = this.db.prepare(
                `INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
            );
            
            await stmt.bind(badgeAwardId, userId, badgeId).run();
            
            // 獲取勳章信息並添加點數
            const badge = await this.db.prepare(
                'SELECT points_reward FROM badges WHERE id = ?'
            ).bind(badgeId).first();

            if (badge && badge.points_reward > 0) {
                await this.addUserPoints(userId, badge.points_reward);
            }

            console.log(`[GameService] 成功頒發勳章 ${badgeId} 給用戶 ${userId}`);
            return true;

        } catch (error) {
            console.error(`[GameService] 頒發勳章失敗:`, error);
            return false;
        }
    }

    /**
     * 檢查並完成任務
     * @param {string} userId - 用戶ID
     * @param {string} taskType - 任務類型
     * @returns {Promise<void>}
     */
    async checkAndCompleteTasks(userId, taskType) {
        try {
            // 獲取用戶信息
            const user = await this.db.prepare(
                'SELECT game_role, game_level, game_points FROM users WHERE id = ?'
            ).bind(userId).first();

            if (!user) return;

            // 獲取相關任務
            const tasks = await this.db.prepare(
                `SELECT * FROM game_tasks 
                 WHERE task_type = ? AND is_active = 1 
                 AND (target_role = ? OR target_role = 'all')`
            ).bind(taskType, user.game_role).all();

            for (const task of tasks.results || []) {
                // 檢查是否已經完成
                const completed = await this.db.prepare(
                    'SELECT 1 FROM user_task_completions WHERE user_id = ? AND task_id = ?'
                ).bind(userId, task.id).first();

                if (completed) continue; // 已經完成

                // 檢查任務要求
                const requirements = JSON.parse(task.requirements || '{}');
                let canComplete = true;

                // 根據任務類型檢查要求
                switch (taskType) {
                    case 'memory_upload':
                        const memoryCount = await this.getUserMemoryCount(userId);
                        canComplete = memoryCount >= (requirements.memory_count || 1);
                        break;
                    case 'merchant_reply':
                        const replyCount = await this.getUserReplyCount(userId);
                        canComplete = replyCount >= (requirements.reply_count || 1);
                        break;
                    // 可以添加更多任務類型檢查
                }

                if (canComplete) {
                    // 完成任務
                    const completionId = crypto.randomUUID();
                    await this.db.prepare(
                        `INSERT INTO user_task_completions (id, user_id, task_id, completed_at) 
                         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
                    ).bind(completionId, userId, task.id).run();

                    // 添加點數
                    if (task.points_reward > 0) {
                        await this.addUserPoints(userId, task.points_reward);
                    }

                    // 頒發勳章
                    if (task.badge_reward) {
                        await this.awardBadge(userId, task.badge_reward);
                    }

                    console.log(`[GameService] 用戶 ${userId} 完成任務 ${task.id}`);
                }
            }

        } catch (error) {
            console.error(`[GameService] 檢查任務完成失敗:`, error);
        }
    }

    /**
     * 獲取用戶記憶數量
     * @param {string} userId - 用戶ID
     * @returns {Promise<number>} 記憶數量
     */
    async getUserMemoryCount(userId) {
        try {
            const result = await this.db.prepare(
                'SELECT COUNT(*) as count FROM memory_capsules WHERE user_id = ? AND status = "active"'
            ).bind(userId).first();
            
            return result?.count || 0;
        } catch (error) {
            console.error(`[GameService] 獲取用戶記憶數量失敗:`, error);
            return 0;
        }
    }

    /**
     * 獲取用戶回覆數量
     * @param {string} userId - 用戶ID
     * @returns {Promise<number>} 回覆數量
     */
    async getUserReplyCount(userId) {
        try {
            const result = await this.db.prepare(
                'SELECT COUNT(*) as count FROM merchant_replies WHERE merchant_user_id = ? AND status = "active"'
            ).bind(userId).first();
            
            return result?.count || 0;
        } catch (error) {
            console.error(`[GameService] 獲取用戶回覆數量失敗:`, error);
            return 0;
        }
    }

    /**
     * 獲取用戶遊戲統計
     * @param {string} userId - 用戶ID
     * @returns {Promise<object>} 遊戲統計
     */
    async getUserGameStats(userId) {
        try {
            const user = await this.db.prepare(
                `SELECT game_role, game_level, game_points, game_badges, visit_count, last_visit_date
                 FROM users WHERE id = ?`
            ).bind(userId).first();

            if (!user) return null;

            const memoryCount = await this.getUserMemoryCount(userId);
            const replyCount = await this.getUserReplyCount(userId);
            
            // 獲取用戶勳章
            const badges = await this.db.prepare(
                `SELECT b.* FROM user_badges ub
                 JOIN badges b ON ub.badge_id = b.id
                 WHERE ub.user_id = ?
                 ORDER BY ub.earned_at DESC`
            ).bind(userId).all();

            return {
                game_role: user.game_role,
                game_level: user.game_level,
                game_points: user.game_points,
                visit_count: user.visit_count,
                last_visit_date: user.last_visit_date,
                memory_count: memoryCount,
                reply_count: replyCount,
                badges: badges.results || []
            };

        } catch (error) {
            console.error(`[GameService] 獲取用戶遊戲統計失敗:`, error);
            throw new Error('獲取用戶遊戲統計失敗');
        }
    }
}
