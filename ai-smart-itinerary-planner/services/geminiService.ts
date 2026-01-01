
import { Place } from "../types";

export class GeminiService {
  // 不再需要 getClient，因為現在通過後端 API 調用

  async searchPlaces(query: string, latitude?: number, longitude?: number): Promise<Place[]> {
    try {
      // 改為通過後端 API 調用，保護 API key
      const response = await fetch('/api/itinerary/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, latitude, longitude })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search places');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Gemini Search Error:", error);
      return [];
    }
  }

  async optimizeDayPlan(places: Place[]): Promise<any> {
    try {
      // 改為通過後端 API 調用，保護 API key
      const response = await fetch('/api/itinerary/optimize-day-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ places })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize day plan');
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error("Gemini Optimization Error:", error);
      return null;
    }
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _geminiService: GeminiService | null = null;
export const getGeminiService = (): GeminiService => {
  if (!_geminiService) {
    _geminiService = new GeminiService();
  }
  return _geminiService;
};
// 使用 getter 屬性以延遲初始化
export const geminiService = new Proxy({} as GeminiService, {
  get(target, prop) {
    return getGeminiService()[prop as keyof GeminiService];
  }
});
