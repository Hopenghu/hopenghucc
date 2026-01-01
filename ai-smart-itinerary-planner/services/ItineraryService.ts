/**
 * ItineraryService - 行程管理服務（前端）
 * 處理行程的建立、讀取、更新、刪除等操作
 */

import { getAPIClient, APIResponse, APIClient } from './APIClient';
import { DayPlan, ItineraryItem, Place } from '../types';

export interface Itinerary {
  id: string;
  userId: string;
  title?: string;
  dayPlans: DayPlan[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateItineraryRequest {
  title?: string;
  dayPlans: DayPlan[];
}

export interface UpdateItineraryRequest {
  title?: string;
  dayPlans?: DayPlan[];
}

export class ItineraryService {
  private apiClient: APIClient;
  constructor(apiClientInstance?: APIClient) {
    this.apiClient = apiClientInstance || getAPIClient();
  }

  /**
   * 建立新行程
   */
  async createItinerary(data: CreateItineraryRequest): Promise<APIResponse<Itinerary>> {
    return this.apiClient.post<Itinerary>('/itinerary', data);
  }

  /**
   * 獲取行程
   */
  async getItinerary(id: string): Promise<APIResponse<Itinerary>> {
    return this.apiClient.get<Itinerary>(`/itinerary/${id}`);
  }

  /**
   * 獲取用戶的所有行程
   */
  async getUserItineraries(): Promise<APIResponse<Itinerary[]>> {
    return this.apiClient.get<Itinerary[]>('/itinerary');
  }

  /**
   * 更新行程
   */
  async updateItinerary(id: string, updates: UpdateItineraryRequest): Promise<APIResponse<Itinerary>> {
    return this.apiClient.put<Itinerary>(`/itinerary/${id}`, updates);
  }

  /**
   * 刪除行程
   */
  async deleteItinerary(id: string): Promise<APIResponse<void>> {
    return this.apiClient.delete<void>(`/itinerary/${id}`);
  }

  /**
   * 優化行程（使用 AI）
   */
  async optimizeItinerary(id: string, dayIndex?: number): Promise<APIResponse<Itinerary>> {
    return this.apiClient.post<Itinerary>(`/itinerary/${id}/optimize`, { dayIndex });
  }

  /**
   * 儲存行程到本地（離線支援）
   */
  saveToLocal(id: string, itinerary: Itinerary): void {
    try {
      const key = `itinerary_${id}`;
      localStorage.setItem(key, JSON.stringify(itinerary));
      localStorage.setItem(`itinerary_${id}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('[ItineraryService] Failed to save to local storage:', error);
    }
  }

  /**
   * 從本地載入行程（離線支援）
   */
  loadFromLocal(id: string): Itinerary | null {
    try {
      const key = `itinerary_${id}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[ItineraryService] Failed to load from local storage:', error);
      return null;
    }
  }

  /**
   * 同步本地行程到伺服器
   */
  async syncLocalItinerary(id: string): Promise<APIResponse<Itinerary>> {
    const local = this.loadFromLocal(id);
    if (!local) {
      return {
        success: false,
        error: 'No local itinerary found',
      };
    }

    // 嘗試更新伺服器上的行程
    return this.updateItinerary(id, {
      dayPlans: local.dayPlans,
      title: local.title,
    });
  }

  /**
   * 自動儲存行程（帶版本控制）
   */
  async autoSave(itinerary: Itinerary): Promise<void> {
    try {
      // 儲存到本地
      this.saveToLocal(itinerary.id, {
        ...itinerary,
        _localVersion: Date.now(),
        _lastSynced: null,
      });

      // 嘗試同步到伺服器（不等待完成）
      this.updateItinerary(itinerary.id, {
        dayPlans: itinerary.dayPlans,
        title: itinerary.title,
      }).then((response) => {
        if (response.success && response.data) {
          // 更新本地版本標記為已同步
          const local = this.loadFromLocal(itinerary.id);
          if (local) {
            this.saveToLocal(itinerary.id, {
              ...response.data,
              _localVersion: local._localVersion,
              _lastSynced: Date.now(),
            });
          }
        }
      }).catch((error) => {
        console.error('[ItineraryService] Auto-save failed:', error);
        // 保持本地版本，標記為未同步
      });
    } catch (error) {
      console.error('[ItineraryService] Error in auto-save:', error);
    }
  }

  /**
   * 檢查並解決衝突
   */
  async resolveConflict(
    localItinerary: Itinerary,
    serverItinerary: Itinerary,
    strategy: 'local' | 'server' | 'merge' = 'merge'
  ): Promise<Itinerary> {
    if (strategy === 'local') {
      return localItinerary;
    }
    if (strategy === 'server') {
      return serverItinerary;
    }

    // 合併策略：保留較新的變更
    const merged: Itinerary = {
      ...serverItinerary,
      dayPlans: localItinerary.dayPlans.map((localDay, dayIndex) => {
        const serverDay = serverItinerary.dayPlans[dayIndex];
        if (!serverDay) return localDay;

        // 合併項目，保留較新的
        const mergedItems = [...localDay.items];
        serverDay.items.forEach((serverItem) => {
          const localItemIndex = mergedItems.findIndex(
            (item) => item.id === serverItem.id
          );
          if (localItemIndex === -1) {
            mergedItems.push(serverItem);
          } else {
            // 比較時間戳，保留較新的
            const localItem = mergedItems[localItemIndex];
            // 簡單策略：保留本地版本（因為用戶正在編輯）
            // 實際應用中可以根據更複雜的邏輯決定
          }
        });

        return {
          ...localDay,
          items: mergedItems,
        };
      }),
    };

    return merged;
  }

  /**
   * 載入行程（自動處理離線/線上狀態）
   */
  async loadItineraryWithFallback(id: string): Promise<Itinerary | null> {
    try {
      // 先嘗試從伺服器載入
      const response = await this.getItinerary(id);
      if (response.success && response.data) {
        // 儲存到本地作為快取
        this.saveToLocal(id, response.data);
        return response.data;
      }
    } catch (error) {
      console.warn('[ItineraryService] Failed to load from server, trying local:', error);
    }

    // 如果伺服器載入失敗，嘗試從本地載入
    const local = this.loadFromLocal(id);
    if (local) {
      // 嘗試在背景同步
      this.syncLocalItinerary(id).catch((error) => {
        console.error('[ItineraryService] Background sync failed:', error);
      });
      return local;
    }

    return null;
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _itineraryService: ItineraryService | null = null;
export const getItineraryService = (): ItineraryService => {
  if (!_itineraryService) {
    _itineraryService = new ItineraryService();
  }
  return _itineraryService;
};
// 使用 getter 屬性以延遲初始化
export const itineraryService = new Proxy({} as ItineraryService, {
  get(target, prop) {
    return getItineraryService()[prop as keyof ItineraryService];
  }
});

