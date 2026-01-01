/**
 * LocationService - 地點查詢服務（前端）
 * 處理地點搜尋、詳情查詢、用戶互動等操作
 */

import { getAPIClient, APIResponse, APIClient } from './APIClient';
import { Place } from '../types';

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

export class LocationService {
  private apiClient: APIClient;
  constructor(apiClientInstance?: APIClient) {
    this.apiClient = apiClientInstance || getAPIClient();
  }

  /**
   * 搜尋地點
   */
  async searchLocations(params: LocationSearchParams): Promise<APIResponse<Place[]>> {
    return this.apiClient.post<Place[]>('/location/search', params);
  }

  /**
   * 獲取地點詳情
   */
  async getLocationDetails(placeId: string): Promise<APIResponse<LocationDetail>> {
    return this.apiClient.get<LocationDetail>(`/location/${placeId}`);
  }

  /**
   * 獲取地點詳情（使用 Google Place ID）
   */
  async getLocationByGooglePlaceId(googlePlaceId: string): Promise<APIResponse<LocationDetail>> {
    return this.apiClient.get<LocationDetail>(`/location/google/${googlePlaceId}`);
  }

  /**
   * 設定用戶地點互動狀態
   */
  async setUserLocationStatus(
    locationId: string,
    status: 'visited' | 'want_to_visit' | 'want_to_revisit',
    notes?: string
  ): Promise<APIResponse<UserLocationInteraction>> {
    return this.apiClient.post<UserLocationInteraction>(`/location/${locationId}/interaction`, {
      status,
      notes,
    });
  }

  /**
   * 獲取用戶的地點互動狀態
   */
  async getUserLocationStatus(locationId: string): Promise<APIResponse<UserLocationInteraction | null>> {
    return this.apiClient.get<UserLocationInteraction | null>(`/location/${locationId}/interaction`);
  }

  /**
   * 收藏地點
   */
  async favoriteLocation(locationId: string): Promise<APIResponse<void>> {
    return this.apiClient.post<void>(`/location/${locationId}/favorite`);
  }

  /**
   * 取消收藏地點
   */
  async unfavoriteLocation(locationId: string): Promise<APIResponse<void>> {
    return this.apiClient.delete<void>(`/location/${locationId}/favorite`);
  }

  /**
   * 獲取用戶收藏的地點列表
   */
  async getFavoriteLocations(): Promise<APIResponse<Place[]>> {
    return this.apiClient.get<Place[]>('/location/favorites');
  }

  /**
   * 獲取用戶訪問過的地點列表
   */
  async getVisitedLocations(): Promise<APIResponse<Place[]>> {
    return this.apiClient.get<Place[]>('/location/visited');
  }

  /**
   * 獲取用戶個人地點收藏
   * @param status - 篩選狀態：'visited' | 'want_to_visit' | 'want_to_revisit'
   * @param category - 篩選分類：'restaurant' | 'attraction' | 'hotel' | etc.
   */
  async getPersonalLocations(status?: string, category?: string): Promise<APIResponse<Place[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    const query = params.toString();
    return this.apiClient.get<Place[]>(`/itinerary/location/personal${query ? '?' + query : ''}`);
  }

  /**
   * 獲取地點評論
   */
  async getLocationComments(locationId: string): Promise<APIResponse<any[]>> {
    return this.apiClient.get<any[]>(`/location/${locationId}/comments`);
  }

  /**
   * 新增地點評論
   */
  async addLocationComment(locationId: string, comment: string, rating?: number): Promise<APIResponse<any>> {
    return this.apiClient.post<any>(`/location/${locationId}/comments`, {
      comment,
      rating,
    });
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _locationService: LocationService | null = null;
export const getLocationService = (): LocationService => {
  if (!_locationService) {
    _locationService = new LocationService();
  }
  return _locationService;
};
// 使用 getter 屬性以延遲初始化
export const locationService = new Proxy({} as LocationService, {
  get(target, prop) {
    return getLocationService()[prop as keyof LocationService];
  }
});

