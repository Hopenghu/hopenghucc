/**
 * 簡化遊戲服務 - 專注於即時互動和反饋
 */

export class SimpleGameService {
    constructor(db) {
        this.db = db;
    }

    // 獲取用戶遊戲統計
    async getUserGameStats(userId) {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    game_level,
                    game_points,
                    memory_count,
                    reply_count,
                    task_completed_count,
                    visit_count,
                    game_role,
                    created_at,
                    updated_at
                FROM user_game_stats 
                WHERE user_id = ?
            `).bind(userId).first();

            if (!result) {
                // 如果沒有統計數據，創建默認統計
                await this.createUserGameStats(userId);
                return await this.getUserGameStats(userId);
            }

            return result;
        } catch (error) {
            console.error('Error getting user game stats:', error);
            // 返回默認值
            return {
                game_level: 1,
                game_points: 0,
                memory_count: 0,
                reply_count: 0,
                task_completed_count: 0,
                visit_count: 0,
                game_role: 'visitor'
            };
        }
    }

    // 創建用戶遊戲統計
    async createUserGameStats(userId) {
        try {
            await this.db.prepare(`
                INSERT INTO user_game_stats (
                    user_id, game_level, game_points, memory_count, 
                    reply_count, task_completed_count, visit_count, game_role
                ) VALUES (?, 1, 0, 0, 0, 0, 0, 'visitor')
            `).bind(userId).run();
        } catch (error) {
            console.error('Error creating user game stats:', error);
        }
    }

    // 更新遊戲統計
    async updateGameStats(userId, updates) {
        try {
            const { points = 0, level = 0, memoryCount = 0, replyCount = 0, taskCompletedCount = 0, visitCount = 0 } = updates;
            
            await this.db.prepare(`
                UPDATE user_game_stats 
                SET 
                    game_level = game_level + ?,
                    game_points = game_points + ?,
                    memory_count = memory_count + ?,
                    reply_count = reply_count + ?,
                    task_completed_count = task_completed_count + ?,
                    visit_count = visit_count + ?,
                    updated_at = datetime('now')
                WHERE user_id = ?
            `).bind(level, points, memoryCount, replyCount, taskCompletedCount, visitCount, userId).run();

            return { success: true, points, memoryCount, replyCount, taskCompletedCount, visitCount };
        } catch (error) {
            console.error('Error updating game stats:', error);
            return { success: false, error: error.message };
        }
    }

    // 創建記憶膠囊
    async createMemoryCapsule(userId, locationId, title, content, photoUrl, capsuleType = 'memory') {
        try {
            // 創建記憶膠囊
            const result = await this.db.prepare(`
                INSERT INTO memory_capsules (
                    user_id, location_id, title, content, photo_url, capsule_type, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(userId, locationId, title, content, photoUrl, capsuleType).run();

            // 更新統計
            await this.updateGameStats(userId, { 
                points: 10, 
                memoryCount: 1 
            });

            return { success: true, id: result.meta.last_row_id, points: 10 };
        } catch (error) {
            console.error('Error creating memory capsule:', error);
            return { success: false, error: error.message };
        }
    }

    // 獲取澎湖地點
    async getPenghuLocations() {
        try {
            const result = await this.db.prepare(`
                SELECT * FROM locations 
                WHERE editorial_summary IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 10
            `).all();

            return result.results || [];
        } catch (error) {
            console.error('Error getting Penghu locations:', error);
            return [];
        }
    }

    // 獲取用戶任務
    async getUserTasks(userId) {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    gt.*,
                    ut.completed_at,
                    CASE WHEN ut.id IS NOT NULL THEN 1 ELSE 0 END as completed
                FROM game_tasks gt
                LEFT JOIN user_tasks ut ON gt.id = ut.task_id AND ut.user_id = ?
                ORDER BY gt.points_reward DESC
                LIMIT 5
            `).bind(userId).all();

            return result.results || [];
        } catch (error) {
            console.error('Error getting user tasks:', error);
            return [];
        }
    }

    // 獲取用戶勳章
    async getUserBadges(userId) {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    gb.*,
                    ub.earned_at
                FROM game_badges gb
                LEFT JOIN user_badges ub ON gb.id = ub.badge_id AND ub.user_id = ?
                ORDER BY ub.earned_at DESC
                LIMIT 6
            `).bind(userId).all();

            return result.results || [];
        } catch (error) {
            console.error('Error getting user badges:', error);
            return [];
        }
    }

    // 模擬地點訪問
    async visitLocation(userId, locationId) {
        try {
            const result = await this.updateGameStats(userId, { 
                points: 5, 
                visitCount: 1 
            });
            return { success: true, points: 5 };
        } catch (error) {
            console.error('Error visiting location:', error);
            return { success: false, error: error.message };
        }
    }

    // 模擬任務完成
    async completeTask(userId, taskId) {
        try {
            const result = await this.updateGameStats(userId, { 
                points: 20, 
                taskCompletedCount: 1 
            });
            return { success: true, points: 20 };
        } catch (error) {
            console.error('Error completing task:', error);
            return { success: false, error: error.message };
        }
    }
}
