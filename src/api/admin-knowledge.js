
import { AIKnowledgeService } from '../services/AIKnowledgeService.js';
import { requireAdminAPI } from '../middleware/auth.js';

/**
 * Handle Admin Knowledge Review API requests
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user 
 * @returns {Response}
 */
export async function handleAdminKnowledgeRequest(request, env, user = null) {
    const url = new URL(request.url);
    // Normalize pathname (remove trailing slash for consistency)
    const normalizedPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    console.log(`[AdminKnowledgeAPI] Handling ${request.method} ${normalizedPath}`);

    try {
        // GET /api/admin/knowledge/pending
        if (request.method === 'GET' && normalizedPath === '/api/admin/knowledge/pending') {
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const offset = parseInt(url.searchParams.get('offset') || '0');

            const result = await knowledgeService.getPendingContributions(limit, offset);

            return new Response(JSON.stringify({
                success: true,
                contributions: result.contributions,
                total: result.total
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // POST /api/admin/knowledge/:id/approve
        // Match pattern: /api/admin/knowledge/(\d+)/approve
        const approveMatch = pathname.match(/^\/api\/admin\/knowledge\/(\d+)\/approve$/);
        if (request.method === 'POST' && approveMatch) {
            const id = approveMatch[1];
            const success = await knowledgeService.approveContribution(id);

            return new Response(JSON.stringify({
                success: success,
                message: success ? 'Contribution approved' : 'Failed to approve contribution'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // POST /api/admin/knowledge/:id/reject
        // Match pattern: /api/admin/knowledge/(\d+)/reject
        const rejectMatch = pathname.match(/^\/api\/admin\/knowledge\/(\d+)\/reject$/);
        if (request.method === 'POST' && rejectMatch) {
            const id = rejectMatch[1];
            const success = await knowledgeService.rejectContribution(id);

            return new Response(JSON.stringify({
                success: success,
                message: success ? 'Contribution rejected' : 'Failed to reject contribution'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });

    } catch (error) {
        console.error('[AdminKnowledgeAPI] Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
