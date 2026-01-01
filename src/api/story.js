// Story API - 故事相關 API 端點
// 基於「人、事、時、地、物」哲學架構

import { StoryModule } from '../services/StoryModule.js';
import { PersonModule } from '../services/PersonModule.js';
import { LocationModule } from '../services/LocationModule.js';

/**
 * 處理故事相關的 API 請求
 * @param {Request} request 
 * @param {object} env 
 * @param {object} user - 當前使用者（可為 null）
 * @returns {Response}
 */
export async function handleStoryRequest(request, env, user = null) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 獲取使用者時間線
    if (pathname === '/api/story/timeline' && request.method === 'GET') {
      return await handleGetTimeline(request, env, user);
    }

    // 獲取地點故事
    if (pathname === '/api/story/location' && request.method === 'GET') {
      return await handleGetLocationStories(request, env, user);
    }

    // 創建故事
    if (pathname === '/api/story/create' && request.method === 'POST') {
      return await handleCreateStory(request, env, user);
    }

    // 獲取故事統計
    if (pathname === '/api/story/statistics' && request.method === 'GET') {
      return await handleGetStatistics(request, env, user);
    }

    // 獲取完整故事
    if (pathname.startsWith('/api/story/') && request.method === 'GET') {
      const storyId = pathname.split('/').pop();
      if (storyId && storyId !== 'timeline' && storyId !== 'location' && storyId !== 'create' && storyId !== 'statistics' && storyId !== 'share') {
        return await handleGetStory(storyId, env, user);
      }
    }

    // 分享故事
    if (pathname === '/api/story/share' && request.method === 'POST') {
      return await handleShareStory(request, env, user);
    }

    // 獲取分享連結
    if (pathname.startsWith('/api/story/share/') && request.method === 'GET') {
      const shareId = pathname.split('/').pop();
      return await handleGetSharedStory(shareId, env);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Story API] Error:', error);
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
 * 獲取使用者時間線
 */
async function handleGetTimeline(request, env, user) {
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
    const actionType = url.searchParams.get('action_type'); // 可選篩選
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const storyModule = new StoryModule(env.DB);
    const timeline = await storyModule.getPersonTimeline(user.id, actionType);

    // 分頁處理
    const paginatedTimeline = timeline.slice(offset, offset + limit);

    return new Response(JSON.stringify({
      success: true,
      timeline: paginatedTimeline,
      total: timeline.length,
      hasMore: offset + limit < timeline.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Story API] Error getting timeline:', error);
    throw error;
  }
}

/**
 * 獲取地點故事
 */
async function handleGetLocationStories(request, env, user) {
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

    const actionType = url.searchParams.get('action_type'); // 可選篩選
    const storyModule = new StoryModule(env.DB);
    const stories = await storyModule.getLocationStories(locationId, actionType);

    return new Response(JSON.stringify({
      success: true,
      stories: stories
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Story API] Error getting location stories:', error);
    throw error;
  }
}

/**
 * 創建故事
 */
async function handleCreateStory(request, env, user) {
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
    const { location_id, action_type, description } = body;

    if (!location_id || !action_type) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'location_id and action_type are required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const storyModule = new StoryModule(env.DB);
    const story = await storyModule.createStory(user.id, location_id, action_type, description);

      const timeModule = new (await import('../modules/TimeModule.js')).TimeModule();
      const actionModule = new (await import('../modules/ActionModule.js')).ActionModule();
      
      return new Response(JSON.stringify({
        success: true,
        story: {
          ...story.toJSON(),
          timeDescription: timeModule.getStoryTimeDescription(story),
          actionName: actionModule.getActionTypeName(story.action_type),
          actionIcon: actionModule.getActionTypeIcon(story.action_type)
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
  } catch (error) {
    console.error('[Story API] Error creating story:', error);
    throw error;
  }
}

/**
 * 獲取故事統計
 */
async function handleGetStatistics(request, env, user) {
  try {
    const url = new URL(request.url);
    const personId = url.searchParams.get('person_id');
    const locationId = url.searchParams.get('location_id');

    if (!personId && !locationId) {
      // 如果沒有指定，使用當前使用者
      if (user && user.id) {
        const storyModule = new StoryModule(env.DB);
        const stats = await storyModule.getStoryStatistics(user.id, null);
        return new Response(JSON.stringify({
          success: true,
          statistics: stats
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'person_id or location_id is required, or user must be authenticated' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const storyModule = new StoryModule(env.DB);
    const stats = await storyModule.getStoryStatistics(personId, locationId);

    return new Response(JSON.stringify({
      success: true,
      statistics: stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Story API] Error getting statistics:', error);
    throw error;
  }
}

/**
 * 獲取完整故事
 */
async function handleGetStory(storyId, env, user) {
  try {
    const storyModule = new StoryModule(env.DB);
    const story = await storyModule.getFullStory(storyId);

    if (!story) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Story not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      story: story
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Story API] Error getting story:', error);
    throw error;
  }
}

