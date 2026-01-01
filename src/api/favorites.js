// Favorites API - 收藏、評分、評論相關 API 端點
// 基於「人、事、時、地、物」哲學架構

import { FavoritesService } from '../services/FavoritesService.js';

/**
 * 處理收藏相關的 API 請求
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user - 當前使用者（可為 null）
 * @returns {Response}
 */
export async function handleFavoritesRequest(request, env, user = null) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 切換收藏狀態
    if (pathname === '/api/favorites/toggle' && request.method === 'POST') {
      return await handleToggleFavorite(request, env, user);
    }

    // 獲取用戶收藏列表
    if (pathname === '/api/favorites/list' && request.method === 'GET') {
      return await handleGetFavorites(request, env, user);
    }

    // 檢查是否已收藏
    if (pathname === '/api/favorites/check' && request.method === 'GET') {
      return await handleCheckFavorite(request, env, user);
    }

    // 添加評分
    if (pathname === '/api/favorites/rating' && request.method === 'POST') {
      return await handleAddRating(request, env, user);
    }

    // 獲取地點評分
    if (pathname === '/api/favorites/rating' && request.method === 'GET') {
      return await handleGetRating(request, env, user);
    }

    // 添加評論
    if (pathname === '/api/favorites/comment' && request.method === 'POST') {
      return await handleAddComment(request, env, user);
    }

    // 獲取地點評論
    if (pathname === '/api/favorites/comments' && request.method === 'GET') {
      return await handleGetComments(request, env, user);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Favorites API] Error:', error);
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
 * 切換收藏狀態
 */
async function handleToggleFavorite(request, env, user) {
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
    const { location_id } = body;

    if (!location_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const favoritesService = new FavoritesService(env.DB);
    const isFavorited = await favoritesService.toggleFavorite(user.id, location_id);
    const favoriteCount = await favoritesService.getFavoriteCount(location_id);

    return new Response(JSON.stringify({
      success: true,
      is_favorited: isFavorited,
      favorite_count: favoriteCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error toggling favorite:', error);
    throw error;
  }
}

/**
 * 獲取用戶收藏列表
 */
async function handleGetFavorites(request, env, user) {
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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const favoritesService = new FavoritesService(env.DB);
    const result = await favoritesService.getUserFavorites(user.id, limit, offset);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error getting favorites:', error);
    throw error;
  }
}

/**
 * 檢查是否已收藏
 */
async function handleCheckFavorite(request, env, user) {
  if (!user || !user.id) {
    return new Response(JSON.stringify({ 
      success: true,
      is_favorited: false 
    }), { 
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const location_id = url.searchParams.get('location_id');

    if (!location_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const favoritesService = new FavoritesService(env.DB);
    const isFavorited = await favoritesService.isFavorited(user.id, location_id);
    const favoriteCount = await favoritesService.getFavoriteCount(location_id);

    return new Response(JSON.stringify({
      success: true,
      is_favorited: isFavorited,
      favorite_count: favoriteCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error checking favorite:', error);
    throw error;
  }
}

/**
 * 添加評分
 */
async function handleAddRating(request, env, user) {
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
    const { location_id, rating, comment } = body;

    if (!location_id || !rating) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id and rating are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const favoritesService = new FavoritesService(env.DB);
    await favoritesService.addRating(user.id, location_id, rating, comment);
    const ratingInfo = await favoritesService.getLocationRating(location_id);

    return new Response(JSON.stringify({
      success: true,
      rating: ratingInfo
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error adding rating:', error);
    throw error;
  }
}

/**
 * 獲取地點評分
 */
async function handleGetRating(request, env, user) {
  try {
    const url = new URL(request.url);
    const location_id = url.searchParams.get('location_id');

    if (!location_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const favoritesService = new FavoritesService(env.DB);
    const rating = await favoritesService.getLocationRating(location_id);
    
    let userRating = null;
    if (user && user.id) {
      userRating = await favoritesService.getUserRating(user.id, location_id);
    }

    return new Response(JSON.stringify({
      success: true,
      rating: rating,
      user_rating: userRating
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error getting rating:', error);
    throw error;
  }
}

/**
 * 添加評論
 */
async function handleAddComment(request, env, user) {
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
    const { location_id, content } = body;

    if (!location_id || !content) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id and content are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const favoritesService = new FavoritesService(env.DB);
    const commentId = await favoritesService.addComment(user.id, location_id, content);

    return new Response(JSON.stringify({
      success: true,
      comment_id: commentId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error adding comment:', error);
    throw error;
  }
}

/**
 * 獲取地點評論
 */
async function handleGetComments(request, env, user) {
  try {
    const url = new URL(request.url);
    const location_id = url.searchParams.get('location_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!location_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const favoritesService = new FavoritesService(env.DB);
    const result = await favoritesService.getLocationComments(location_id, limit, offset);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Favorites API] Error getting comments:', error);
    throw error;
  }
}

