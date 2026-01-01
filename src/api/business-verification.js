// Business Verification API - 商家驗證相關 API 端點
// 基於「人、事、時、地、物」哲學架構

import { BusinessVerificationService } from '../services/BusinessVerificationService.js';
import { requireAdminAPI } from '../middleware/auth.js';
import { withCache, CACHE_TTL } from '../utils/cacheHelper.js';

/**
 * 處理商家驗證相關的 API 請求
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user - 當前使用者（可為 null）
 * @returns {Response}
 */
export async function handleBusinessVerificationRequest(request, env, user = null) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!env.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Database not available'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const verificationService = env.services?.businessVerification || new BusinessVerificationService(env.DB);

    // 用戶申請驗證
    if (pathname === '/api/business/verify/request' && request.method === 'POST') {
      return await handleRequestVerification(request, env, user, verificationService);
    }

    // 獲取驗證狀態
    if (pathname === '/api/business/verify/status' && request.method === 'GET') {
      return await handleGetVerificationStatus(request, env, user, verificationService);
    }

    // 獲取用戶的驗證申請列表
    if (pathname === '/api/business/verify/my-requests' && request.method === 'GET') {
      return await handleGetUserVerifications(request, env, user, verificationService);
    }

    // 管理員功能（需要 admin 權限）
    const adminAuthCheck = requireAdminAPI(user);
    if (adminAuthCheck) return adminAuthCheck;

    // 獲取待審核列表
    if (pathname === '/api/business/verify/pending' && request.method === 'GET') {
      return await handleGetPendingVerifications(request, env, user, verificationService);
    }

    // 獲取所有驗證列表（管理員）
    if (pathname === '/api/business/verify/all' && request.method === 'GET') {
      return await handleGetAllVerifications(request, env, user, verificationService);
    }

    // 獲取統計數據（管理員）- 使用緩存（5分鐘）
    if (pathname === '/api/business/verify/stats' && request.method === 'GET') {
      const cachedHandler = withCache(handleGetStatistics, {
        cacheKey: 'business-verification',
        ttl: CACHE_TTL.MEDIUM, // 5 分鐘
        keyGenerator: () => 'stats'
      });
      return await cachedHandler(request, env, user, verificationService);
    }

    // 批准驗證
    if (pathname === '/api/business/verify/approve' && request.method === 'POST') {
      return await handleApproveVerification(request, env, user, verificationService);
    }

    // 拒絕驗證
    if (pathname === '/api/business/verify/reject' && request.method === 'POST') {
      return await handleRejectVerification(request, env, user, verificationService);
    }

    // 獲取驗證詳情
    if (pathname.startsWith('/api/business/verify/') && pathname.endsWith('/details') && request.method === 'GET') {
      const verificationId = pathname.split('/')[4];
      return await handleGetVerificationDetails(request, env, user, verificationService, verificationId);
    }

    // 批量批准驗證
    if (pathname === '/api/business/verify/batch-approve' && request.method === 'POST') {
      return await handleBatchApproveVerifications(request, env, user, verificationService);
    }

    // 批量拒絕驗證
    if (pathname === '/api/business/verify/batch-reject' && request.method === 'POST') {
      return await handleBatchRejectVerifications(request, env, user, verificationService);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Business Verification API] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理驗證申請
 */
async function handleRequestVerification(request, env, user, verificationService) {
  if (!user || !user.id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { location_id, google_place_id } = body;

    if (!location_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'location_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await verificationService.requestVerification(
      location_id,
      user.id,
      google_place_id || null
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error requesting verification:', error);
    throw error;
  }
}

/**
 * 獲取驗證狀態
 */
async function handleGetVerificationStatus(request, env, user, verificationService) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');

    if (!locationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'location_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const status = await verificationService.getLocationVerificationStatus(locationId);

    let userVerification = null;
    if (user && user.id) {
      const userVerifications = await verificationService.getUserVerifications(user.id);
      userVerification = userVerifications.find(v => v.location_id === locationId) || null;
    }

    return new Response(JSON.stringify({
      success: true,
      locationVerification: status,
      userVerification: userVerification
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error getting verification status:', error);
    throw error;
  }
}

/**
 * 獲取用戶的驗證申請列表
 */
async function handleGetUserVerifications(request, env, user, verificationService) {
  if (!user || !user.id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const verifications = await verificationService.getUserVerifications(user.id);

    return new Response(JSON.stringify({
      success: true,
      verifications: verifications
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error getting user verifications:', error);
    throw error;
  }
}

/**
 * 獲取待審核列表（管理員）
 */
async function handleGetPendingVerifications(request, env, user, verificationService) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const result = await verificationService.getPendingVerifications(limit, offset);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error getting pending verifications:', error);
    throw error;
  }
}

/**
 * 獲取所有驗證列表（管理員）
 */
async function handleGetAllVerifications(request, env, user, verificationService) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const status = url.searchParams.get('status') || null;
    const search = url.searchParams.get('search') || null;

    const result = await verificationService.getAllVerifications(limit, offset, status, search);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error getting all verifications:', error);
    throw error;
  }
}

/**
 * 獲取統計數據（管理員）
 */
async function handleGetStatistics(request, env, user, verificationService) {
  try {
    const stats = await verificationService.getStatistics();

    return new Response(JSON.stringify({
      success: true,
      stats: stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error getting statistics:', error);
    throw error;
  }
}

/**
 * 批准驗證（管理員）
 */
async function handleApproveVerification(request, env, user, verificationService) {
  try {
    const body = await request.json();
    const { verification_id, notes } = body;

    if (!verification_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'verification_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await verificationService.approveVerification(
      verification_id,
      user.id,
      notes || null
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error approving verification:', error);
    throw error;
  }
}

/**
 * 拒絕驗證（管理員）
 */
async function handleRejectVerification(request, env, user, verificationService) {
  try {
    const body = await request.json();
    const { verification_id, rejection_reason } = body;

    if (!verification_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'verification_id is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!rejection_reason) {
      return new Response(JSON.stringify({
        success: false,
        error: 'rejection_reason is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await verificationService.rejectVerification(
      verification_id,
      user.id,
      rejection_reason
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error rejecting verification:', error);
    throw error;
  }
}

/**
 * 獲取驗證詳情
 */
async function handleGetVerificationDetails(request, env, user, verificationService, verificationId) {
  try {
    const verification = await verificationService.getVerification(verificationId);

    if (!verification) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Verification not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 檢查權限：用戶只能查看自己的驗證，管理員可以查看所有
    if (user.role !== 'admin' && verification.user_id !== user.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      verification: verification
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error getting verification details:', error);
    throw error;
  }
}

/**
 * 批量批准驗證（管理員）
 */
async function handleBatchApproveVerifications(request, env, user, verificationService) {
  try {
    const body = await request.json();
    const { verification_ids, notes } = body;

    if (!Array.isArray(verification_ids) || verification_ids.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '請選擇至少一個驗證申請'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await verificationService.batchApproveVerifications(
      verification_ids,
      user.id,
      notes || null
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error batch approving verifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 批量拒絕驗證（管理員）
 */
async function handleBatchRejectVerifications(request, env, user, verificationService) {
  try {
    const body = await request.json();
    const { verification_ids, rejection_reason } = body;

    if (!Array.isArray(verification_ids) || verification_ids.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '請選擇至少一個驗證申請'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!rejection_reason || !rejection_reason.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: '拒絕原因不能為空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await verificationService.batchRejectVerifications(
      verification_ids,
      user.id,
      rejection_reason
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Business Verification API] Error batch rejecting verifications:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

