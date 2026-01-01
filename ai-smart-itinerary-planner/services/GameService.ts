/**
 * GameService - 遊戲化服務（前端）
 * 整合記憶膠囊、角色、點數、任務等遊戲化功能
 */

import { getAPIClient, APIResponse, APIClient } from './APIClient';

export interface MemoryCapsule {
  id: string;
  userId: string;
  locationId: string;
  locationName?: string;
  title: string;
  content?: string;
  photoUrl?: string;
  capsuleType: 'memory' | 'story' | 'review';
  status: 'active' | 'archived' | 'deleted';
  createdAt: number;
  updatedAt: number;
}

export interface GameStats {
  points: number;
  level: number;
  role: 'visitor' | 'merchant' | 'local';
  badges: string[];
  visitCount: number;
  memoryCount: number;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  badgeType: 'visitor' | 'merchant' | 'local' | 'special';
  pointsReward: number;
  earnedAt?: number;
}

export interface GameTask {
  id: string;
  title: string;
  description?: string;
  taskType: 'memory_upload' | 'merchant_reply' | 'local_story' | 'visit_location';
  targetRole: 'visitor' | 'merchant' | 'local' | 'all';
  pointsReward: number;
  badgeReward?: string;
  isActive: boolean;
  isCompleted?: boolean;
  completedAt?: number;
}

export interface CreateMemoryCapsuleRequest {
  locationId: string;
  title: string;
  content?: string;
  photoUrl?: string;
  capsuleType?: 'memory' | 'story' | 'review';
}

export class GameService {
  private apiClient: APIClient;
  constructor(apiClientInstance?: APIClient) {
    this.apiClient = apiClientInstance || getAPIClient();
  }

  /**
   * 獲取用戶遊戲統計
   */
  async getGameStats(userId?: string): Promise<APIResponse<GameStats>> {
    const endpoint = userId ? `/game/stats/${userId}` : '/game/stats';
    return this.apiClient.get<GameStats>(endpoint);
  }

  /**
   * 更新遊戲統計
   */
  async updateGameStats(updates: Partial<GameStats>): Promise<APIResponse<GameStats>> {
    return this.apiClient.post<GameStats>('/game/stats', updates);
  }

  /**
   * 建立記憶膠囊
   */
  async createMemoryCapsule(data: CreateMemoryCapsuleRequest): Promise<APIResponse<MemoryCapsule>> {
    return this.apiClient.post<MemoryCapsule>('/game/memory-capsules', data);
  }

  /**
   * 獲取用戶的記憶膠囊列表
   */
  async getMemoryCapsules(userId?: string, limit?: number): Promise<APIResponse<MemoryCapsule[]>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return this.apiClient.get<MemoryCapsule[]>(`/game/memory-capsules${query ? `?${query}` : ''}`);
  }

  /**
   * 獲取單一記憶膠囊
   */
  async getMemoryCapsule(capsuleId: string): Promise<APIResponse<MemoryCapsule>> {
    return this.apiClient.get<MemoryCapsule>(`/game/memory-capsules/${capsuleId}`);
  }

  /**
   * 更新記憶膠囊
   */
  async updateMemoryCapsule(
    capsuleId: string,
    updates: Partial<CreateMemoryCapsuleRequest>
  ): Promise<APIResponse<MemoryCapsule>> {
    return this.apiClient.put<MemoryCapsule>(`/game/memory-capsules/${capsuleId}`, updates);
  }

  /**
   * 刪除記憶膠囊
   */
  async deleteMemoryCapsule(capsuleId: string): Promise<APIResponse<void>> {
    return this.apiClient.delete<void>(`/game/memory-capsules/${capsuleId}`);
  }

  /**
   * 獲取用戶的勳章列表
   */
  async getBadges(userId?: string): Promise<APIResponse<Badge[]>> {
    const endpoint = userId ? `/game/badges/${userId}` : '/game/badges';
    return this.apiClient.get<Badge[]>(endpoint);
  }

  /**
   * 獲取所有可用勳章
   */
  async getAllBadges(): Promise<APIResponse<Badge[]>> {
    return this.apiClient.get<Badge[]>('/game/badges/all');
  }

  /**
   * 獲取用戶的任務列表
   */
  async getTasks(userId?: string): Promise<APIResponse<GameTask[]>> {
    const endpoint = userId ? `/game/tasks/${userId}` : '/game/tasks';
    return this.apiClient.get<GameTask[]>(endpoint);
  }

  /**
   * 完成任務
   */
  async completeTask(taskId: string): Promise<APIResponse<GameTask>> {
    return this.apiClient.post<GameTask>(`/game/tasks/${taskId}/complete`);
  }

  /**
   * 獲取用戶角色
   */
  async getUserRole(userId?: string): Promise<APIResponse<'visitor' | 'merchant' | 'local'>> {
    const endpoint = userId ? `/game/role/${userId}` : '/game/role';
    return this.apiClient.get<'visitor' | 'merchant' | 'local'>(endpoint);
  }

  /**
   * 更新用戶角色
   */
  async updateUserRole(role: 'visitor' | 'merchant' | 'local'): Promise<APIResponse<void>> {
    return this.apiClient.put<void>('/game/role', { role });
  }

  /**
   * 增加用戶點數
   */
  async addPoints(points: number): Promise<APIResponse<GameStats>> {
    return this.apiClient.post<GameStats>('/game/points', { points });
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _gameService: GameService | null = null;
export const getGameService = (): GameService => {
  if (!_gameService) {
    _gameService = new GameService();
  }
  return _gameService;
};
// 使用 getter 屬性以延遲初始化
export const gameService = new Proxy({} as GameService, {
  get(target, prop) {
    return getGameService()[prop as keyof GameService];
  }
});

