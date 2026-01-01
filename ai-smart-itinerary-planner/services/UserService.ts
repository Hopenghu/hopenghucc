/**
 * UserService - 用戶資料服務（前端）
 * 處理用戶個人資料、足跡、故事時間軸等操作
 */

import { getAPIClient, APIResponse, APIClient } from './APIClient';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: number;
  stats?: {
    visitedLocations: number;
    favoriteLocations: number;
    itineraries: number;
    stories: number;
  };
}

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

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export class UserService {
  private apiClient: APIClient;
  constructor(apiClientInstance?: APIClient) {
    this.apiClient = apiClientInstance || getAPIClient();
  }

  /**
   * 獲取用戶個人資料
   */
  async getProfile(userId?: string): Promise<APIResponse<UserProfile>> {
    const endpoint = userId ? `/user/${userId}/profile` : '/user/profile';
    return this.apiClient.get<UserProfile>(endpoint);
  }

  /**
   * 更新用戶個人資料
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<APIResponse<UserProfile>> {
    return this.apiClient.put<UserProfile>('/user/profile', updates);
  }

  /**
   * 獲取用戶足跡（Footprints）
   */
  async getFootprints(userId?: string): Promise<APIResponse<Footprint[]>> {
    const endpoint = userId ? `/user/${userId}/footprints` : '/user/footprints';
    return this.apiClient.get<Footprint[]>(endpoint);
  }

  /**
   * 新增足跡
   */
  async addFootprint(locationId: string, visitedAt: number, notes?: string): Promise<APIResponse<Footprint>> {
    return this.apiClient.post<Footprint>('/user/footprints', {
      locationId,
      visitedAt,
      notes,
    });
  }

  /**
   * 刪除足跡
   */
  async deleteFootprint(footprintId: string): Promise<APIResponse<void>> {
    return this.apiClient.delete<void>(`/user/footprints/${footprintId}`);
  }

  /**
   * 獲取用戶故事時間軸（StoryTimeline）
   */
  async getStoryTimeline(userId?: string): Promise<APIResponse<Story[]>> {
    const endpoint = userId ? `/user/${userId}/stories` : '/user/stories';
    return this.apiClient.get<Story[]>(endpoint);
  }

  /**
   * 獲取單一故事
   */
  async getStory(storyId: string): Promise<APIResponse<Story>> {
    return this.apiClient.get<Story>(`/user/stories/${storyId}`);
  }

  /**
   * 建立新故事
   */
  async createStory(data: {
    locationId: string;
    title: string;
    content: string;
    photos?: string[];
  }): Promise<APIResponse<Story>> {
    return this.apiClient.post<Story>('/user/stories', data);
  }

  /**
   * 更新故事
   */
  async updateStory(storyId: string, updates: {
    title?: string;
    content?: string;
    photos?: string[];
  }): Promise<APIResponse<Story>> {
    return this.apiClient.put<Story>(`/user/stories/${storyId}`, updates);
  }

  /**
   * 刪除故事
   */
  async deleteStory(storyId: string): Promise<APIResponse<void>> {
    return this.apiClient.delete<void>(`/user/stories/${storyId}`);
  }

  /**
   * 獲取用戶統計資料
   */
  async getStats(userId?: string): Promise<APIResponse<UserProfile['stats']>> {
    const endpoint = userId ? `/user/${userId}/stats` : '/user/stats';
    return this.apiClient.get<UserProfile['stats']>(endpoint);
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _userService: UserService | null = null;
export const getUserService = (): UserService => {
  if (!_userService) {
    _userService = new UserService();
  }
  return _userService;
};
// 使用 getter 屬性以延遲初始化
export const userService = new Proxy({} as UserService, {
  get(target, prop) {
    return getUserService()[prop as keyof UserService];
  }
});

