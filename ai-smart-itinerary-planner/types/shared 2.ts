/**
 * Shared Types - 前後端共享的類型定義
 * 確保 API 請求/回應的一致性
 */

import { Place, DayPlan, ItineraryItem } from './index';

// API 通用回應格式
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 用戶相關類型
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
  createdAt?: number;
  updatedAt?: number;
}

export interface UserProfile extends User {
  bio?: string;
  stats?: {
    visitedLocations: number;
    favoriteLocations: number;
    itineraries: number;
    stories: number;
  };
}

// 行程相關類型
export interface Itinerary {
  id: string;
  userId: string;
  title?: string;
  dayPlans: DayPlan[];
  createdAt: number;
  updatedAt: number;
  _localVersion?: number;
  _lastSynced?: number | null;
}

export interface CreateItineraryRequest {
  title?: string;
  dayPlans: DayPlan[];
}

export interface UpdateItineraryRequest {
  title?: string;
  dayPlans?: DayPlan[];
}

// 地點相關類型
export interface LocationDetail extends Place {
  googlePlaceId?: string;
  description?: string;
  photos?: string[];
  rating?: number;
  userRatingCount?: number;
  phoneNumber?: string;
  website?: string;
  types?: string[];
  businessStatus?: string;
  editorialSummary?: string;
}

export interface UserLocationInteraction {
  userId: string;
  locationId: string;
  status: 'visited' | 'want_to_visit' | 'want_to_revisit';
  visitedAt?: number;
  notes?: string;
}

export interface LocationSearchParams {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  type?: string;
}

// 認證相關類型
export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

// 用戶足跡和故事類型
export interface Footprint {
  id: string;
  locationId: string;
  locationName: string;
  visitedAt: number;
  notes?: string;
  photos?: string[];
}

export interface Story {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  photos?: string[];
}

// AI 相關類型
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIChatContext {
  itineraryId?: string;
  currentDay?: number;
  places?: string[];
}

// 資料庫類型（用於後端）
export interface DatabaseItinerary {
  id: string;
  user_id: string;
  title: string | null;
  created_at: number;
  updated_at: number;
}

export interface DatabaseItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date: string;
  created_at: number;
}

export interface DatabaseItineraryItem {
  id: string;
  day_id: string;
  place_id: string | null;
  place_name: string;
  start_time: string;
  duration: number;
  order_index: number;
  created_at: number;
}

