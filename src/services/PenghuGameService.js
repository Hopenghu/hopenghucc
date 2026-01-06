/**
 * 澎湖時光島主遊戲服務
 * 實現完整的遊戲邏輯和文化元素
 */

import { LocationService } from './LocationService.js';

export class PenghuGameService {
    constructor(db) {
        this.db = db;
        this.locationService = new LocationService(db);
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
            throw error;
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
            throw error;
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

            // 檢查是否達到新等級
            const newLevel = await this.checkLevelUp(userId);
            return { newLevel, points, memoryCount, replyCount, taskCompletedCount, visitCount };
        } catch (error) {
            console.error('Error updating game stats:', error);
            throw error;
        }
    }

    // 檢查升級
    async checkLevelUp(userId) {
        try {
            const stats = await this.getUserGameStats(userId);
            const newLevel = Math.floor(stats.game_points / 100) + 1;
            
            if (newLevel > stats.game_level) {
                await this.db.prepare(`
                    UPDATE user_game_stats 
                    SET game_level = ?, updated_at = datetime('now')
                    WHERE user_id = ?
                `).bind(newLevel, userId).run();
                
                // 檢查是否獲得新勳章
                await this.checkBadges(userId);
                return newLevel;
            }
            
            return stats.game_level;
        } catch (error) {
            console.error('Error checking level up:', error);
            throw error;
        }
    }

    // 檢查勳章
    async checkBadges(userId) {
        try {
            const stats = await this.getUserGameStats(userId);
            const badges = await this.db.prepare(`
                SELECT * FROM game_badges
            `).all();

            for (const badge of badges.results) {
                const requirements = JSON.parse(badge.requirements);
                let earned = true;

                for (const [key, value] of Object.entries(requirements)) {
                    if (stats[key] < value) {
                        earned = false;
                        break;
                    }
                }

                if (earned) {
                    // 檢查是否已經獲得這個勳章
                    const existing = await this.db.prepare(`
                        SELECT * FROM user_badges 
                        WHERE user_id = ? AND badge_id = ?
                    `).bind(userId, badge.id).first();

                    if (!existing) {
                        await this.db.prepare(`
                            INSERT INTO user_badges (user_id, badge_id, earned_at)
                            VALUES (?, ?, datetime('now'))
                        `).bind(userId, badge.id).run();
                    }
                }
            }
        } catch (error) {
            console.error('Error checking badges:', error);
            throw error;
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

            // 檢查任務完成
            await this.checkTasks(userId, 'memory_capsule');

            return result;
        } catch (error) {
            console.error('Error creating memory capsule:', error);
            throw error;
        }
    }

    // 獲取用戶記憶膠囊
    async getUserMemoryCapsules(userId, limit = 10) {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    mc.*,
                    l.name as location_name,
                    l.latitude,
                    l.longitude,
                    l.category
                FROM memory_capsules mc
                LEFT JOIN locations l ON mc.location_id = l.id
                WHERE mc.user_id = ?
                ORDER BY mc.created_at DESC
                LIMIT ?
            `).bind(userId, limit).all();

            return result.results;
        } catch (error) {
            console.error('Error getting user memory capsules:', error);
            throw error;
        }
    }

    // 獲取所有記憶膠囊（用於探索）
    async getAllMemoryCapsules(limit = 20) {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    mc.*,
                    l.name as location_name,
                    l.latitude,
                    l.longitude,
                    l.category,
                    u.name as user_name,
                    u.game_role
                FROM memory_capsules mc
                LEFT JOIN locations l ON mc.location_id = l.id
                LEFT JOIN users u ON mc.user_id = u.id
                ORDER BY mc.created_at DESC
                LIMIT ?
            `).bind(limit).all();

            return result.results;
        } catch (error) {
            console.error('Error getting all memory capsules:', error);
            throw error;
        }
    }

    // 回覆記憶膠囊
    async replyToMemoryCapsule(userId, capsuleId, replyContent) {
        try {
            // 獲取記憶膠囊信息
            const capsule = await this.db.prepare(`
                SELECT * FROM memory_capsules WHERE id = ?
            `).bind(capsuleId).first();

            if (!capsule) {
                throw new Error('Memory capsule not found');
            }

            // 創建回覆
            const result = await this.db.prepare(`
                INSERT INTO merchant_replies (
                    memory_capsule_id, user_id, reply_content, created_at
                ) VALUES (?, ?, ?, datetime('now'))
            `).bind(capsuleId, userId, replyContent).run();

            // 更新統計
            await this.updateGameStats(userId, { 
                points: 15, 
                replyCount: 1 
            });

            // 檢查任務完成
            await this.checkTasks(userId, 'reply_memory');

            return result;
        } catch (error) {
            console.error('Error replying to memory capsule:', error);
            throw error;
        }
    }

    // 檢查任務完成
    async checkTasks(userId, taskType) {
        try {
            const tasks = await this.db.prepare(`
                SELECT * FROM game_tasks WHERE task_type = ?
            `).bind(taskType).all();

            for (const task of tasks.results) {
                const requirements = JSON.parse(task.requirements);
                const stats = await this.getUserGameStats(userId);
                
                let completed = true;
                for (const [key, value] of Object.entries(requirements)) {
                    if (stats[key] < value) {
                        completed = false;
                        break;
                    }
                }

                if (completed) {
                    // 檢查是否已經完成這個任務
                    const existing = await this.db.prepare(`
                        SELECT * FROM user_tasks 
                        WHERE user_id = ? AND task_id = ?
                    `).bind(userId, task.id).first();

                    if (!existing) {
                        await this.db.prepare(`
                            INSERT INTO user_tasks (user_id, task_id, completed_at)
                            VALUES (?, ?, datetime('now'))
                        `).bind(userId, task.id).run();

                        // 給予任務獎勵
                        await this.updateGameStats(userId, { 
                            points: task.points_reward, 
                            taskCompletedCount: 1 
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error checking tasks:', error);
            throw error;
        }
    }

    // 獲取排行榜
    async getLeaderboard(limit = 10) {
        try {
            const result = await this.db.prepare(`
                SELECT 
                    ugs.*,
                    u.name as user_name,
                    u.email
                FROM user_game_stats ugs
                LEFT JOIN users u ON ugs.user_id = u.id
                ORDER BY ugs.game_points DESC, ugs.game_level DESC
                LIMIT ?
            `).bind(limit).all();

            return result.results;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
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
            `).bind(userId).all();

            return result.results;
        } catch (error) {
            console.error('Error getting user tasks:', error);
            throw error;
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
            `).bind(userId).all();

            return result.results;
        } catch (error) {
            console.error('Error getting user badges:', error);
            throw error;
        }
    }

    // 獲取澎湖文化數據
    async getCulturalData(locationId = null) {
        try {
            let query = `
                SELECT 
                    cd.*,
                    l.name as location_name
                FROM cultural_data cd
                LEFT JOIN locations l ON cd.location_id = l.id
            `;
            
            let params = [];
            if (locationId) {
                query += ' WHERE cd.location_id = ?';
                params.push(locationId);
            }
            
            query += ' ORDER BY cd.created_at DESC';
            
            const result = await this.db.prepare(query).bind(...params).all();
            return result.results;
        } catch (error) {
            console.error('Error getting cultural data:', error);
            throw error;
        }
    }

    // 獲取澎湖地點
    async getPenghuLocations() {
        try {
            const result = await this.db.prepare(`
                SELECT * FROM locations 
                ORDER BY created_at DESC
            `).all();

            return result.results;
        } catch (error) {
            console.error('Error getting Penghu locations:', error);
            throw error;
        }
    }
}
