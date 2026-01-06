import { BackupService } from '../services/BackupService.js';
import { RateLimitService } from '../services/RateLimitService.js';
import { SecurityAuditService } from '../services/SecurityAuditService.js';
import { requireAdminAPI } from '../middleware/auth.js';
import { getCacheStatsSummary, performanceMetrics } from '../utils/cacheMonitor.js';
import { ServiceFactory } from '../services/ServiceFactory.js';

/**
 * 處理管理員相關的API請求
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user 當前用戶
 * @returns {Response}
 */
export async function handleAdminRequest(request, env, user) {
    // 使用權限檢查中間件
    const authCheck = requireAdminAPI(user);
    if (authCheck) return authCheck;

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
        // 備份相關端點
        if (pathname === '/api/admin/backup/create') {
            return await handleCreateBackup(request, env);
        }
        
        if (pathname === '/api/admin/backup/list') {
            return await handleListBackups(request, env);
        }
        
        if (pathname === '/api/admin/backup/restore') {
            return await handleRestoreBackup(request, env);
        }
        
        if (pathname === '/api/admin/backup/health') {
            return await handleBackupHealth(request, env);
        }

        // 速率限制相關端點
        if (pathname === '/api/admin/rate-limit/stats') {
            return await handleRateLimitStats(request, env);
        }
        
        if (pathname === '/api/admin/rate-limit/client-stats') {
            return await handleClientRateLimitStats(request, env);
        }
        
        if (pathname === '/api/admin/rate-limit/google-usage') {
            return await handleGooglePlacesUsage(request, env);
        }
        
        if (pathname === '/api/admin/rate-limit/cleanup') {
            return await handleRateLimitCleanup(request, env);
        }

        // 安全審計相關端點
        if (pathname === '/api/admin/security/audit') {
            return await handleSecurityAudit(request, env);
        }
        
        if (pathname === '/api/admin/security/status') {
            return await handleSecurityStatus(request, env);
        }

        // 系統狀態端點
        if (pathname === '/api/admin/system/status') {
            return await handleSystemStatus(request, env);
        }
        
        // 緩存監控端點
        if (pathname === '/api/admin/cache/stats') {
            return await handleCacheStats(request, env);
        }
        
        // 性能指標端點
        if (pathname === '/api/admin/performance/metrics') {
            return await handlePerformanceMetrics(request, env);
        }

        // 用戶管理端點（管理員專用）
        if (pathname === '/api/admin/users/list') {
            return await handleListUsers(request, env);
        }
        
        if (pathname === '/api/admin/users/set-role') {
            return await handleSetUserRole(request, env);
        }
        
        if (pathname === '/api/admin/users/get-role') {
            return await handleGetUserRole(request, env);
        }

        // 生態系統監控端點
        if (pathname === '/api/admin/ecosystem/report') {
            return await handleEcosystemReport(request, env);
        }

        if (pathname === '/api/admin/ecosystem/wellbeing') {
            return await handleEcosystemWellbeing(request, env);
        }

        if (pathname === '/api/admin/ecosystem/resources') {
            return await handleEcosystemResources(request, env);
        }

        if (pathname === '/api/admin/ecosystem/community') {
            return await handleEcosystemCommunity(request, env);
        }

        if (pathname === '/api/admin/ecosystem/agents') {
            return await handleEcosystemAgents(request, env);
        }

        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('[Admin API] Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal Server Error',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 創建資料庫備份
 */
async function handleCreateBackup(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const backupService = new BackupService(env);
    const result = await backupService.createBackup();
    
    return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 獲取備份列表
 */
async function handleListBackups(request, env) {
    const backupService = new BackupService(env);
    const backups = await backupService.getBackupList();
    
    return new Response(JSON.stringify({ backups }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 恢復資料庫備份
 */
async function handleRestoreBackup(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const backupKey = url.searchParams.get('backupKey');
    
    if (!backupKey) {
        return new Response(JSON.stringify({ error: 'Missing backupKey parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const backupService = new BackupService(env);
    const result = await backupService.restoreBackup(backupKey);
    
    return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 檢查備份健康狀態
 */
async function handleBackupHealth(request, env) {
    const backupService = new BackupService(env);
    const health = await backupService.checkBackupHealth();
    
    return new Response(JSON.stringify(health), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 獲取速率限制統計
 */
async function handleRateLimitStats(request, env) {
    const rateLimitService = new RateLimitService(env);
    const stats = await rateLimitService.getRateLimitStats();
    
    return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 獲取客戶端速率限制統計
 */
async function handleClientRateLimitStats(request, env) {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const endpoint = url.searchParams.get('endpoint') || 'api';
    
    if (!clientId) {
        return new Response(JSON.stringify({ error: 'Missing clientId parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const rateLimitService = new RateLimitService(env);
    const stats = await rateLimitService.getClientStats(clientId, endpoint);
    
    return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 檢查 Google Places API 使用量
 */
async function handleGooglePlacesUsage(request, env) {
    const rateLimitService = new RateLimitService(env);
    const usage = await rateLimitService.checkGooglePlacesUsage();
    
    return new Response(JSON.stringify(usage), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 清理速率限制日誌
 */
async function handleRateLimitCleanup(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const daysToKeep = parseInt(url.searchParams.get('daysToKeep')) || 7;

    const rateLimitService = new RateLimitService(env);
    const result = await rateLimitService.cleanupOldLogs(daysToKeep);
    
    return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 執行安全審計
 */
async function handleSecurityAudit(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const securityAuditService = new SecurityAuditService(env);
    const audit = await securityAuditService.performSecurityAudit();
    
    return new Response(JSON.stringify(audit), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 獲取安全狀態
 */
async function handleSecurityStatus(request, env) {
    const securityAuditService = new SecurityAuditService(env);
    const audit = await securityAuditService.performSecurityAudit();
    
    // 只返回關鍵信息
    const status = {
        timestamp: audit.timestamp,
        overallScore: audit.overallScore,
        criticalIssuesCount: audit.criticalIssues.length,
        warningsCount: audit.warnings.length,
        status: audit.overallScore >= 80 ? 'secure' : 
                audit.overallScore >= 60 ? 'warning' : 'critical'
    };
    
    return new Response(JSON.stringify(status), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * 獲取系統狀態
 */
async function handleSystemStatus(request, env) {
    try {
        // 檢查資料庫連接
        const dbStatus = await checkDatabaseStatus(env);
        
        // 檢查備份狀態
        const backupService = new BackupService(env);
        const backupHealth = await backupService.checkBackupHealth();
        
        // 檢查速率限制狀態
        const rateLimitService = new RateLimitService(env);
        const rateLimitStats = await rateLimitService.getRateLimitStats();
        const googleUsage = await rateLimitService.checkGooglePlacesUsage();
        
        // 檢查安全狀態
        const securityAuditService = new SecurityAuditService(env);
        const securityAudit = await securityAuditService.performSecurityAudit();
        
        const systemStatus = {
            timestamp: new Date().toISOString(),
            database: dbStatus,
            backup: backupHealth,
            rateLimit: {
                stats: rateLimitStats,
                googlePlacesUsage: googleUsage
            },
            security: {
                overallScore: securityAudit.overallScore,
                criticalIssuesCount: securityAudit.criticalIssues.length,
                warningsCount: securityAudit.warnings.length
            },
            overallHealth: calculateOverallHealth(dbStatus, backupHealth, googleUsage, securityAudit)
        };
        
        return new Response(JSON.stringify(systemStatus), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('[Admin API] System status check failed:', error);
        return new Response(JSON.stringify({ 
            error: 'System status check failed',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 檢查資料庫狀態
 */
async function checkDatabaseStatus(env) {
    try {
        // 檢查資料庫連接
        const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type = "table"');
        const result = await stmt.first();
        
        return {
            connected: true,
            tableCount: result.count,
            status: 'healthy'
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            status: 'error'
        };
    }
}

/**
 * 獲取緩存統計信息
 */
async function handleCacheStats(request, env) {
    try {
        const cacheStats = getCacheStatsSummary();
        
        return new Response(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            stats: cacheStats
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Cache stats failed:', error);
        return new Response(JSON.stringify({ 
            success: false,
            error: 'Failed to get cache stats',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 獲取性能指標
 */
async function handlePerformanceMetrics(request, env) {
    try {
        const metrics = performanceMetrics.getAllStats();
        
        return new Response(JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            metrics: metrics
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Performance metrics failed:', error);
        return new Response(JSON.stringify({ 
            success: false,
            error: 'Failed to get performance metrics',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 計算整體健康狀態
 */
function calculateOverallHealth(dbStatus, backupHealth, googleUsage, securityAudit) {
    let score = 100;
    
    // 資料庫狀態
    if (!dbStatus.connected) score -= 30;
    
    // 備份狀態
    if (!backupHealth.healthy) score -= 20;
    
    // Google Places API 使用量
    if (googleUsage.status === 'warning') score -= 10;
    if (googleUsage.status === 'critical') score -= 20;
    
    // 安全分數
    score = Math.min(score, securityAudit.overallScore);
    
    return {
        score: Math.max(0, score),
        status: score >= 80 ? 'healthy' : 
                score >= 60 ? 'warning' : 'critical',
        issues: []
    };
}

/**
 * 列出所有用戶（管理員專用）
 */
async function handleListUsers(request, env) {
    try {
        const url = new URL(request.url);
        const role = url.searchParams.get('role'); // 可選過濾：'admin' 或 'user'
        const search = url.searchParams.get('search'); // 可選搜尋：email 或 name
        
        let query = 'SELECT id, email, name, role, created_at, lastLogin FROM users WHERE 1=1';
        const params = [];
        
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }
        
        if (search) {
            query += ' AND (email LIKE ? OR name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY created_at DESC LIMIT 100';
        
        const result = await env.DB.prepare(query).bind(...params).all();
        
        return new Response(JSON.stringify({
            success: true,
            users: result.results || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Error listing users:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to list users',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 設置用戶角色（管理員專用）
 */
async function handleSetUserRole(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const { email, role } = body;
        
        if (!email || !role) {
            return new Response(JSON.stringify({ error: 'Email and role are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (role !== 'admin' && role !== 'user') {
            return new Response(JSON.stringify({ error: 'Invalid role. Must be "admin" or "user"' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 檢查用戶是否存在
        const userCheck = await env.DB.prepare(
            'SELECT id, email, role FROM users WHERE email = ?'
        ).bind(email).first();
        
        if (!userCheck) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 更新角色
        await env.DB.prepare(
            'UPDATE users SET role = ? WHERE email = ?'
        ).bind(role, email).run();
        
        return new Response(JSON.stringify({
            success: true,
            message: `User role updated to ${role}`,
            user: {
                email: email,
                role: role
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Error setting user role:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to set user role',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 獲取用戶角色（管理員專用）
 */
async function handleGetUserRole(request, env) {
    try {
        const url = new URL(request.url);
        const email = url.searchParams.get('email');
        
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email parameter is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const user = await env.DB.prepare(
            'SELECT id, email, name, role, created_at FROM users WHERE email = ?'
        ).bind(email).first();
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                created_at: user.created_at
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Error getting user role:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to get user role',
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 處理生態系統報告請求
 */
async function handleEcosystemReport(request, env) {
    try {
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days') || '7');
        
        const serviceFactory = new ServiceFactory(env);
        const ecosystemService = serviceFactory.getService('ecosystemService');
        
        const report = await ecosystemService.getEcosystemReport({ days });
        
        return new Response(JSON.stringify(report), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Ecosystem report failed:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get ecosystem report',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 處理用戶福祉請求
 */
async function handleEcosystemWellbeing(request, env) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const days = parseInt(url.searchParams.get('days') || '30');
        
        const serviceFactory = new ServiceFactory(env);
        const ecosystemService = serviceFactory.getService('ecosystemService');
        
        const wellbeing = await ecosystemService.getUserWellbeing(userId, { days });
        
        return new Response(JSON.stringify(wellbeing), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Ecosystem wellbeing failed:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get wellbeing data',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 處理資源使用請求
 */
async function handleEcosystemResources(request, env) {
    try {
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days') || '7');
        
        const serviceFactory = new ServiceFactory(env);
        const ecosystemService = serviceFactory.getService('ecosystemService');
        
        const usage = await ecosystemService.getResourceUsage({ days });
        
        return new Response(JSON.stringify(usage), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Ecosystem resources failed:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get resource usage',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 處理社區健康請求
 */
async function handleEcosystemCommunity(request, env) {
    try {
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days') || '7');
        
        const serviceFactory = new ServiceFactory(env);
        const ecosystemService = serviceFactory.getService('ecosystemService');
        
        const health = await ecosystemService.getCommunityHealth({ days });
        
        return new Response(JSON.stringify(health), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Ecosystem community failed:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get community health',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 處理 AI Agent 統計請求
 */
async function handleEcosystemAgents(request, env) {
    try {
        const serviceFactory = new ServiceFactory(env);
        const aiAgentFactory = serviceFactory.getService('aiAgentFactory');
        
        const stats = aiAgentFactory.getStats();
        const allStates = aiAgentFactory.getAllAgentStates();
        
        return new Response(JSON.stringify({
            stats,
            agents: allStates
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Admin API] Ecosystem agents failed:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get agent stats',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 