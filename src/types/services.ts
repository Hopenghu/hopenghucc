/**
 * Service Types - 後端服務類型定義
 */

import type { D1Database } from '@cloudflare/workers-types';

// 服務基礎介面
export interface BaseService {
  db: D1Database;
}

// LocationService 類型
export interface LocationServiceInterface {
  fetchPlaceDetails(googlePlaceId: string): Promise<any>;
  getLocationById(locationId: string): Promise<any>;
  searchLocations(query: string, latitude?: number, longitude?: number): Promise<any>;
  getUserLocations(userId: string): Promise<any[]>;
  setUserLocationStatus(userId: string, locationId: string, status: string): Promise<any>;
}

// AIService 類型
export interface AIServiceInterface {
  handleQuery(userId: string | null, query: string, sessionId?: string): Promise<string>;
  searchKnowledgeBase(query: string): Promise<any[]>;
  optimizeDayPlan(places: any[]): Promise<any>;
}

// AuthService 類型
export interface AuthServiceInterface {
  loginWithPassword(credentials: { email: string; password: string }): Promise<any>;
  registerWithPassword(credentials: { email: string; password: string; name: string }): Promise<any>;
  handleGoogleLogin(code: string): Promise<any>;
  logout(sessionId: string): Promise<void>;
  getUserFromSession(sessionId: string): Promise<any>;
}

// ItineraryService 類型
export interface ItineraryServiceInterface {
  createItinerary(userId: string, data: any): Promise<any>;
  getItinerary(userId: string, itineraryId: string): Promise<any>;
  getUserItineraries(userId: string): Promise<any[]>;
  updateItinerary(userId: string, itineraryId: string, updates: any): Promise<any>;
  deleteItinerary(userId: string, itineraryId: string): Promise<void>;
  optimizeItinerary(userId: string, itineraryId: string, dayIndex?: number | null): Promise<any>;
}

// UserService 類型
export interface UserServiceInterface {
  createUserWithPassword(email: string, password: string, name: string): Promise<any>;
  findUserByEmail(email: string): Promise<any>;
  findUserById(id: string): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
}

// SessionService 類型
export interface SessionServiceInterface {
  createSession(userId: string): Promise<any>;
  getSessionById(sessionId: string): Promise<any>;
  deleteSession(sessionId: string): Promise<void>;
  extendSession(sessionId: string): Promise<void>;
}

