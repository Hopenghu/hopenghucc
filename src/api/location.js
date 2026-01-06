import { LocationService } from '../services/LocationService.js';
import { withCache, CACHE_TTL } from '../utils/cacheHelper.js';

export async function handleLocationRequest(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 分頁端點不需要登入（但會返回不包含用戶狀態的結果）- 使用緩存（1分鐘）
  if (path === '/api/locations/paginated' && request.method === 'GET') {
    // 允許未登入用戶訪問，但不會包含用戶狀態
    try {
      // 為地點分頁添加短時間緩存（1分鐘），因為數據可能頻繁變化
      // 注意：緩存鍵包含用戶ID，以區分不同用戶的收藏狀態
      const cachedHandler = withCache(handleLocationsPaginated, {
        cacheKey: 'locations',
        ttl: CACHE_TTL.SHORT, // 1 分鐘
        keyGenerator: (request, env, user) => {
          const url = new URL(request.url);
          const limit = url.searchParams.get('limit') || '20';
          const offset = url.searchParams.get('offset') || '0';
          const userId = user?.id || 'anonymous';
          return `paginated:${limit}:${offset}:${userId}`;
        }
      });
      return await cachedHandler(request, env, user);
    } catch (error) {
      console.error('[Location API] Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (path === '/api/location/status' && request.method === 'POST') {
      return await handleLocationStatusUpdate(request, env, user);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Location API] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleLocationStatusUpdate(request, env, user) {
  try {
    const body = await request.json();
    const { locationId, status } = body;

    if (!locationId || !status) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing locationId or status' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 驗證狀態值
    const validStatuses = ['visited', 'want_to_visit', 'want_to_revisit', 'created'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid status value' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
    
    // 檢查地點是否存在
    const location = await locationService.getLocationById(locationId);
    if (!location) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Location not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新或創建用戶地點關聯
    await locationService.updateUserLocationStatus(user.id, locationId, status);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Location status updated successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Location API] Error updating location status:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update location status' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleLocationsPaginated(request, env, user) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid limit or offset parameters' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
    const locations = await locationService.getLocationsPaginated(limit, offset, user ? user.id : null);

    // 優化：批量獲取收藏狀態（避免 N+1 查詢問題）
    if (user && user.id && locations && locations.length > 0) {
      const { FavoritesService } = await import('../services/FavoritesService.js');
      const favoritesService = new FavoritesService(env.DB);
      
      const locationIds = locations.map(loc => loc.id);
      const favoriteStatuses = await favoritesService.getBatchFavoriteStatuses(user.id, locationIds);
      
      // 將收藏狀態添加到每個地點
      locations.forEach(location => {
        location.is_favorited = favoriteStatuses[location.id] || false;
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      locations: locations || [],
      count: locations ? locations.length : 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Location API] Error fetching paginated locations:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch locations' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 