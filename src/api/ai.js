import { AIService } from '../services/AIService.js';

/**
 * 處理 AI 相關的 API 請求
 */
export async function handleAIRequest(request, env, user, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 檢查 OpenAI API Key
  if (!env.OPENAI_API_KEY) {
    console.error('[AI API] OpenAI API key not configured');
    return new Response(JSON.stringify({
      error: 'OpenAI API key not configured',
      message: 'OpenAI API key not configured'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 檢查 API Key 格式（應該以 sk- 開頭）
  if (!env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('[AI API] Invalid OpenAI API key format');
    return new Response(JSON.stringify({
      error: 'Invalid API key format',
      message: 'Invalid OpenAI API key format'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 初始化 AI Service
    // locationService 從 env 傳入（由 worker.js 提供）
    const locationService = env.locationService || null;
    console.log('[AI API] Initializing AIService with API keys:', {
      openai: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.substring(0, 10) + '...' : 'missing',
      gemini: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.substring(0, 10) + '...' : 'missing',
      googleMaps: env.GOOGLE_MAPS_API_KEY ? env.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...' : 'missing'
    });
    const aiService = new AIService(
      env.DB,
      env.OPENAI_API_KEY,
      env.GEMINI_API_KEY,
      locationService,
      env.GOOGLE_MAPS_API_KEY
    );

    // 處理查詢請求
    if (path === '/api/ai/query' && request.method === 'POST') {
      return await handleAIQuery(request, env, user, aiService, ctx);
    }

    // 處理反饋請求
    if (path === '/api/ai/feedback' && request.method === 'POST') {
      return await handleAIFeedback(request, env, user, aiService);
    }

    // 處理歷史記錄查詢
    if (path === '/api/ai/history' && request.method === 'GET') {
      return await handleAIHistory(request, env, user, aiService);
    }

    // 處理地圖選擇的地點
    if (path === '/api/ai/location-selected' && request.method === 'POST') {
      return await handleLocationSelected(request, env, user, aiService);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理 AI 查詢請求
 */
async function handleAIQuery(request, env, user, aiService, ctx) {
  try {
    const body = await request.json();
    const { message, sessionId, mode } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Message is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 限制訊息長度
    if (message.length > 1000) {
      return new Response(JSON.stringify({
        error: 'Message too long (max 1000 characters)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user ? user.id : null;
    const finalSessionId = sessionId || generateSessionId();

    // 處理查詢
    console.log('[AI API] Processing query:', {
      userId: userId || 'anonymous',
      sessionId: finalSessionId,
      messageLength: message.length,
      mode: mode || 'auto'
    });

    const result = await aiService.handleQuery(userId, finalSessionId, message.trim(), mode, ctx);

    console.log('[AI API] Query result:', {
      success: result.success,
      messageLength: result.message?.length || 0,
      hasError: !!result.error,
      model: result.model,
      mode: result.mode
    });

    return new Response(JSON.stringify({
      success: result.success,
      message: result.message,
      sessionId: finalSessionId,
      model: result.model, // 使用的模型（gemini 或 gpt）
      mode: result.mode,   // 使用的模式（traveler 或 resident）
      // 在開發環境或管理員可以看到錯誤詳情
      error: result.error,
      details: result.details
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI API] Error handling query:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process query',
      message: error.message || '處理查詢時發生錯誤'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理 AI 反饋請求
 */
async function handleAIFeedback(request, env, user, aiService) {
  try {
    const body = await request.json();
    const { conversationId, feedbackType, feedbackContent } = body;

    if (!conversationId || !feedbackType) {
      return new Response(JSON.stringify({
        error: 'conversationId and feedbackType are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user ? user.id : null;
    const success = await aiService.saveFeedback(
      conversationId,
      userId,
      feedbackType,
      feedbackContent
    );

    return new Response(JSON.stringify({
      success: success
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI API] Error handling feedback:', error);
    return new Response(JSON.stringify({
      error: 'Failed to save feedback',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理歷史記錄查詢
 */
async function handleAIHistory(request, env, user, aiService) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!sessionId) {
      return new Response(JSON.stringify({
        error: 'sessionId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 查詢歷史記錄
    const history = await env.DB.prepare(
      `SELECT id, message_type, message_content, created_at
       FROM ai_conversations
       WHERE session_id = ?
       ORDER BY created_at ASC
       LIMIT ?`
    ).bind(sessionId, limit).all();

    return new Response(JSON.stringify({
      success: true,
      history: history.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI API] Error handling history:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch history',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 處理地圖選擇的地點
 */
async function handleLocationSelected(request, env, user, aiService) {
  try {
    const body = await request.json();
    const { place, sessionId } = body;

    if (!place || !place.location) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Place information is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user ? user.id : null;

    // 儲存地點資訊到對話記錄（如果失敗也不影響主要流程）
    if (sessionId) {
      try {
        await env.DB.prepare(
          `INSERT INTO ai_conversations (session_id, user_id, message_type, message_content, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          sessionId,
          userId,
          'location_selected',
          JSON.stringify({
            place: place,
            timestamp: new Date().toISOString()
          }),
          new Date().toISOString()
        ).run();
        console.log('[AI API] Location saved to conversation:', sessionId);
      } catch (dbError) {
        console.error('[AI API] Error saving location to conversation:', dbError);
        // 不影響主要流程，繼續執行
      }
    }

    // 如果用戶已登入，可以選擇性地將地點儲存到資料庫
    if (userId && place.name && place.location) {
      try {
        const locationService = env.locationService;
        if (locationService) {
          // 這裡可以調用 locationService 來儲存地點
          // 暫時只記錄到對話中
          console.log('[AI API] Location selected by user:', userId, place);
        }
      } catch (error) {
        console.error('[AI API] Error saving location:', error);
        // 不影響主要流程，繼續執行
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Location saved successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AI API] Error handling location selection:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save location',
      message: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成會話 ID（用於未登入用戶）
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
