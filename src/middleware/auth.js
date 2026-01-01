/**
 * 權限檢查中間件
 * 統一管理 Admin 權限驗證邏輯
 */

/**
 * 檢查用戶是否為管理員
 * @param {object} user - 當前用戶對象
 * @returns {boolean} 是否為管理員
 */
export function isAdmin(user) {
  return user && user.role === 'admin';
}

/**
 * 檢查用戶是否已登錄
 * @param {object} user - 當前用戶對象
 * @returns {boolean} 是否已登錄
 */
export function isAuthenticated(user) {
  return user != null;
}

/**
 * 管理員權限檢查中間件
 * 如果用戶不是管理員，返回 403 響應
 * @param {object} user - 當前用戶對象
 * @param {Request} request - 請求對象（用於重定向）
 * @returns {Response|null} 如果未授權則返回響應，否則返回 null
 */
export function requireAdmin(user, request = null) {
  // 如果用戶未登錄，先檢查登錄狀態
  if (!user) {
    if (request) {
      const url = new URL(request.url);
      return Response.redirect(url.origin + '/login', 302);
    }
    return new Response('Unauthorized. Please log in.', { 
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
  
  // 如果用戶已登錄但不是管理員
  if (!isAdmin(user)) {
    if (request) {
      const url = new URL(request.url);
      // 已登錄但非管理員，重定向到首頁並顯示錯誤訊息
      return Response.redirect(url.origin + '/?error=admin_required', 302);
    }
    return new Response('Unauthorized. Administrator access required.', { 
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
  return null;
}

/**
 * 登錄檢查中間件
 * 如果用戶未登錄，返回 401 響應或重定向
 * @param {object} user - 當前用戶對象
 * @param {Request} request - 請求對象（用於重定向）
 * @returns {Response|null} 如果未登錄則返回響應，否則返回 null
 */
export function requireAuth(user, request = null) {
  if (!isAuthenticated(user)) {
    if (request) {
      const url = new URL(request.url);
      return Response.redirect(url.origin + '/login', 302);
    }
    return new Response('Unauthorized. Please log in.', { 
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
  return null;
}

/**
 * API 端點的管理員權限檢查
 * 返回 JSON 格式的錯誤響應
 * @param {object} user - 當前用戶對象
 * @returns {Response|null} 如果未授權則返回 JSON 響應，否則返回 null
 */
export function requireAdminAPI(user) {
  if (!isAdmin(user)) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unauthorized. Administrator access required.' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
  return null;
}

/**
 * API 端點的登錄檢查
 * 返回 JSON 格式的錯誤響應
 * @param {object} user - 當前用戶對象
 * @returns {Response|null} 如果未登錄則返回 JSON 響應，否則返回 null
 */
export function requireAuthAPI(user) {
  if (!isAuthenticated(user)) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unauthorized. Please log in.' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
  return null;
}

