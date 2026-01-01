/**
 * Itinerary Location API - 行程地點相關 API 端點
 * 處理從 Google Maps 創建地點、用戶地點收藏等操作
 */

/**
 * 從 Google Maps 創建地點
 * POST /api/itinerary/location/from-google
 * Body: { google_place_data, auto_link_to_user, initial_status }
 */
export async function handleCreateLocationFromGoogle(request, env, user, locationService) {
  try {
    const body = await request.json();
    const { google_place_data, auto_link_to_user = true, initial_status = 'want_to_visit' } = body;

    if (!google_place_data || !google_place_data.place_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing google_place_data or place_id' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const location = await locationService.createOrGetLocationFromGoogleMaps(
      google_place_data,
      user.id,
      {
        autoLink: auto_link_to_user,
        initialStatus: initial_status,
        sourceType: 'itinerary_added'
      }
    );

    return new Response(JSON.stringify({ 
      success: true,
      data: location 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary Location API] Error creating location from Google:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to create location' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取用戶個人地點收藏
 * GET /api/itinerary/location/personal?status=visited&category=restaurant
 */
export async function handleGetUserPersonalLocations(request, env, user, locationService) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');

    const userLocations = await locationService.getUserLocations(user.id);
    
    // 篩選
    let filtered = userLocations;
    if (status) {
      filtered = filtered.filter(loc => loc.user_location_status === status);
    }
    if (category) {
      filtered = filtered.filter(loc => loc.category === category);
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: filtered 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary Location API] Error getting user personal locations:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to get user locations' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新用戶地點狀態
 * PUT /api/itinerary/location/personal/:locationId
 * Body: { status, user_rating, user_description }
 */
export async function handleUpdateUserLocationStatus(request, env, user, locationService, locationId) {
  try {
    const body = await request.json();
    const { status, user_rating, user_description } = body;

    if (!locationId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing location_id' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 檢查用戶地點關聯是否存在
    const existing = await locationService.db.prepare(
      `SELECT * FROM user_locations WHERE user_id = ? AND location_id = ?`
    ).bind(user.id, locationId).first();

    const now = new Date().toISOString();

    if (existing) {
      // 更新現有關聯
      await locationService.db.prepare(
        `UPDATE user_locations 
         SET status = COALESCE(?, status), 
             user_rating = COALESCE(?, user_rating),
             user_description = COALESCE(?, user_description),
             updated_at = ?
         WHERE user_id = ? AND location_id = ?`
      ).bind(
        status || null,
        user_rating || null,
        user_description || null,
        now,
        user.id,
        locationId
      ).run();

      // 如果狀態改為 visited，更新訪問次數
      if (status === 'visited' && existing.status !== 'visited') {
        await locationService.incrementVisitCount(locationId);
      }
    } else {
      // 創建新關聯
      const linkId = crypto.randomUUID();
      await locationService.db.prepare(
        `INSERT INTO user_locations (id, user_id, location_id, status, user_rating, user_description, added_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        linkId,
        user.id,
        locationId,
        status || 'want_to_visit',
        user_rating || null,
        user_description || null,
        now,
        now
      ).run();

      // 如果狀態為 visited，更新訪問次數
      if (status === 'visited') {
        await locationService.incrementVisitCount(locationId);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'User location status updated' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary Location API] Error updating user location status:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to update user location status' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

