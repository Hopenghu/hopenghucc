/**
 * Trip Planner API - 行程規劃 API 端點
 * 處理行程規劃的儲存和載入
 */

export async function handleTripPlannerRequest(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // 公開分享的行程（不需要登入）
    if (path.startsWith('/api/trip-planner/shared/') && method === 'GET') {
      const shareToken = path.split('/').pop();
      if (shareToken && shareToken !== 'shared') {
        return await handleGetSharedTrip(shareToken, env);
      }
    }

    // 所有其他行程規劃 API 都需要登入
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 儲存行程
    if (path === '/api/trip-planner/save' && method === 'POST') {
      return await handleSaveTrip(request, env, user);
    }

    // 獲取用戶的所有行程
    if (path === '/api/trip-planner/list' && method === 'GET') {
      return await handleGetUserTrips(request, env, user);
    }

    // 更新行程項目的預訂狀態
    if (path.startsWith('/api/trip-planner/item/') && path.endsWith('/booking-status') && method === 'PUT') {
      const itemId = path.split('/')[4];
      return await handleUpdateBookingStatus(itemId, request, env, user);
    }

    // 更新行程項目的預訂資訊
    if (path.startsWith('/api/trip-planner/item/') && path.endsWith('/booking-info') && method === 'PUT') {
      const itemId = path.split('/')[4];
      return await handleUpdateBookingInfo(itemId, request, env, user);
    }

    // 生成分享連結
    if (path.startsWith('/api/trip-planner/') && path.endsWith('/share') && method === 'POST') {
      const tripId = path.split('/')[3];
      return await handleShareTrip(tripId, request, env, user);
    }

    // 取消分享
    if (path.startsWith('/api/trip-planner/') && path.endsWith('/share') && method === 'DELETE') {
      const tripId = path.split('/')[3];
      return await handleUnshareTrip(tripId, env, user);
    }

    // 獲取單一行程
    if (path.startsWith('/api/trip-planner/') && method === 'GET') {
      const tripId = path.split('/').pop();
      if (tripId && tripId !== 'save' && tripId !== 'list' && tripId !== 'shared') {
        return await handleGetTrip(tripId, env, user);
      }
    }

    // 刪除行程
    if (path.startsWith('/api/trip-planner/') && method === 'DELETE') {
      const tripId = path.split('/').pop();
      if (tripId && tripId !== 'save' && tripId !== 'list' && tripId !== 'shared') {
        return await handleDeleteTrip(tripId, env, user);
      }
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: 'API endpoint not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 儲存行程
 */
async function handleSaveTrip(request, env, user) {
  try {
    const body = await request.json();
    const { title, days } = body;

    if (!title || !days || !Array.isArray(days)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成行程 ID
    const tripId = body.tripId || `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const shareToken = body.shareToken || null;
    const isPublic = body.isPublic ? 1 : 0;

    // 檢查行程是否已存在（更新模式）
    const existingTrip = await env.DB.prepare(
      `SELECT id FROM trip_plans WHERE id = ? AND user_id = ?`
    ).bind(tripId, user.id).first();

    if (existingTrip) {
      // 更新現有行程
      await env.DB.prepare(
        `UPDATE trip_plans SET title = ?, updated_at = ?, share_token = ?, is_public = ? WHERE id = ?`
      ).bind(title, now, shareToken, isPublic, tripId).run();

      // 刪除舊的行程項目
      await env.DB.prepare(
        `DELETE FROM trip_plan_items WHERE trip_id = ?`
      ).bind(tripId).run();
    } else {
      // 創建新行程
      await env.DB.prepare(
        `INSERT INTO trip_plans (id, user_id, title, share_token, is_public, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(tripId, user.id, title, shareToken, isPublic, now, now).run();
    }

    // 儲存每天的行程項目
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      if (!day.date || !day.places || !Array.isArray(day.places)) {
        continue;
      }

      for (let placeIndex = 0; placeIndex < day.places.length; placeIndex++) {
        const place = day.places[placeIndex];
        if (!place.placeId) {
          continue;
        }

        const itemId = `trip_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
          `INSERT INTO trip_plan_items (id, trip_id, day_index, place_id, time, order_index, booking_status, booking_url, booking_phone, booking_notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          itemId,
          tripId,
          dayIndex,
          place.placeId,
          place.time || '09:00',
          place.order || placeIndex,
          place.bookingStatus || 'planned',
          place.bookingUrl || null,
          place.bookingPhone || null,
          place.bookingNotes || null,
          now
        ).run();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tripId: tripId,
      message: '行程已儲存'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error saving trip:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save trip',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取用戶的所有行程
 */
async function handleGetUserTrips(request, env, user) {
  try {
    const trips = await env.DB.prepare(
      `SELECT id, title, created_at, updated_at
       FROM trip_plans
       WHERE user_id = ?
       ORDER BY updated_at DESC
       LIMIT 50`
    ).bind(user.id).all();

    return new Response(JSON.stringify({
      success: true,
      trips: trips.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error getting user trips:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get trips',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取單一行程
 */
async function handleGetTrip(tripId, env, user) {
  try {
    // 獲取行程主記錄
    const trip = await env.DB.prepare(
      `SELECT id, user_id, title, share_token, is_public, created_at, updated_at
       FROM trip_plans
       WHERE id = ? AND user_id = ?`
    ).bind(tripId, user.id).first();

    if (!trip) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trip not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 獲取行程項目
    const items = await env.DB.prepare(
      `SELECT id, day_index, place_id, time, order_index, booking_status, booking_url, booking_phone, booking_notes
       FROM trip_plan_items
       WHERE trip_id = ?
       ORDER BY day_index, order_index`
    ).bind(tripId).all();

    // 組織資料結構
    const daysMap = new Map();
    for (const item of items.results || []) {
      const dayIndex = item.day_index;
      if (!daysMap.has(dayIndex)) {
        daysMap.set(dayIndex, []);
      }
      daysMap.get(dayIndex).push({
        id: item.id,
        placeId: item.place_id,
        time: item.time,
        order: item.order_index,
        bookingStatus: item.booking_status || 'planned',
        bookingUrl: item.booking_url,
        bookingPhone: item.booking_phone,
        bookingNotes: item.booking_notes
      });
    }

    const days = Array.from(daysMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayIndex, places]) => ({
        dayIndex: dayIndex,
        places: places
      }));

    return new Response(JSON.stringify({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        shareToken: trip.share_token,
        isPublic: trip.is_public === 1,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at,
        days: days
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error getting trip:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get trip',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 刪除行程
 */
async function handleDeleteTrip(tripId, env, user) {
  try {
    // 檢查行程是否存在且屬於該用戶
    const trip = await env.DB.prepare(
      `SELECT id FROM trip_plans WHERE id = ? AND user_id = ?`
    ).bind(tripId, user.id).first();

    if (!trip) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trip not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 刪除行程項目
    await env.DB.prepare(
      `DELETE FROM trip_plan_items WHERE trip_id = ?`
    ).bind(tripId).run();

    // 刪除行程主記錄
    await env.DB.prepare(
      `DELETE FROM trip_plans WHERE id = ?`
    ).bind(tripId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Trip deleted'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error deleting trip:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete trip',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新行程項目的預訂狀態
 */
async function handleUpdateBookingStatus(itemId, request, env, user) {
  try {
    const body = await request.json();
    const { bookingStatus } = body;

    if (!bookingStatus || !['planned', 'booked', 'completed', 'cancelled'].includes(bookingStatus)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid booking status'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 檢查項目是否存在且屬於該用戶
    const item = await env.DB.prepare(
      `SELECT tpi.id, tp.user_id 
       FROM trip_plan_items tpi
       JOIN trip_plans tp ON tpi.trip_id = tp.id
       WHERE tpi.id = ? AND tp.user_id = ?`
    ).bind(itemId, user.id).first();

    if (!item) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item not found or unauthorized'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新預訂狀態
    await env.DB.prepare(
      `UPDATE trip_plan_items SET booking_status = ? WHERE id = ?`
    ).bind(bookingStatus, itemId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Booking status updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error updating booking status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update booking status',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新行程項目的預訂資訊
 */
async function handleUpdateBookingInfo(itemId, request, env, user) {
  try {
    const body = await request.json();
    const { bookingUrl, bookingPhone, bookingNotes } = body;

    // 檢查項目是否存在且屬於該用戶
    const item = await env.DB.prepare(
      `SELECT tpi.id, tp.user_id 
       FROM trip_plan_items tpi
       JOIN trip_plans tp ON tpi.trip_id = tp.id
       WHERE tpi.id = ? AND tp.user_id = ?`
    ).bind(itemId, user.id).first();

    if (!item) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Item not found or unauthorized'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新預訂資訊
    await env.DB.prepare(
      `UPDATE trip_plan_items 
       SET booking_url = ?, booking_phone = ?, booking_notes = ?
       WHERE id = ?`
    ).bind(bookingUrl || null, bookingPhone || null, bookingNotes || null, itemId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Booking info updated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error updating booking info:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update booking info',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成分享連結
 */
async function handleShareTrip(tripId, request, env, user) {
  try {
    const body = await request.json();
    const { isPublic } = body;

    // 檢查行程是否存在且屬於該用戶
    const trip = await env.DB.prepare(
      `SELECT id FROM trip_plans WHERE id = ? AND user_id = ?`
    ).bind(tripId, user.id).first();

    if (!trip) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trip not found or unauthorized'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成分享令牌（如果還沒有）
    let shareToken = await env.DB.prepare(
      `SELECT share_token FROM trip_plans WHERE id = ?`
    ).bind(tripId).first();

    if (!shareToken || !shareToken.share_token) {
      // 生成新的分享令牌
      shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 確保唯一性
      let attempts = 0;
      while (attempts < 10) {
        const existing = await env.DB.prepare(
          `SELECT id FROM trip_plans WHERE share_token = ?`
        ).bind(shareToken).first();
        
        if (!existing) break;
        shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        attempts++;
      }
    } else {
      shareToken = shareToken.share_token;
    }

    // 更新行程的分享設定
    await env.DB.prepare(
      `UPDATE trip_plans SET share_token = ?, is_public = ? WHERE id = ?`
    ).bind(shareToken, isPublic ? 1 : 0, tripId).run();

    const shareUrl = `${new URL(request.url).origin}/trip-planner/shared/${shareToken}`;

    return new Response(JSON.stringify({
      success: true,
      shareToken: shareToken,
      shareUrl: shareUrl,
      isPublic: isPublic
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error sharing trip:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to share trip',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 取消分享
 */
async function handleUnshareTrip(tripId, env, user) {
  try {
    // 檢查行程是否存在且屬於該用戶
    const trip = await env.DB.prepare(
      `SELECT id FROM trip_plans WHERE id = ? AND user_id = ?`
    ).bind(tripId, user.id).first();

    if (!trip) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Trip not found or unauthorized'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 取消分享
    await env.DB.prepare(
      `UPDATE trip_plans SET share_token = NULL, is_public = 0 WHERE id = ?`
    ).bind(tripId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Trip unshared'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error unsharing trip:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to unshare trip',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取公開分享的行程（不需要登入）
 */
async function handleGetSharedTrip(shareToken, env) {
  try {
    // 獲取行程主記錄
    const trip = await env.DB.prepare(
      `SELECT id, user_id, title, is_public, created_at, updated_at
       FROM trip_plans
       WHERE share_token = ? AND is_public = 1`
    ).bind(shareToken).first();

    if (!trip) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Shared trip not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 獲取行程項目
    const items = await env.DB.prepare(
      `SELECT id, day_index, place_id, time, order_index, booking_status
       FROM trip_plan_items
       WHERE trip_id = ?
       ORDER BY day_index, order_index`
    ).bind(trip.id).all();

    // 組織資料結構
    const daysMap = new Map();
    for (const item of items.results || []) {
      const dayIndex = item.day_index;
      if (!daysMap.has(dayIndex)) {
        daysMap.set(dayIndex, []);
      }
      daysMap.get(dayIndex).push({
        id: item.id,
        placeId: item.place_id,
        time: item.time,
        order: item.order_index,
        bookingStatus: item.booking_status || 'planned'
      });
    }

    const days = Array.from(daysMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayIndex, places]) => ({
        dayIndex: dayIndex,
        places: places
      }));

    return new Response(JSON.stringify({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at,
        days: days
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Trip Planner API] Error getting shared trip:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get shared trip',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

