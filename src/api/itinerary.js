/**
 * Itinerary API - 行程相關 API 端點
 * 處理行程的 CRUD 操作和優化
 */

import { ItineraryService } from '../services/ItineraryService.js';
import { 
  handleCreateLocationFromGoogle, 
  handleGetUserPersonalLocations, 
  handleUpdateUserLocationStatus 
} from './itinerary-location.js';

export async function handleItineraryRequest(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 所有行程 API 都需要登入
  if (!user) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 初始化服務
    const locationService = new (await import('../services/LocationService.js')).LocationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );
    const aiService = new (await import('../services/AIService.js')).AIService(
      env.DB,
      env.OPENAI_API_KEY,
      env.GEMINI_API_KEY,
      locationService,
      env.GOOGLE_MAPS_API_KEY
    );
    const itineraryService = new ItineraryService(env.DB, locationService, aiService);

    // 路由處理
    // 特殊路由：maps-api-key（必須在其他 /api/itinerary/ 路由之前檢查）
    if (path === '/api/itinerary/maps-api-key' && method === 'GET') {
      // 獲取 Google Maps API Key（僅返回給已登入用戶）
      return new Response(JSON.stringify({ 
        success: true,
        apiKey: env.GOOGLE_MAPS_API_KEY || ''
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (path === '/api/itinerary' && method === 'GET') {
      // 獲取用戶的所有行程
      return await handleGetUserItineraries(request, env, user, itineraryService);
    } else if (path === '/api/itinerary' && method === 'POST') {
      // 建立新行程
      return await handleCreateItinerary(request, env, user, itineraryService);
    } else if (path.startsWith('/api/itinerary/') && method === 'GET') {
      // 獲取單一行程
      const itineraryId = path.split('/').pop();
      return await handleGetItinerary(request, env, user, itineraryService, itineraryId);
    } else if (path.startsWith('/api/itinerary/') && method === 'PUT') {
      // 更新行程
      const itineraryId = path.split('/').pop();
      return await handleUpdateItinerary(request, env, user, itineraryService, itineraryId);
    } else if (path.startsWith('/api/itinerary/') && method === 'DELETE') {
      // 刪除行程
      const itineraryId = path.split('/').pop();
      return await handleDeleteItinerary(request, env, user, itineraryService, itineraryId);
    } else if (path.startsWith('/api/itinerary/') && path.endsWith('/optimize') && method === 'POST') {
      // 優化行程
      const itineraryId = path.split('/')[3];
      return await handleOptimizeItinerary(request, env, user, itineraryService, itineraryId);
    } else if (path === '/api/itinerary/search-places' && method === 'POST') {
      // 搜尋地點（使用 Gemini API）
      return await handleSearchPlaces(request, env, user, aiService);
    } else if (path === '/api/itinerary/optimize-day-plan' && method === 'POST') {
      // 優化單日行程（使用 Gemini API）
      return await handleOptimizeDayPlan(request, env, user, aiService);
    } else if (path === '/api/itinerary/location/from-google' && method === 'POST') {
      // 從 Google Maps 創建地點
      return await handleCreateLocationFromGoogle(request, env, user, locationService);
    } else if (path === '/api/itinerary/location/personal' && method === 'GET') {
      // 獲取用戶個人地點收藏
      return await handleGetUserPersonalLocations(request, env, user, locationService);
    } else if (path.startsWith('/api/itinerary/location/personal/') && method === 'PUT') {
      // 更新用戶地點狀態
      const locationId = path.split('/').pop();
      return await handleUpdateUserLocationStatus(request, env, user, locationService, locationId);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: 'API endpoint not found' 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取用戶的所有行程
 */
async function handleGetUserItineraries(request, env, user, itineraryService) {
  try {
    const itineraries = await itineraryService.getUserItineraries(user.id);
    return new Response(JSON.stringify({ 
      success: true,
      data: itineraries 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error getting user itineraries:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to get itineraries' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 建立新行程
 */
async function handleCreateItinerary(request, env, user, itineraryService) {
  try {
    const body = await request.json();
    const { title, dayPlans } = body;

    if (!dayPlans || !Array.isArray(dayPlans)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'dayPlans is required and must be an array' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const itinerary = await itineraryService.createItinerary(user.id, {
      title,
      dayPlans,
    });

    return new Response(JSON.stringify({ 
      success: true,
      data: itinerary 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error creating itinerary:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to create itinerary' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取單一行程
 */
async function handleGetItinerary(request, env, user, itineraryService, itineraryId) {
  try {
    if (!itineraryId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Itinerary ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const itinerary = await itineraryService.getItinerary(user.id, itineraryId);

    if (!itinerary) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Itinerary not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: itinerary 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error getting itinerary:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to get itinerary' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新行程
 */
async function handleUpdateItinerary(request, env, user, itineraryService, itineraryId) {
  try {
    if (!itineraryId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Itinerary ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { title, dayPlans } = body;

    const itinerary = await itineraryService.updateItinerary(user.id, itineraryId, {
      title,
      dayPlans,
    });

    return new Response(JSON.stringify({ 
      success: true,
      data: itinerary 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error updating itinerary:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to update itinerary' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 刪除行程
 */
async function handleDeleteItinerary(request, env, user, itineraryService, itineraryId) {
  try {
    if (!itineraryId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Itinerary ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await itineraryService.deleteItinerary(user.id, itineraryId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Itinerary deleted successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error deleting itinerary:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to delete itinerary' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 優化行程
 */
async function handleOptimizeItinerary(request, env, user, itineraryService, itineraryId) {
  try {
    if (!itineraryId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Itinerary ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { dayIndex } = body || {};

    const itinerary = await itineraryService.optimizeItinerary(
      user.id,
      itineraryId,
      dayIndex !== undefined ? dayIndex : null
    );

    return new Response(JSON.stringify({ 
      success: true,
      data: itinerary 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Itinerary API] Error optimizing itinerary:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to optimize itinerary' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 搜尋地點（使用 Gemini API）
 */
async function handleSearchPlaces(request, env, user, aiService) {
  try {
    const body = await request.json();
    const { query, latitude, longitude } = body;

    if (!query) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Query is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 使用 Gemini API 搜尋地點
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Gemini API key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `你是一個專業的澎湖導遊。請針對搜尋詞 "${query}" 找出澎湖相關的熱門景點、隱藏美食或地標。
請務必透過 Google Maps 搜尋工具回傳精確的地點名稱、地址以及經緯度座標。`
            }]
          }],
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: latitude && longitude ? { latitude, longitude } : undefined
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const places = chunks
        .filter((chunk) => chunk.maps)
        .map((chunk, index) => {
          const mapData = chunk.maps;
          return {
            id: `place-${Date.now()}-${index}`,
            name: mapData.title || "未知地點",
            uri: mapData.uri,
            address: mapData.address,
            location: mapData.location ? {
              lat: mapData.location.latitude,
              lng: mapData.location.longitude
            } : undefined
          };
        });

      return new Response(JSON.stringify({ 
        success: true,
        data: places 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('[Itinerary API] Gemini search error:', error);
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to search places' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('[Itinerary API] Error searching places:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to search places' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 優化單日行程（使用 Gemini API）
 */
async function handleOptimizeDayPlan(request, env, user, aiService) {
  try {
    const body = await request.json();
    const { places } = body;

    if (!places || !Array.isArray(places)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Places array is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 使用 Gemini API 優化行程
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Gemini API key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const prompt = `已知地點：${places.map(p => p.name).join(", ")}，
請根據地理位置、澎湖的交通特性與常見營業時間，為一天的行程安排最順暢的先後順序。
請以 JSON 格式回傳，包含 'itinerary' 陣列：
{ placeName: 地點名稱, recommendedTime: 建議時間 (HH:MM格式), reason: 安排理由 }`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                itinerary: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      placeName: { type: "string" },
                      recommendedTime: { type: "string" },
                      reason: { type: "string" }
                    },
                    required: ["placeName", "recommendedTime"]
                  }
                }
              },
              required: ["itinerary"]
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const optimizedData = JSON.parse(text);

      return new Response(JSON.stringify({ 
        success: true,
        data: optimizedData 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('[Itinerary API] Gemini optimization error:', error);
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to optimize day plan' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('[Itinerary API] Error optimizing day plan:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Failed to optimize day plan' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

