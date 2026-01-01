/**
 * 澎湖時光島主遊戲API
 * 實現三元協同遊戲系統的API端點
 */

import { GameService } from '../services/GameService.js';
import { SessionService } from '../services/SessionService.js';

export function createGameRoutes(app, db) {
    const gameService = new GameService(db);
    const sessionService = new SessionService(db);

    // 中間件：檢查用戶認證
    async function requireAuth(request) {
        const sessionId = request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];
        if (!sessionId) {
            return { error: '未登入', status: 401 };
        }

        const session = await sessionService.getSession(sessionId);
        if (!session || session.expires_at < new Date().toISOString()) {
            return { error: '會話已過期', status: 401 };
        }

        return { user: session };
    }

    // 創建記憶膠囊
    app.post('/api/game/memory-capsules', async (c) => {
        try {
            const auth = await requireAuth(c.req);
            if (auth.error) {
                return c.json({ error: auth.error }, auth.status);
            }

            const body = await c.req.json();
            const { location_id, title, content, photo_url, capsule_type } = body;

            if (!location_id || !title) {
                return c.json({ error: '地點ID和標題是必需的' }, 400);
            }

            const capsule = await gameService.createMemoryCapsule(
                auth.user.user_id,
                location_id,
                { title, content, photo_url, capsule_type }
            );

            return c.json({ success: true, capsule });

        } catch (error) {
            console.error('[Game API] 創建記憶膠囊錯誤:', error);
            return c.json({ error: '創建記憶膠囊失敗' }, 500);
        }
    });

    // 獲取記憶膠囊
    app.get('/api/game/memory-capsules/:id', async (c) => {
        try {
            const capsuleId = c.req.param('id');
            const capsule = await gameService.getMemoryCapsule(capsuleId);

            if (!capsule) {
                return c.json({ error: '記憶膠囊不存在' }, 404);
            }

            // 獲取回覆
            const replies = await gameService.getCapsuleReplies(capsuleId);

            return c.json({ 
                success: true, 
                capsule: { ...capsule, replies } 
            });

        } catch (error) {
            console.error('[Game API] 獲取記憶膠囊錯誤:', error);
            return c.json({ error: '獲取記憶膠囊失敗' }, 500);
        }
    });

    // 獲取用戶的記憶膠囊列表
    app.get('/api/game/users/:userId/memory-capsules', async (c) => {
        try {
            const userId = c.req.param('userId');
            const limit = parseInt(c.req.query('limit')) || 20;

            const capsules = await gameService.getUserMemoryCapsules(userId, limit);

            return c.json({ success: true, capsules });

        } catch (error) {
            console.error('[Game API] 獲取用戶記憶膠囊列表錯誤:', error);
            return c.json({ error: '獲取記憶膠囊列表失敗' }, 500);
        }
    });

    // 獲取地點的記憶膠囊列表
    app.get('/api/game/locations/:locationId/memory-capsules', async (c) => {
        try {
            const locationId = c.req.param('locationId');
            const limit = parseInt(c.req.query('limit')) || 20;

            const capsules = await gameService.getLocationMemoryCapsules(locationId, limit);

            return c.json({ success: true, capsules });

        } catch (error) {
            console.error('[Game API] 獲取地點記憶膠囊列表錯誤:', error);
            return c.json({ error: '獲取地點記憶膠囊列表失敗' }, 500);
        }
    });

    // 店家回覆記憶膠囊
    app.post('/api/game/memory-capsules/:capsuleId/replies', async (c) => {
        try {
            const auth = await requireAuth(c.req);
            if (auth.error) {
                return c.json({ error: auth.error }, auth.status);
            }

            const capsuleId = c.req.param('capsuleId');
            const body = await c.req.json();
            const { reply_content, reply_type, special_offer } = body;

            if (!reply_content) {
                return c.json({ error: '回覆內容是必需的' }, 400);
            }

            const reply = await gameService.createMerchantReply(
                auth.user.user_id,
                capsuleId,
                { reply_content, reply_type, special_offer }
            );

            return c.json({ success: true, reply });

        } catch (error) {
            console.error('[Game API] 創建店家回覆錯誤:', error);
            return c.json({ error: '創建店家回覆失敗' }, 500);
        }
    });

    // 更新用戶遊戲角色
    app.put('/api/game/users/:userId/role', async (c) => {
        try {
            const auth = await requireAuth(c.req);
            if (auth.error) {
                return c.json({ error: auth.error }, auth.status);
            }

            const userId = c.req.param('userId');
            
            // 檢查用戶是否只能修改自己的角色
            if (auth.user.user_id !== userId) {
                return c.json({ error: '無權限修改其他用戶角色' }, 403);
            }

            const body = await c.req.json();
            const { game_role } = body;

            if (!['visitor', 'merchant', 'local'].includes(game_role)) {
                return c.json({ error: '無效的遊戲角色' }, 400);
            }

            const success = await gameService.updateUserGameRole(userId, game_role);

            if (success) {
                return c.json({ success: true, message: '角色更新成功' });
            } else {
                return c.json({ error: '角色更新失敗' }, 500);
            }

        } catch (error) {
            console.error('[Game API] 更新用戶角色錯誤:', error);
            return c.json({ error: '更新用戶角色失敗' }, 500);
        }
    });

    // 獲取用戶遊戲統計
    app.get('/api/game/users/:userId/stats', async (c) => {
        try {
            const userId = c.req.param('userId');
            const stats = await gameService.getUserGameStats(userId);

            if (!stats) {
                return c.json({ error: '用戶不存在' }, 404);
            }

            return c.json({ success: true, stats });

        } catch (error) {
            console.error('[Game API] 獲取用戶遊戲統計錯誤:', error);
            return c.json({ error: '獲取用戶遊戲統計失敗' }, 500);
        }
    });

    // 獲取所有勳章列表
    app.get('/api/game/badges', async (c) => {
        try {
            const badges = await db.prepare(
                'SELECT * FROM badges ORDER BY badge_type, points_reward ASC'
            ).all();

            return c.json({ success: true, badges: badges.results || [] });

        } catch (error) {
            console.error('[Game API] 獲取勳章列表錯誤:', error);
            return c.json({ error: '獲取勳章列表失敗' }, 500);
        }
    });

    // 獲取所有任務列表
    app.get('/api/game/tasks', async (c) => {
        try {
            const tasks = await db.prepare(
                'SELECT * FROM game_tasks WHERE is_active = 1 ORDER BY points_reward ASC'
            ).all();

            return c.json({ success: true, tasks: tasks.results || [] });

        } catch (error) {
            console.error('[Game API] 獲取任務列表錯誤:', error);
            return c.json({ error: '獲取任務列表失敗' }, 500);
        }
    });

    // 獲取用戶的任務完成情況
    app.get('/api/game/users/:userId/tasks', async (c) => {
        try {
            const userId = c.req.param('userId');
            
            const tasks = await db.prepare(
                `SELECT t.*, 
                        CASE WHEN utc.id IS NOT NULL THEN 1 ELSE 0 END as is_completed,
                        utc.completed_at
                 FROM game_tasks t
                 LEFT JOIN user_task_completions utc ON t.id = utc.task_id AND utc.user_id = ?
                 WHERE t.is_active = 1
                 ORDER BY t.points_reward ASC`
            ).bind(userId).all();

            return c.json({ success: true, tasks: tasks.results || [] });

        } catch (error) {
            console.error('[Game API] 獲取用戶任務錯誤:', error);
            return c.json({ error: '獲取用戶任務失敗' }, 500);
        }
    });

    // 手動頒發勳章（管理員功能）
    app.post('/api/game/users/:userId/badges/:badgeId', async (c) => {
        try {
            const auth = await requireAuth(c.req);
            if (auth.error) {
                return c.json({ error: auth.error }, auth.status);
            }

            // 檢查是否為管理員
            const user = await db.prepare(
                'SELECT role FROM users WHERE id = ?'
            ).bind(auth.user.user_id).first();

            if (user?.role !== 'admin') {
                return c.json({ error: '需要管理員權限' }, 403);
            }

            const userId = c.req.param('userId');
            const badgeId = c.req.param('badgeId');

            const success = await gameService.awardBadge(userId, badgeId);

            if (success) {
                return c.json({ success: true, message: '勳章頒發成功' });
            } else {
                return c.json({ error: '勳章頒發失敗，可能已經擁有該勳章' }, 400);
            }

        } catch (error) {
            console.error('[Game API] 頒發勳章錯誤:', error);
            return c.json({ error: '頒發勳章失敗' }, 500);
        }
    });

    // 獲取遊戲排行榜
    app.get('/api/game/leaderboard', async (c) => {
        try {
            const type = c.req.query('type') || 'points'; // points, level, memories
            const limit = parseInt(c.req.query('limit')) || 10;

            let query;
            switch (type) {
                case 'level':
                    query = `SELECT id, name, avatar_url, game_role, game_level, game_points 
                             FROM users 
                             WHERE game_level > 0 
                             ORDER BY game_level DESC, game_points DESC 
                             LIMIT ?`;
                    break;
                case 'memories':
                    query = `SELECT u.id, u.name, u.avatar_url, u.game_role, u.game_level, u.game_points,
                                    COUNT(mc.id) as memory_count
                             FROM users u
                             LEFT JOIN memory_capsules mc ON u.id = mc.user_id AND mc.status = 'active'
                             WHERE u.game_level > 0
                             GROUP BY u.id
                             ORDER BY memory_count DESC, u.game_points DESC
                             LIMIT ?`;
                    break;
                default: // points
                    query = `SELECT id, name, avatar_url, game_role, game_level, game_points 
                             FROM users 
                             WHERE game_points > 0 
                             ORDER BY game_points DESC, game_level DESC 
                             LIMIT ?`;
            }

            const leaderboard = await db.prepare(query).bind(limit).all();

            return c.json({ success: true, leaderboard: leaderboard.results || [] });

        } catch (error) {
            console.error('[Game API] 獲取排行榜錯誤:', error);
            return c.json({ error: '獲取排行榜失敗' }, 500);
        }
    });
}
