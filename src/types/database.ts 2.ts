/**
 * Database Types - 後端資料庫類型定義
 * 對應 D1 資料庫的結構
 */

// 用戶表
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: number;
  updated_at: number;
}

// 會話表
export interface Session {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}

// 地點表
export interface Location {
  id: string;
  google_place_id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  google_types?: string;
  website?: string;
  phone_number?: string;
  business_status?: string;
  google_rating?: number;
  google_user_ratings_total?: number;
  photo_urls?: string;
  editorial_summary?: string;
  source_type: string;
  created_at: number;
  updated_at: number;
}

// 用戶地點關聯表
export interface UserLocation {
  id: string;
  user_id: string;
  location_id: string;
  status: 'visited' | 'want_to_visit' | 'want_to_revisit' | 'created';
  description?: string;
  visited_at?: number;
  created_at: number;
  updated_at: number;
}

// 行程表
export interface Itinerary {
  id: string;
  user_id: string;
  title?: string;
  created_at: number;
  updated_at: number;
}

// 行程天數表
export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date: string;
  created_at: number;
}

// 行程項目表
export interface ItineraryItem {
  id: string;
  day_id: string;
  place_id?: string;
  place_name: string;
  start_time: string;
  duration: number;
  order_index: number;
  created_at: number;
}

// AI 對話表
export interface AIConversation {
  id: string;
  user_id?: string;
  session_id?: string;
  message_type: 'user' | 'assistant';
  message_content: string;
  context_data?: string;
  created_at: number;
}

// AI 對話狀態表
export interface AIConversationState {
  id: string;
  user_id?: string;
  session_id: string;
  conversation_stage: 'initial' | 'getting_to_know' | 'familiar' | 'friend';
  total_rounds: number;
  relationship_depth: number;
  created_at: number;
  updated_at: number;
}

