/**
 * 澎湖時光島主遊戲 API
 * 提供完整的遊戲功能接口
 */

import { Hono } from 'hono';
import { PenghuGameService } from '../services/PenghuGameService.js';

export function createPenghuGameRoutes(app, db) {
    const gameService = new PenghuGameService(db);

    // 中間件：檢查用戶認證
    app.use('/api/penghu-game/*', async (c, next) => {
        const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
        if (!sessionId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        await next();
    });

    // 獲取用戶遊戲統計
    app.get('/api/penghu-game/stats', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const stats = await gameService.getUserGameStats(user.id);
            return c.json({ success: true, data: stats });
        } catch (error) {
            console.error('Error getting game stats:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 創建記憶膠囊
    app.post('/api/penghu-game/memory-capsules', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const { location_id, title, content, photo_url, capsule_type } = await c.req.json();
            
            if (!location_id || !title) {
                return c.json({ error: 'Location ID and title are required' }, 400);
            }

            const result = await gameService.createMemoryCapsule(
                user.id, location_id, title, content, photo_url, capsule_type
            );

            return c.json({ 
                success: true, 
                data: { id: result.meta.last_row_id },
                message: '記憶膠囊創建成功！獲得 10 點數！'
            });
        } catch (error) {
            console.error('Error creating memory capsule:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取用戶記憶膠囊
    app.get('/api/penghu-game/memory-capsules/my', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const limit = parseInt(c.req.query('limit')) || 10;
            const capsules = await gameService.getUserMemoryCapsules(user.id, limit);

            return c.json({ success: true, data: capsules });
        } catch (error) {
            console.error('Error getting user memory capsules:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取所有記憶膠囊（探索功能）
    app.get('/api/penghu-game/memory-capsules/explore', async (c) => {
        try {
            const limit = parseInt(c.req.query('limit')) || 20;
            const capsules = await gameService.getAllMemoryCapsules(limit);

            return c.json({ success: true, data: capsules });
        } catch (error) {
            console.error('Error getting all memory capsules:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 回覆記憶膠囊
    app.post('/api/penghu-game/memory-capsules/:id/reply', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const capsuleId = c.req.param('id');
            const { reply_content } = await c.req.json();
            
            if (!reply_content) {
                return c.json({ error: 'Reply content is required' }, 400);
            }

            const result = await gameService.replyToMemoryCapsule(user.id, capsuleId, reply_content);

            return c.json({ 
                success: true, 
                data: { id: result.meta.last_row_id },
                message: '回覆成功！獲得 15 點數！'
            });
        } catch (error) {
            console.error('Error replying to memory capsule:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取排行榜
    app.get('/api/penghu-game/leaderboard', async (c) => {
        try {
            const limit = parseInt(c.req.query('limit')) || 10;
            const leaderboard = await gameService.getLeaderboard(limit);

            return c.json({ success: true, data: leaderboard });
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取用戶任務
    app.get('/api/penghu-game/tasks', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const tasks = await gameService.getUserTasks(user.id);

            return c.json({ success: true, data: tasks });
        } catch (error) {
            console.error('Error getting user tasks:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取用戶勳章
    app.get('/api/penghu-game/badges', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const badges = await gameService.getUserBadges(user.id);

            return c.json({ success: true, data: badges });
        } catch (error) {
            console.error('Error getting user badges:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取澎湖文化數據
    app.get('/api/penghu-game/cultural-data', async (c) => {
        try {
            const locationId = c.req.query('location_id');
            const culturalData = await gameService.getCulturalData(locationId);

            return c.json({ success: true, data: culturalData });
        } catch (error) {
            console.error('Error getting cultural data:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取澎湖地點
    app.get('/api/penghu-game/locations', async (c) => {
        try {
            const locations = await gameService.getPenghuLocations();

            return c.json({ success: true, data: locations });
        } catch (error) {
            console.error('Error getting Penghu locations:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 更新用戶角色
    app.post('/api/penghu-game/role', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const { role } = await c.req.json();
            
            if (!['visitor', 'merchant', 'local'].includes(role)) {
                return c.json({ error: 'Invalid role' }, 400);
            }

            await db.prepare(`
                UPDATE users SET game_role = ? WHERE id = ?
            `).bind(role, user.id).run();

            await db.prepare(`
                UPDATE user_game_stats SET game_role = ? WHERE user_id = ?
            `).bind(role, user.id).run();

            return c.json({ 
                success: true, 
                message: `角色已更新為 ${role === 'visitor' ? '游客' : role === 'merchant' ? '店家' : '在地人'}！`
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            return c.json({ error: error.message }, 500);
        }
    });
}

// 輔助函數：從會話獲取用戶
async function getUserFromSession(sessionId, db) {
    try {
        if (!sessionId) return null;
        
        const session = await db.prepare(`
            SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')
        `).bind(sessionId).first();
        
        if (!session) return null;
        
        const user = await db.prepare(`
            SELECT * FROM users WHERE id = ?
        `).bind(session.user_id).first();
        
        return user;
    } catch (error) {
        console.error('Error getting user from session:', error);
        return null;
    }
}
