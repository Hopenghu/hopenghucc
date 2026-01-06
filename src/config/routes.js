/**
 * 路由常數定義
 * @module routes
 */

export const ROUTES = {
  // 公開路由
  HOME: '/',
  LOGIN: '/login',
  LOCATION: (id) => `/location/${id}`,
  SHARED_TRIP: (token) => `/trip-planner/shared/${token}`,
  
  // 認證路由
  PROFILE: '/profile',
  FOOTPRINTS: '/footprints',
  TRIP_PLANNER: '/trip-planner',
  AI_CHAT: '/ai-chat',
  SEARCH: '/search',
  FAVORITES: '/favorites',
  STORY_TIMELINE: '/story-timeline',
  RECOMMENDATIONS: '/recommendations',
  GOOGLE_INFO: '/google-info',
  GAME: '/game',
  DESIGN_PREVIEW: '/design-preview',
  
  // 測試路由（開發用）
  TEST: '/test',
  TEST_SIMPLE: '/test-simple',
  
  // 管理員路由
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    IMAGES: '/admin/images',
    AI: '/admin/ai',
    VERIFICATIONS: '/admin/verifications',
    ECOSYSTEM: '/admin/ecosystem',
    KNOWLEDGE: '/admin/knowledge',
  },
};

export default ROUTES;

