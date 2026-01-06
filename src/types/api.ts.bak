/**
 * API Types - 後端 API 請求/回應類型定義
 */

// 通用 API 回應
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 行程 API 類型
export interface CreateItineraryRequest {
  title?: string;
  dayPlans: Array<{
    date: string;
    items: Array<{
      id: string;
      place: {
        id: string;
        name: string;
        address?: string;
        location?: {
          lat: number;
          lng: number;
        };
      };
      startTime: string;
      duration: number;
    }>;
  }>;
}

export interface UpdateItineraryRequest {
  title?: string;
  dayPlans?: CreateItineraryRequest['dayPlans'];
}

export interface ItineraryResponse {
  id: string;
  userId: string;
  title?: string;
  dayPlans: CreateItineraryRequest['dayPlans'];
  createdAt: number;
  updatedAt: number;
}

// 地點 API 類型
export interface LocationSearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  type?: string;
}

export interface LocationStatusUpdateRequest {
  locationId: string;
  status: 'visited' | 'want_to_visit' | 'want_to_revisit';
  notes?: string;
}

// 認證 API 類型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role?: 'user' | 'admin';
  };
  session: {
    id: string;
    userId: string;
    expiresAt: number;
  };
}

// AI API 類型
export interface AIChatRequest {
  message: string;
  context?: {
    itineraryId?: string;
    currentDay?: number;
    places?: string[];
  };
}

export interface AIChatResponse {
  response: string;
  message?: string;
}

