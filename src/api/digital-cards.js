/**
 * 數位卡牌API路由
 * 處理卡牌購買、激活、轉讓等操作
 */

import { Hono } from 'hono';
import { DigitalCardService } from '../services/DigitalCardService.js';

export function createDigitalCardRoutes(app, db) {
    const cardService = new DigitalCardService(db);

    // 認證中間件
    app.use('/api/digital-cards/*', async (c, next) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Authentication required' }, 401);
        }
        await next();
    });

    // 獲取卡牌包資訊
    app.get('/api/digital-cards/packages', async (c) => {
        try {
            const userPackage = await cardService.getCardPackageInfo('user');
            const merchantPackage = await cardService.getCardPackageInfo('merchant');
            
            return c.json({
                user_package: userPackage,
                merchant_package: merchantPackage
            });
        } catch (error) {
            console.error('Error getting card packages:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 購買卡牌包
    app.post('/api/digital-cards/purchase', async (c) => {
        const user = c.get('user');
        const { package_type, payment_method, payment_reference } = await c.req.json();

        if (!package_type || !payment_method) {
            return c.json({ error: 'Package type and payment method are required' }, 400);
        }

        try {
            // 這裡應該先處理支付，支付成功後再創建卡牌
            // 為了演示，我們直接創建卡牌
            const result = await cardService.createCardPackage(package_type, user.id);
            
            return c.json({
                message: 'Card package purchased successfully',
                package: result.package,
                cards: result.cards,
                transaction_id: result.transactionId
            });
        } catch (error) {
            console.error('Error purchasing card package:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取用戶卡牌
    app.get('/api/digital-cards/my-cards', async (c) => {
        const user = c.get('user');
        const includeUsed = c.req.query('include_used') === 'true';

        try {
            const cards = await cardService.getUserCards(user.id, includeUsed);
            const stats = await cardService.getCardStats(user.id);
            
            return c.json({
                cards: cards,
                stats: stats
            });
        } catch (error) {
            console.error('Error getting user cards:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 激活卡牌
    app.post('/api/digital-cards/:cardId/activate', async (c) => {
        const user = c.get('user');
        const cardId = c.req.param('cardId');
        const activationData = await c.req.json();

        if (!activationData.photo_url || !activationData.location_id) {
            return c.json({ error: 'Photo URL and location ID are required for activation' }, 400);
        }

        try {
            const success = await cardService.activateCard(cardId, user.id, activationData);
            
            if (success) {
                return c.json({ message: 'Card activated successfully' });
            } else {
                return c.json({ error: 'Failed to activate card' }, 500);
            }
        } catch (error) {
            console.error('Error activating card:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 轉讓卡牌（贈送）
    app.post('/api/digital-cards/:cardId/transfer', async (c) => {
        const user = c.get('user');
        const cardId = c.req.param('cardId');
        const { to_user_id, transfer_type = 'gift' } = await c.req.json();

        if (!to_user_id) {
            return c.json({ error: 'Recipient user ID is required' }, 400);
        }

        try {
            const success = await cardService.transferCard(cardId, user.id, to_user_id, transfer_type);
            
            if (success) {
                return c.json({ message: 'Card transferred successfully' });
            } else {
                return c.json({ error: 'Failed to transfer card' }, 500);
            }
        } catch (error) {
            console.error('Error transferring card:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 根據編碼獲取卡牌資訊
    app.get('/api/digital-cards/code/:cardCode', async (c) => {
        const cardCode = c.req.param('cardCode');

        try {
            const card = await cardService.getCardByCode(cardCode);
            
            if (!card) {
                return c.json({ error: 'Card not found' }, 404);
            }

            // 只返回公開資訊，不包含敏感數據
            const publicCardInfo = {
                id: card.id,
                card_code: card.card_code,
                card_name: card.card_name,
                card_description: card.card_description,
                card_rarity: card.card_rarity,
                is_activated: false, // 需要查詢用戶卡牌記錄
                activation_required: card.activation_required
            };

            return c.json(publicCardInfo);
        } catch (error) {
            console.error('Error getting card by code:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取卡牌交易記錄
    app.get('/api/digital-cards/transactions', async (c) => {
        const user = c.get('user');
        const limit = parseInt(c.req.query('limit')) || 20;
        const offset = parseInt(c.req.query('offset')) || 0;

        try {
            const { results } = await db.prepare(
                `SELECT ct.*, dc.card_name, dc.card_code
                FROM card_transactions ct
                JOIN digital_cards dc ON ct.card_id = dc.id
                WHERE ct.from_user_id = ? OR ct.to_user_id = ?
                ORDER BY ct.created_at DESC
                LIMIT ? OFFSET ?`
            ).bind(user.id, user.id, limit, offset).all();

            return c.json({ transactions: results });
        } catch (error) {
            console.error('Error getting transactions:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 驗證卡牌激活條件（用於前端預檢）
    app.post('/api/digital-cards/:cardId/validate-activation', async (c) => {
        const user = c.get('user');
        const cardId = c.req.param('cardId');
        const activationData = await c.req.json();

        try {
            const card = await cardService.getCardById(cardId);
            if (!card) {
                return c.json({ error: 'Card not found' }, 404);
            }

            const conditions = JSON.parse(card.activation_conditions || '{}');
            const isValid = await cardService.validateActivationConditions(conditions, activationData);
            
            return c.json({ 
                valid: isValid,
                conditions: conditions,
                message: isValid ? 'Activation conditions met' : 'Activation conditions not met'
            });
        } catch (error) {
            console.error('Error validating activation:', error);
            return c.json({ error: error.message }, 500);
        }
    });

    // 獲取卡牌統計數據
    app.get('/api/digital-cards/stats', async (c) => {
        const user = c.get('user');

        try {
            const stats = await cardService.getCardStats(user.id);
            return c.json(stats);
        } catch (error) {
            console.error('Error getting card stats:', error);
            return c.json({ error: error.message }, 500);
        }
    });
}
