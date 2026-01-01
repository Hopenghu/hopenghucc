/**
 * 簡化遊戲 API - 專注於即時互動
 */

import { Hono } from 'hono';
import { SimpleGameService } from '../services/SimpleGameService.js';

export function createSimpleGameRoutes(app, db) {
    const gameService = new SimpleGameService(db);

    // 中間件：檢查用戶認證
    app.use('/api/simple-game/*', async (c, next) => {
        const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
        if (!sessionId) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        await next();
    });

    // 獲取用戶遊戲統計
    app.get('/api/simple-game/stats', async (c) => {
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
    app.post('/api/simple-game/memory-capsules', async (c) => {
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

            if (result.success) {
                return c.json({ 
                    success: true, 
                    data: { id: result.id },
                    message: `記憶膠囊創建成功！獲得 ${result.points} 點數！`
                });
            } else {
                return c.json({ error: result.error }, 500);
            }
        } catch (error) {
            console.error('Error creating memory capsule:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 訪問地點
    app.post('/api/simple-game/visit-location', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const { location_id } = await c.req.json();
            
            if (!location_id) {
                return c.json({ error: 'Location ID is required' }, 400);
            }

            const result = await gameService.visitLocation(user.id, location_id);

            if (result.success) {
                return c.json({ 
                    success: true, 
                    message: `地點探索成功！獲得 ${result.points} 點數！`
                });
            } else {
                return c.json({ error: result.error }, 500);
            }
        } catch (error) {
            console.error('Error visiting location:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 完成任務
    app.post('/api/simple-game/complete-task', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const { task_id } = await c.req.json();
            
            if (!task_id) {
                return c.json({ error: 'Task ID is required' }, 400);
            }

            const result = await gameService.completeTask(user.id, task_id);

            if (result.success) {
                return c.json({ 
                    success: true, 
                    message: `任務完成！獲得 ${result.points} 點數！`
                });
            } else {
                return c.json({ error: result.error }, 500);
            }
        } catch (error) {
            console.error('Error completing task:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取澎湖地點
    app.get('/api/simple-game/locations', async (c) => {
        try {
            const locations = await gameService.getPenghuLocations();
            return c.json({ success: true, data: locations });
        } catch (error) {
            console.error('Error getting locations:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取用戶任務
    app.get('/api/simple-game/tasks', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const tasks = await gameService.getUserTasks(user.id);
            return c.json({ success: true, data: tasks });
        } catch (error) {
            console.error('Error getting tasks:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取用戶勳章
    app.get('/api/simple-game/badges', async (c) => {
        try {
            const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
            const user = await getUserFromSession(sessionId, db);
            
            if (!user) {
                return c.json({ error: 'User not found' }, 404);
            }

            const badges = await gameService.getUserBadges(user.id);
            return c.json({ success: true, data: badges });
        } catch (error) {
            console.error('Error getting badges:', error);
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
