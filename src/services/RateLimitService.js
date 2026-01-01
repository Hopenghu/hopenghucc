export class RateLimitService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        
        // 預設限制配置
        this.defaultLimits = {
            // Google Places API 限制
            'google_places': {
                requestsPerMinute: 10,
                requestsPerHour: 100,
                requestsPerDay: 1000
            },
            // 一般 API 限制
            'api': {
                requestsPerMinute: 60,
                requestsPerHour: 1000,
                requestsPerDay: 10000
            },
            // 圖片代理限制
            'image_proxy': {
                requestsPerMinute: 30,
                requestsPerHour: 500,
                requestsPerDay: 5000
            },
            // 管理員 API 限制
            'admin': {
                requestsPerMinute: 100,
                requestsPerHour: 2000,
                requestsPerDay: 20000
            }
        };
    }

    /**
     * 檢查請求是否超過限制
     * @param {string} clientId 客戶端識別碼 (IP 或用戶ID)
     * @param {string} endpoint 端點類型
     * @returns {Promise<object>} 檢查結果
     */
    async checkRateLimit(clientId, endpoint = 'api') {
        try {
            const limits = this.defaultLimits[endpoint] || this.defaultLimits['api'];
            const now = new Date();
            
            // 檢查各種時間窗口的限制
            const minuteCheck = await this.checkWindow(clientId, endpoint, 'minute', limits.requestsPerMinute, now);
            if (!minuteCheck.allowed) {
                return {
                    allowed: false,
                    limit: 'minute',
                    remaining: minuteCheck.remaining,
                    resetTime: minuteCheck.resetTime,
                    retryAfter: minuteCheck.retryAfter
                };
            }

            const hourCheck = await this.checkWindow(clientId, endpoint, 'hour', limits.requestsPerHour, now);
            if (!hourCheck.allowed) {
                return {
                    allowed: false,
                    limit: 'hour',
                    remaining: hourCheck.remaining,
                    resetTime: hourCheck.resetTime,
                    retryAfter: hourCheck.retryAfter
                };
            }

            const dayCheck = await this.checkWindow(clientId, endpoint, 'day', limits.requestsPerDay, now);
            if (!dayCheck.allowed) {
                return {
                    allowed: false,
                    limit: 'day',
                    remaining: dayCheck.remaining,
                    resetTime: dayCheck.resetTime,
                    retryAfter: dayCheck.retryAfter
                };
            }

            // 記錄請求
            await this.recordRequest(clientId, endpoint, now);

            return {
                allowed: true,
                remaining: Math.min(minuteCheck.remaining, hourCheck.remaining, dayCheck.remaining),
                resetTime: Math.min(minuteCheck.resetTime, hourCheck.resetTime, dayCheck.resetTime)
            };

        } catch (error) {
            console.error('[RateLimitService] Error checking rate limit:', error);
            // 發生錯誤時允許請求通過，但記錄錯誤
            return {
                allowed: true,
                error: error.message
            };
        }
    }

    /**
     * 檢查特定時間窗口的限制
     */
    async checkWindow(clientId, endpoint, window, limit, now) {
        let startTime, windowName;
        
        switch (window) {
            case 'minute':
                startTime = new Date(now.getTime() - 60 * 1000);
                windowName = 'minute';
                break;
            case 'hour':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                windowName = 'hour';
                break;
            case 'day':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                windowName = 'day';
                break;
            default:
                throw new Error(`Invalid window: ${window}`);
        }

        const stmt = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM rate_limit_logs
            WHERE client_id = ? 
            AND endpoint = ? 
            AND window_type = ?
            AND request_time > ?
        `);
        
        const result = await stmt.bind(clientId, endpoint, windowName, startTime.toISOString()).first();
        const count = result.count || 0;
        const remaining = Math.max(0, limit - count);
        const allowed = count < limit;

        // 計算重置時間
        let resetTime;
        switch (window) {
            case 'minute':
                resetTime = new Date(now.getTime() + 60 * 1000);
                break;
            case 'hour':
                resetTime = new Date(now.getTime() + 60 * 60 * 1000);
                break;
            case 'day':
                resetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
        }

        return {
            allowed,
            remaining,
            resetTime: resetTime.toISOString(),
            retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
        };
    }

    /**
     * 記錄請求
     */
    async recordRequest(clientId, endpoint, timestamp) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO rate_limit_logs 
                (client_id, endpoint, window_type, request_time, created_at)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            // 記錄到所有時間窗口
            await stmt.bind(clientId, endpoint, 'minute', timestamp.toISOString(), timestamp.toISOString()).run();
            await stmt.bind(clientId, endpoint, 'hour', timestamp.toISOString(), timestamp.toISOString()).run();
            await stmt.bind(clientId, endpoint, 'day', timestamp.toISOString(), timestamp.toISOString()).run();
            
        } catch (error) {
            console.error('[RateLimitService] Failed to record request:', error);
        }
    }

    /**
     * 獲取客戶端使用統計
     * @param {string} clientId 客戶端識別碼
     * @param {string} endpoint 端點類型
     * @returns {Promise<object>} 使用統計
     */
    async getClientStats(clientId, endpoint = 'api') {
        try {
            const now = new Date();
            const minuteAgo = new Date(now.getTime() - 60 * 1000);
            const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const stmt = this.db.prepare(`
                SELECT 
                    window_type,
                    COUNT(*) as count
                FROM rate_limit_logs
                WHERE client_id = ? 
                AND endpoint = ?
                AND request_time > ?
                GROUP BY window_type
            `);

            const minuteResult = await stmt.bind(clientId, endpoint, minuteAgo.toISOString()).all();
            const hourResult = await stmt.bind(clientId, endpoint, hourAgo.toISOString()).all();
            const dayResult = await stmt.bind(clientId, endpoint, dayAgo.toISOString()).all();

            const limits = this.defaultLimits[endpoint] || this.defaultLimits['api'];
            
            return {
                clientId,
                endpoint,
                usage: {
                    minute: minuteResult.length > 0 ? minuteResult[0].count : 0,
                    hour: hourResult.length > 0 ? hourResult[0].count : 0,
                    day: dayResult.length > 0 ? dayResult[0].count : 0
                },
                limits,
                remaining: {
                    minute: Math.max(0, limits.requestsPerMinute - (minuteResult.length > 0 ? minuteResult[0].count : 0)),
                    hour: Math.max(0, limits.requestsPerHour - (hourResult.length > 0 ? hourResult[0].count : 0)),
                    day: Math.max(0, limits.requestsPerDay - (dayResult.length > 0 ? dayResult[0].count : 0))
                }
            };
        } catch (error) {
            console.error('[RateLimitService] Failed to get client stats:', error);
            return {
                clientId,
                endpoint,
                error: error.message
            };
        }
    }

    /**
     * 清理過期的速率限制日誌
     * @param {number} daysToKeep 保留天數
     * @returns {Promise<object>} 清理結果
     */
    async cleanupOldLogs(daysToKeep = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const stmt = this.db.prepare(`
                DELETE FROM rate_limit_logs
                WHERE request_time < ?
            `);
            
            const result = await stmt.bind(cutoffDate.toISOString()).run();
            
            return {
                success: true,
                deletedCount: result.changes || 0
            };
        } catch (error) {
            console.error('[RateLimitService] Failed to cleanup old logs:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 獲取速率限制統計
     * @returns {Promise<object>} 統計資訊
     */
    async getRateLimitStats() {
        try {
            const now = new Date();
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const stmt = this.db.prepare(`
                SELECT 
                    endpoint,
                    COUNT(*) as total_requests,
                    COUNT(DISTINCT client_id) as unique_clients
                FROM rate_limit_logs
                WHERE request_time > ?
                GROUP BY endpoint
            `);
            
            const { results } = await stmt.bind(dayAgo.toISOString()).all();
            
            return {
                period: '24h',
                stats: results,
                totalRequests: results.reduce((sum, row) => sum + row.total_requests, 0),
                uniqueClients: results.reduce((sum, row) => sum + row.unique_clients, 0)
            };
        } catch (error) {
            console.error('[RateLimitService] Failed to get stats:', error);
            return {
                error: error.message
            };
        }
    }

    /**
     * 檢查 Google Places API 使用量
     * @returns {Promise<object>} API 使用量
     */
    async checkGooglePlacesUsage() {
        try {
            const now = new Date();
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const stmt = this.db.prepare(`
                SELECT COUNT(*) as count
                FROM rate_limit_logs
                WHERE endpoint = 'google_places'
                AND request_time > ?
            `);
            
            const result = await stmt.bind(dayAgo.toISOString()).first();
            const dailyUsage = result.count || 0;
            const limit = this.defaultLimits.google_places.requestsPerDay;
            const remaining = Math.max(0, limit - dailyUsage);
            const usagePercentage = (dailyUsage / limit) * 100;

            return {
                dailyUsage,
                limit,
                remaining,
                usagePercentage: Math.round(usagePercentage * 100) / 100,
                status: usagePercentage > 90 ? 'warning' : usagePercentage > 75 ? 'caution' : 'normal'
            };
        } catch (error) {
            console.error('[RateLimitService] Failed to check Google Places usage:', error);
            return {
                error: error.message
            };
        }
    }
} 