/**
 * 專案配置
 * @module config
 */

export const config = {
  // 應用資訊
  app: {
    name: 'HOPE PENGHU',
    description: '好澎湖旅遊平台',
  },
  
  // Google Maps 設定
  googleMaps: {
    defaultCenter: { lat: 23.5711, lng: 119.5793 }, // 澎湖
    defaultZoom: 11,
  },
  
  // 分頁設定
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 50,
  },
  
  // 快取設定（秒）
  cache: {
    short: 300,      // 5 分鐘
    medium: 3600,    // 1 小時
    long: 86400,     // 1 天
  },
};

export default config;

