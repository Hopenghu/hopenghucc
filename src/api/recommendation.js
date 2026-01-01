// Recommendation API - 推薦系統 API 端點
// 基於「人、事、時、地、物」哲學架構

import { RecommendationService } from '../services/RecommendationService.js';

/**
 * 處理推薦相關的 API 請求
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user - 當前使用者（可為 null）
 * @returns {Response}
 */
export async function handleRecommendationRequest(request, env, user = null) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 獲取個人化推薦
    if (pathname === '/api/recommendation/personal' && request.method === 'GET') {
      return await handleGetPersonalRecommendations(request, env, user);
    }

    // 獲取相似地點推薦
    if (pathname === '/api/recommendation/similar' && request.method === 'GET') {
      return await handleGetSimilarRecommendations(request, env, user);
    }

    // 獲取熱門地點
    if (pathname === '/api/recommendation/popular' && request.method === 'GET') {
      return await handleGetPopularLocations(request, env, user);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Recommendation API] Error:', error);
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
 * 獲取個人化推薦
 */
async function handleGetPersonalRecommendations(request, env, user) {
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
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const recommendationService = new RecommendationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );

    const recommendations = await recommendationService.recommendLocationsByStories(
      user.id,
      limit
    );

    return new Response(JSON.stringify({
      success: true,
      recommendations: recommendations,
      count: recommendations.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Recommendation API] Error getting personal recommendations:', error);
    throw error;
  }
}

/**
 * 獲取相似地點推薦
 */
async function handleGetSimilarRecommendations(request, env, user) {
  try {
    const url = new URL(request.url);
    const locationId = url.searchParams.get('location_id');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    if (!locationId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const recommendationService = new RecommendationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );

    const recommendations = await recommendationService.recommendSimilarLocations(
      locationId,
      limit
    );

    return new Response(JSON.stringify({
      success: true,
      recommendations: recommendations,
      count: recommendations.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Recommendation API] Error getting similar recommendations:', error);
    throw error;
  }
}

/**
 * 獲取熱門地點
 */
async function handleGetPopularLocations(request, env, user) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const recommendationService = new RecommendationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );

    const popularLocations = await recommendationService.getPopularLocations(limit);

    return new Response(JSON.stringify({
      success: true,
      locations: popularLocations,
      count: popularLocations.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Recommendation API] Error getting popular locations:', error);
    throw error;
  }
}

