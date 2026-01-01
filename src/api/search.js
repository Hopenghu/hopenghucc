// Search API - 搜尋相關 API 端點
// 基於「人、事、時、地、物」哲學架構

import { SearchService } from '../services/SearchService.js';
import { withCache, CACHE_TTL } from '../utils/cacheHelper.js';

/**
 * 處理搜尋相關的 API 請求
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user - 當前使用者（可為 null）
 * @returns {Response}
 */
export async function handleSearchRequest(request, env, user = null) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 搜尋地點 - 使用緩存（1分鐘，考慮搜索結果可能變化）
    if (pathname === '/api/search/locations' && request.method === 'GET') {
      const cachedHandler = withCache(handleSearchLocations, {
        cacheKey: 'search',
        ttl: CACHE_TTL.SHORT, // 1 分鐘（60秒）
        keyGenerator: (request, env, user) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q') || '';
          const limit = url.searchParams.get('limit') || '20';
          const offset = url.searchParams.get('offset') || '0';
          const types = url.searchParams.get('types') || '';
          const minRating = url.searchParams.get('min_rating') || '';
          const businessStatus = url.searchParams.get('business_status') || '';
          const sortBy = url.searchParams.get('sort_by') || 'relevance';
          const sortOrder = url.searchParams.get('sort_order') || 'DESC';
          const userId = user?.id || 'anonymous';
          // 生成唯一的緩存鍵，包含所有搜索參數
          return `locations:${query}:${limit}:${offset}:${types}:${minRating}:${businessStatus}:${sortBy}:${sortOrder}:${userId}`;
        }
      });
      return await cachedHandler(request, env, user);
    }

    // 模糊搜尋地點名稱（用於自動完成）- 使用緩存（5分鐘）
    if (pathname === '/api/search/autocomplete' && request.method === 'GET') {
      const cachedHandler = withCache(handleAutocomplete, {
        cacheKey: 'search',
        ttl: CACHE_TTL.MEDIUM, // 5 分鐘
        keyGenerator: (request, env, user) => {
          const url = new URL(request.url);
          const query = url.searchParams.get('q') || '';
          const limit = url.searchParams.get('limit') || '10';
          return `autocomplete:${query}:${limit}`;
        }
      });
      return await cachedHandler(request, env, user);
    }

    // 獲取搜尋篩選選項 - 使用緩存（10分鐘，篩選選項變化不頻繁）
    if (pathname === '/api/search/filters' && request.method === 'GET') {
      const cachedHandler = withCache(handleGetFilters, {
        cacheKey: 'search',
        ttl: CACHE_TTL.LONG, // 10 分鐘
        keyGenerator: () => 'filters'
      });
      return await cachedHandler(request, env, user);
    }

    // 獲取熱門搜尋關鍵字 - 使用緩存（30分鐘）
    if (pathname === '/api/search/popular' && request.method === 'GET') {
      const cachedHandler = withCache(handleGetPopularTerms, {
        cacheKey: 'search',
        ttl: CACHE_TTL.VERY_LONG, // 30 分鐘
        keyGenerator: () => 'popular'
      });
      return await cachedHandler(request, env, user);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Search API] Error:', error);
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
 * 搜尋地點
 */
async function handleSearchLocations(request, env, user) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 解析篩選條件
    const filters = {
      types: url.searchParams.get('types') ? url.searchParams.get('types').split(',') : [],
      minRating: url.searchParams.get('min_rating') ? parseFloat(url.searchParams.get('min_rating')) : undefined,
      businessStatus: url.searchParams.get('business_status') || undefined
    };

    // 解析排序選項
    const sortOptions = {
      sortBy: url.searchParams.get('sort_by') || 'relevance',
      sortOrder: url.searchParams.get('sort_order') || 'DESC'
    };

    const searchService = new SearchService(env.DB);
    const results = await searchService.searchLocations(
      query,
      filters,
      sortOptions,
      limit,
      offset
    );

    return new Response(JSON.stringify({
      success: true,
      ...results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Search API] Error searching locations:', error);
    throw error;
  }
}

/**
 * 自動完成（模糊搜尋）
 */
async function handleAutocomplete(request, env, user) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({
        success: true,
        suggestions: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const searchService = new SearchService(env.DB);
    const suggestions = await searchService.fuzzySearchLocationNames(query, limit);

    return new Response(JSON.stringify({
      success: true,
      suggestions: suggestions
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Search API] Error autocomplete:', error);
    throw error;
  }
}

/**
 * 獲取搜尋篩選選項
 */
async function handleGetFilters(request, env, user) {
  try {
    const searchService = new SearchService(env.DB);
    const filters = await searchService.getSearchFilters();

    return new Response(JSON.stringify({
      success: true,
      filters: filters
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Search API] Error getting filters:', error);
    throw error;
  }
}

/**
 * 獲取熱門搜尋關鍵字
 */
async function handleGetPopularTerms(request, env, user) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const searchService = new SearchService(env.DB);
    const terms = await searchService.getPopularSearchTerms(limit);

    return new Response(JSON.stringify({
      success: true,
      terms: terms
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Search API] Error getting popular terms:', error);
    throw error;
  }
}

