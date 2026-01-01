/**
 * AI Knowledge Service - 負責處理使用者貢獻的知識提取與儲存
 */
export class AIKnowledgeService {
    constructor(db) {
        if (!db) {
            throw new Error("Database connection is required for AIKnowledgeService.");
        }
        this.db = db;
    }

    /**
     * 分析使用者訊息並提取有價值的資訊
     * @param {string} userMessage - 使用者訊息
     * @param {string} aiResponse - AI 回應 (可選，用於輔助上下文)
     * @returns {Object|null} 提取的資訊或 null
     */
    async extractKnowledge(userMessage, aiResponse = null) {
        // 這裡可以使用規則庫或輕量級 AI 邏輯來提取
        // 目前先簡單實作：基於關鍵字的啟發式提取
        // 未來應該使用 LLM 來做更精準的提取 (但在 AIService 中呼叫以節省請求)

        // 簡單的關鍵字檢測，標記是否包含潛在價值資訊
        const valueKeywords = [
            '推薦', '好球', '好吃', '必去', '私房', '祕境', '秘境',
            '故事', '歷史', '聽說', '在地人', '小時候', '回憶'
        ];

        const hasValue = valueKeywords.some(keyword => userMessage.includes(keyword));

        if (!hasValue && userMessage.length < 10) {
            return null;
        }

        return {
            hasPotentialValue: hasValue,
            category: this.detectCategory(userMessage)
        };
    }

    /**
     * 判斷內容分類
     */
    detectCategory(message) {
        const foodKeywords = ['吃', '喝', '餐廳', '美食', '小吃', '味', '餐'];
        const spotKeywords = ['去', '玩', '景點', '看', '海', '島', '山', '廟'];
        const storyKeywords = ['故事', '歷史', '傳說', '以前', '古早', '聽說'];

        if (foodKeywords.some(k => message.includes(k))) return 'food';
        if (spotKeywords.some(k => message.includes(k))) return 'spot';
        if (storyKeywords.some(k => message.includes(k))) return 'story';
        return 'general';
    }

    /**
     * 儲存使用者貢獻
     */
    async saveContribution(userId, sessionId, content, extractedData = null, category = 'general') {
        try {
            const result = await this.db.prepare(
                `INSERT INTO user_knowledge_contributions (user_id, session_id, content, extracted_data, category, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`
            ).bind(
                userId || null,
                sessionId,
                content,
                extractedData ? JSON.stringify(extractedData) : null,
                category
            ).run();

            console.log('[AIKnowledgeService] Saved contribution:', result.meta.last_row_id);
            return result.meta.last_row_id;
        } catch (error) {
            console.error('[AIKnowledgeService] Error saving contribution:', error);
            return null;
        }
    }

    /**
     * 標記有價值的對話 (由 AIService 呼叫)
     */
    async processInteraction(userId, sessionId, userMessage) {
        const extraction = await this.extractKnowledge(userMessage);

        if (extraction && extraction.hasPotentialValue) {
            await this.saveContribution(
                userId,
                sessionId,
                userMessage,
                extraction,
                extraction.category
            );
        }
    }
    /**
     * 獲取待審核的貢獻
     */
    async getPendingContributions(limit = 20, offset = 0) {
        try {
            const results = await this.db.prepare(
                `SELECT * FROM user_knowledge_contributions 
                 WHERE status = 'pending' 
                 ORDER BY created_at DESC 
                 LIMIT ? OFFSET ?`
            ).bind(limit, offset).all();

            // 獲取總數
            const countResult = await this.db.prepare(
                `SELECT COUNT(*) as total FROM user_knowledge_contributions WHERE status = 'pending'`
            ).first();

            return {
                contributions: results.results || [],
                total: countResult ? countResult.total : 0
            };
        } catch (error) {
            console.error('[AIKnowledgeService] Error getting pending contributions:', error);
            return { contributions: [], total: 0 };
        }
    }

    /**
     * 批准貢獻
     */
    async approveContribution(id) {
        try {
            const result = await this.db.prepare(
                `UPDATE user_knowledge_contributions 
                 SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`
            ).bind(id).run();

            return result.success;
        } catch (error) {
            console.error('[AIKnowledgeService] Error approving contribution:', error);
            return false;
        }
    }

    /**
     * 拒絕貢獻
     */
    async rejectContribution(id) {
        try {
            const result = await this.db.prepare(
                `UPDATE user_knowledge_contributions 
                 SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`
            ).bind(id).run();

            return result.success;
        } catch (error) {
            console.error('[AIKnowledgeService] Error rejecting contribution:', error);
            return false;
        }
    }
    /**
     * 搜尋已批准的知識 (RAG)
     * @param {string} query - 使用者查詢
     * @returns {Array} - 相關知識列表
     */
    async searchApprovedKnowledge(query) {
        if (!query) return [];

        try {
            // 1. 簡單關鍵字提取 (移除常見停用詞)
            const stopWords = ['的', '了', '是', '我', '你', '他', '在', '有', '去', '嗎', '甚麼', '什麼', '澎湖'];
            let keywords = query.split(/[\s,，.。!！?？]+/)
                .filter(k => k.length > 1 && !stopWords.includes(k));

            if (keywords.length === 0) {
                // 如果沒有明確關鍵字，但句子夠長，就嘗試拿整個句子去模糊比對 (或直接回傳空)
                if (query.length > 4) keywords = [query];
                else return [];
            }

            // 2. 建構 SQL 查詢 (使用 LIKE 做簡單模糊搜尋)
            const conditions = keywords.map(() => `content LIKE ?`).join(' OR ');
            const bindParams = keywords.map(k => `%${k}%`);

            const sql = `
                SELECT content, category, user_id, created_at 
                FROM user_knowledge_contributions 
                WHERE status = 'approved' 
                AND (${conditions})
                ORDER BY created_at DESC 
                LIMIT 5
            `;

            const results = await this.db.prepare(sql).bind(...bindParams).all();

            return results.results || [];

        } catch (error) {
            console.error('[AIKnowledgeService] Error searching knowledge:', error);
            return [];
        }
    }
}
