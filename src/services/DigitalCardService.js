/**
 * 數位卡牌服務
 * 處理卡牌生成、轉讓、激活、核銷等核心功能
 */

import { LocationService } from './locationService.js';

export class DigitalCardService {
    constructor(db, mapsApiKey = null) {
        this.db = db;
        this.locationService = new LocationService(db, mapsApiKey);
    }

    /**
     * 生成16位卡牌編碼
     * 格式：前8位卡牌類型ID + 後8位用戶ID
     */
    generateCardCode(cardType, userId) {
        const typePrefix = this.getCardTypePrefix(cardType);
        const userSuffix = userId.substring(0, 8).padStart(8, '0');
        return `${typePrefix}${userSuffix}`;
    }

    getCardTypePrefix(cardType) {
        const prefixes = {
            'user': 'USER',
            'merchant': 'MERC',
            'special': 'SPEC',
            'gift': 'GIFT'
        };
        return prefixes[cardType] || 'CARD';
    }

    /**
     * 創建卡牌包
     */
    async createCardPackage(packageType, userId) {
        const packageInfo = await this.getCardPackageInfo(packageType);
        if (!packageInfo) {
            throw new Error('Invalid package type');
        }

        const cards = [];
        const transactionId = this.generateTransactionId();

        // 創建主卡
        for (let i = 0; i < packageInfo.main_cards_count; i++) {
            const cardCode = this.generateCardCode('user', userId);
            const card = await this.createCard({
                card_code: cardCode,
                card_type: 'user',
                card_name: '澎湖時光島主卡',
                card_description: '專屬優惠權益，無限使用',
                card_rarity: 'legendary',
                original_price: 20000, // 200元
                current_owner_id: userId,
                original_owner_id: userId,
                activation_required: true,
                activation_conditions: JSON.stringify({
                    photo_upload: true,
                    location_verification: true
                })
            });
            cards.push(card);
        }

        // 創建贈送卡
        for (let i = 0; i < packageInfo.gift_cards_count; i++) {
            const cardCode = this.generateCardCode('gift', userId);
            const card = await this.createCard({
                card_code: cardCode,
                card_type: 'user',
                card_name: '澎湖回憶分享卡',
                card_description: '一次性優惠券，需要激活',
                card_rarity: 'common',
                original_price: 5000, // 50元
                current_owner_id: userId,
                original_owner_id: userId,
                activation_required: true,
                activation_conditions: JSON.stringify({
                    photo_upload: true,
                    social_share: true
                })
            });
            cards.push(card);
        }

        // 記錄交易
        await this.recordTransaction({
            card_id: cards[0].id, // 使用第一張卡作為交易記錄
            from_user_id: null, // 平台發行
            to_user_id: userId,
            transaction_type: 'purchase',
            transaction_amount: packageInfo.price,
            transaction_status: 'completed',
            payment_method: 'credit_card',
            transaction_notes: `購買${packageInfo.package_name}`
        });

        return {
            package: packageInfo,
            cards: cards,
            transaction_id: transactionId
        };
    }

    /**
     * 創建單張卡牌
     */
    async createCard(cardData) {
        const { success, meta } = await this.db.prepare(
            `INSERT INTO digital_cards (
                card_code, card_type, card_name, card_description, card_rarity,
                original_price, current_owner_id, original_owner_id,
                activation_required, activation_conditions, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
            cardData.card_code,
            cardData.card_type,
            cardData.card_name,
            cardData.card_description,
            cardData.card_rarity,
            cardData.original_price,
            cardData.current_owner_id,
            cardData.original_owner_id,
            cardData.activation_required,
            cardData.activation_conditions
        ).run();

        if (success) {
            const card = await this.getCardByCode(cardData.card_code);
            await this.createUserCardRecord(card.id, cardData.current_owner_id, 'purchase');
            return card;
        }
        throw new Error('Failed to create card');
    }

    /**
     * 創建用戶卡牌持有記錄
     */
    async createUserCardRecord(cardId, userId, acquisitionType) {
        const { success } = await this.db.prepare(
            `INSERT INTO user_cards (
                user_id, card_id, acquisition_type, acquisition_date
            ) VALUES (?, ?, ?, datetime('now'))`
        ).bind(userId, cardId, acquisitionType).run();

        return success;
    }

    /**
     * 根據編碼獲取卡牌
     */
    async getCardByCode(cardCode) {
        const { results } = await this.db.prepare(
            'SELECT * FROM digital_cards WHERE card_code = ?'
        ).bind(cardCode).all();
        return results[0];
    }

    /**
     * 獲取用戶的卡牌
     */
    async getUserCards(userId, includeUsed = false) {
        let query = `
            SELECT dc.*, uc.*, l.name as activation_location_name
            FROM user_cards uc
            JOIN digital_cards dc ON uc.card_id = dc.id
            LEFT JOIN locations l ON uc.activation_location_id = l.id
            WHERE uc.user_id = ?
        `;
        
        if (!includeUsed) {
            query += ' AND uc.is_used = false';
        }
        
        query += ' ORDER BY uc.acquisition_date DESC';

        const { results } = await this.db.prepare(query).bind(userId).all();
        return results;
    }

    /**
     * 激活卡牌
     */
    async activateCard(cardId, userId, activationData) {
        const card = await this.getCardById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        if (card.current_owner_id !== userId) {
            throw new Error('User does not own this card');
        }

        // 檢查激活條件
        const conditions = JSON.parse(card.activation_conditions || '{}');
        const isValid = await this.validateActivationConditions(conditions, activationData);
        
        if (!isValid) {
            throw new Error('Activation conditions not met');
        }

        // 更新卡牌狀態
        await this.db.prepare(
            `UPDATE user_cards SET 
                is_activated = true,
                activation_date = datetime('now'),
                activation_location_id = ?,
                activation_photo_url = ?
            WHERE card_id = ? AND user_id = ?`
        ).bind(
            activationData.location_id,
            activationData.photo_url,
            cardId,
            userId
        ).run();

        // 記錄激活
        await this.recordActivation(cardId, userId, activationData);

        return true;
    }

    /**
     * 驗證激活條件
     */
    async validateActivationConditions(conditions, activationData) {
        // 照片上傳驗證
        if (conditions.photo_upload && !activationData.photo_url) {
            return false;
        }

        // 地理位置驗證
        if (conditions.location_verification && !activationData.location_id) {
            return false;
        }

        // 社交分享驗證
        if (conditions.social_share && !activationData.social_share_id) {
            return false;
        }

        return true;
    }

    /**
     * 記錄激活
     */
    async recordActivation(cardId, userId, activationData) {
        const { success } = await this.db.prepare(
            `INSERT INTO card_activations (
                card_id, user_id, activation_method, activation_data,
                location_id, photo_url, verification_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'approved', datetime('now'))`
        ).bind(
            cardId,
            userId,
            activationData.method || 'photo_upload',
            JSON.stringify(activationData),
            activationData.location_id,
            activationData.photo_url
        ).run();

        return success;
    }

    /**
     * 轉讓卡牌（贈送）
     */
    async transferCard(cardId, fromUserId, toUserId, transferType = 'gift') {
        const card = await this.getCardById(cardId);
        if (!card) {
            throw new Error('Card not found');
        }

        if (card.current_owner_id !== fromUserId) {
            throw new Error('User does not own this card');
        }

        // 更新卡牌所有者
        await this.db.prepare(
            'UPDATE digital_cards SET current_owner_id = ?, updated_at = datetime("now") WHERE id = ?'
        ).bind(toUserId, cardId).run();

        // 更新用戶卡牌記錄
        await this.db.prepare(
            `UPDATE user_cards SET 
                user_id = ?,
                acquisition_type = ?,
                acquisition_date = datetime('now')
            WHERE card_id = ? AND user_id = ?`
        ).bind(toUserId, transferType, cardId, fromUserId).run();

        // 為新用戶創建卡牌記錄
        await this.createUserCardRecord(cardId, toUserId, transferType);

        // 記錄交易
        await this.recordTransaction({
            card_id: cardId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            transaction_type: transferType,
            transaction_amount: 0, // 贈送無金額
            transaction_status: 'completed'
        });

        return true;
    }

    /**
     * 記錄交易
     */
    async recordTransaction(transactionData) {
        const { success } = await this.db.prepare(
            `INSERT INTO card_transactions (
                card_id, from_user_id, to_user_id, transaction_type,
                transaction_amount, transaction_fee, transaction_status,
                payment_method, transaction_notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
            transactionData.card_id,
            transactionData.from_user_id,
            transactionData.to_user_id,
            transactionData.transaction_type,
            transactionData.transaction_amount || 0,
            transactionData.transaction_fee || 0,
            transactionData.transaction_status,
            transactionData.payment_method,
            transactionData.transaction_notes
        ).run();

        return success;
    }

    /**
     * 獲取卡牌包資訊
     */
    async getCardPackageInfo(packageType) {
        const { results } = await this.db.prepare(
            'SELECT * FROM card_packages WHERE package_type = ? AND is_active = true'
        ).bind(packageType).all();
        return results[0];
    }

    /**
     * 根據ID獲取卡牌
     */
    async getCardById(cardId) {
        const { results } = await this.db.prepare(
            'SELECT * FROM digital_cards WHERE id = ?'
        ).bind(cardId).all();
        return results[0];
    }

    /**
     * 生成交易ID
     */
    generateTransactionId() {
        return 'TXN' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 獲取卡牌統計
     */
    async getCardStats(userId) {
        const { results } = await this.db.prepare(
            `SELECT 
                COUNT(*) as total_cards,
                SUM(CASE WHEN is_activated = true THEN 1 ELSE 0 END) as activated_cards,
                SUM(CASE WHEN is_used = true THEN 1 ELSE 0 END) as used_cards,
                SUM(CASE WHEN acquisition_type = 'purchase' THEN 1 ELSE 0 END) as purchased_cards,
                SUM(CASE WHEN acquisition_type = 'gift' THEN 1 ELSE 0 END) as gifted_cards
            FROM user_cards 
            WHERE user_id = ?`
        ).bind(userId).all();
        return results[0];
    }

    /**
     * 獲取所有地點
     */
    async getAllLocations() {
        return await this.locationService.getAllLocations();
    }
}
