/**
 * ItineraryService - 行程管理服務（後端 TypeScript 版本）
 * 處理行程的建立、讀取、更新、刪除、優化等操作
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { ItineraryServiceInterface } from '../../types/services';
import type { DatabaseItinerary, DatabaseItineraryDay, DatabaseItineraryItem } from '../../types/database';
import type { CreateItineraryRequest, UpdateItineraryRequest, ItineraryResponse } from '../../types/api';

interface LocationService {
  getLocationById(locationId: string): Promise<any>;
}

interface AIService {
  optimizeDayPlan(places: any[]): Promise<any>;
}

export class ItineraryService implements ItineraryServiceInterface {
  private db: D1Database;
  private locationService: LocationService | null;
  private aiService: AIService | null;

  constructor(
    db: D1Database,
    locationService: LocationService | null = null,
    aiService: AIService | null = null
  ) {
    if (!db) {
      throw new Error('Database connection is required for ItineraryService.');
    }
    this.db = db;
    this.locationService = locationService;
    this.aiService = aiService;
  }

  /**
   * 建立新行程
   */
  async createItinerary(userId: string, data: CreateItineraryRequest): Promise<ItineraryResponse> {
    try {
      const { title, dayPlans } = data;
      const itineraryId = `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // 建立行程主記錄
      await this.db.prepare(
        `INSERT INTO itineraries (id, user_id, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        itineraryId,
        userId,
        title || null,
        now,
        now
      ).run();

      // 建立天數記錄和項目記錄
      for (let dayIndex = 0; dayIndex < dayPlans.length; dayIndex++) {
        const dayPlan = dayPlans[dayIndex];
        const dayId = `day_${itineraryId}_${dayIndex}`;

        await this.db.prepare(
          `INSERT INTO itinerary_days (id, itinerary_id, day_number, date, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          dayId,
          itineraryId,
          dayIndex + 1,
          dayPlan.date || `第 ${dayIndex + 1} 天`,
          now
        ).run();

        // 建立項目記錄
        for (let itemIndex = 0; itemIndex < dayPlan.items.length; itemIndex++) {
          const item = dayPlan.items[itemIndex];
          const itemId = item.id || `item_${dayId}_${itemIndex}`;

          await this.db.prepare(
            `INSERT INTO itinerary_items (
              id, day_id, place_id, place_name, start_time, duration, order_index, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            itemId,
            dayId,
            item.place.id || null,
            item.place.name,
            item.startTime || '09:00',
            item.duration || 60,
            itemIndex,
            now
          ).run();
        }
      }

      // 獲取完整行程資料
      return await this.getItinerary(userId, itineraryId);
    } catch (error) {
      console.error('[ItineraryService] Error creating itinerary:', error);
      throw error;
    }
  }

  /**
   * 獲取行程
   */
  async getItinerary(userId: string, itineraryId: string): Promise<ItineraryResponse | null> {
    try {
      // 獲取行程主記錄
      const itinerary = await this.db.prepare(
        `SELECT id, user_id, title, created_at, updated_at
         FROM itineraries
         WHERE id = ? AND user_id = ?`
      ).bind(itineraryId, userId).first<DatabaseItinerary>();

      if (!itinerary) {
        return null;
      }

      // 獲取天數記錄
      const days = await this.db.prepare(
        `SELECT id, day_number, date
         FROM itinerary_days
         WHERE itinerary_id = ?
         ORDER BY day_number ASC`
      ).bind(itineraryId).all<DatabaseItineraryDay>();

      const dayPlans = [];

      for (const day of days.results) {
        // 獲取項目記錄
        const items = await this.db.prepare(
          `SELECT id, place_id, place_name, start_time, duration, order_index
           FROM itinerary_items
           WHERE day_id = ?
           ORDER BY order_index ASC`
        ).bind(day.id).all<DatabaseItineraryItem>();

        const itineraryItems = [];

        for (const item of items.results) {
          let place = {
            id: item.place_id || item.id,
            name: item.place_name,
          };

          // 如果有 place_id，嘗試獲取完整地點資訊
          if (item.place_id && this.locationService) {
            try {
              const locationDetails = await this.locationService.getLocationById(item.place_id);
              if (locationDetails) {
                place = {
                  id: locationDetails.id,
                  name: locationDetails.name,
                  address: locationDetails.address,
                  location: locationDetails.latitude && locationDetails.longitude ? {
                    lat: locationDetails.latitude,
                    lng: locationDetails.longitude,
                  } : undefined,
                  rating: locationDetails.google_rating,
                  userRatingCount: locationDetails.google_user_ratings_total,
                };
              }
            } catch (error) {
              console.warn('[ItineraryService] Failed to fetch location details:', error);
            }
          }

          itineraryItems.push({
            id: item.id,
            place,
            startTime: item.start_time,
            duration: item.duration,
          });
        }

        dayPlans.push({
          date: day.date,
          items: itineraryItems,
        });
      }

      return {
        id: itinerary.id,
        userId: itinerary.user_id,
        title: itinerary.title || undefined,
        dayPlans,
        createdAt: itinerary.created_at,
        updatedAt: itinerary.updated_at,
      };
    } catch (error) {
      console.error('[ItineraryService] Error getting itinerary:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶的所有行程
   */
  async getUserItineraries(userId: string): Promise<Omit<ItineraryResponse, 'dayPlans'>[]> {
    try {
      const itineraries = await this.db.prepare(
        `SELECT id, title, created_at, updated_at
         FROM itineraries
         WHERE user_id = ?
         ORDER BY updated_at DESC`
      ).bind(userId).all<Pick<DatabaseItinerary, 'id' | 'title' | 'created_at' | 'updated_at'>>();

      // 只返回基本資訊，不包含完整 dayPlans（節省資源）
      return itineraries.results.map(it => ({
        id: it.id,
        userId,
        title: it.title || undefined,
        createdAt: it.created_at,
        updatedAt: it.updated_at,
      }));
    } catch (error) {
      console.error('[ItineraryService] Error getting user itineraries:', error);
      throw error;
    }
  }

  /**
   * 更新行程
   */
  async updateItinerary(
    userId: string,
    itineraryId: string,
    updates: UpdateItineraryRequest
  ): Promise<ItineraryResponse> {
    try {
      const { title, dayPlans } = updates;
      const now = Date.now();

      // 更新行程主記錄
      if (title !== undefined) {
        await this.db.prepare(
          `UPDATE itineraries
           SET title = ?, updated_at = ?
           WHERE id = ? AND user_id = ?`
        ).bind(title, now, itineraryId, userId).run();
      }

      // 如果更新了 dayPlans，需要重新建立天數和項目記錄
      if (dayPlans) {
        // 刪除現有的天數和項目記錄
        const days = await this.db.prepare(
          `SELECT id FROM itinerary_days WHERE itinerary_id = ?`
        ).bind(itineraryId).all<{ id: string }>();

        for (const day of days.results) {
          await this.db.prepare(
            `DELETE FROM itinerary_items WHERE day_id = ?`
          ).bind(day.id).run();
        }

        await this.db.prepare(
          `DELETE FROM itinerary_days WHERE itinerary_id = ?`
        ).bind(itineraryId).run();

        // 重新建立天數和項目記錄
        for (let dayIndex = 0; dayIndex < dayPlans.length; dayIndex++) {
          const dayPlan = dayPlans[dayIndex];
          const dayId = `day_${itineraryId}_${dayIndex}_${now}`;

          await this.db.prepare(
            `INSERT INTO itinerary_days (id, itinerary_id, day_number, date, created_at)
             VALUES (?, ?, ?, ?, ?)`
          ).bind(
            dayId,
            itineraryId,
            dayIndex + 1,
            dayPlan.date || `第 ${dayIndex + 1} 天`,
            now
          ).run();

          // 建立項目記錄
          for (let itemIndex = 0; itemIndex < dayPlan.items.length; itemIndex++) {
            const item = dayPlan.items[itemIndex];
            const itemId = item.id || `item_${dayId}_${itemIndex}`;

            await this.db.prepare(
              `INSERT INTO itinerary_items (
                id, day_id, place_id, place_name, start_time, duration, order_index, created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              itemId,
              dayId,
              item.place.id || null,
              item.place.name,
              item.startTime || '09:00',
              item.duration || 60,
              itemIndex,
              now
            ).run();
          }
        }

        // 更新行程的 updated_at
        await this.db.prepare(
          `UPDATE itineraries SET updated_at = ? WHERE id = ? AND user_id = ?`
        ).bind(now, itineraryId, userId).run();
      }

      // 返回更新後的行程
      return await this.getItinerary(userId, itineraryId);
    } catch (error) {
      console.error('[ItineraryService] Error updating itinerary:', error);
      throw error;
    }
  }

  /**
   * 刪除行程
   */
  async deleteItinerary(userId: string, itineraryId: string): Promise<void> {
    try {
      // 獲取所有天數 ID
      const days = await this.db.prepare(
        `SELECT id FROM itinerary_days WHERE itinerary_id = ?`
      ).bind(itineraryId).all<{ id: string }>();

      // 刪除所有項目
      for (const day of days.results) {
        await this.db.prepare(
          `DELETE FROM itinerary_items WHERE day_id = ?`
        ).bind(day.id).run();
      }

      // 刪除所有天數
      await this.db.prepare(
        `DELETE FROM itinerary_days WHERE itinerary_id = ?`
      ).bind(itineraryId).run();

      // 刪除行程主記錄
      await this.db.prepare(
        `DELETE FROM itineraries WHERE id = ? AND user_id = ?`
      ).bind(itineraryId, userId).run();
    } catch (error) {
      console.error('[ItineraryService] Error deleting itinerary:', error);
      throw error;
    }
  }

  /**
   * 優化行程（使用 AI）
   */
  async optimizeItinerary(
    userId: string,
    itineraryId: string,
    dayIndex: number | null = null
  ): Promise<ItineraryResponse> {
    try {
      const itinerary = await this.getItinerary(userId, itineraryId);
      if (!itinerary) {
        throw new Error('Itinerary not found');
      }

      if (!this.aiService) {
        throw new Error('AIService is required for optimization');
      }

      // 確定要優化的天數
      const daysToOptimize = dayIndex !== null
        ? [itinerary.dayPlans[dayIndex]]
        : itinerary.dayPlans;

      const optimizedDayPlans = [];

      for (const dayPlan of daysToOptimize) {
        if (dayPlan.items.length < 2) {
          // 如果項目少於 2 個，不需要優化
          optimizedDayPlans.push(dayPlan);
          continue;
        }

        // 使用 AI 服務優化這一天的行程
        const places = dayPlan.items.map(item => item.place);
        const optimizedData = await this.aiService.optimizeDayPlan(places);

        if (optimizedData && optimizedData.itinerary) {
          // 重新排序項目
          const reorderedItems = optimizedData.itinerary.map((optItem: any) => {
            const originalItem = dayPlan.items.find(
              item => item.place.name === optItem.placeName
            );
            if (originalItem) {
              return {
                ...originalItem,
                startTime: optItem.recommendedTime || originalItem.startTime,
              };
            }
            return null;
          }).filter(Boolean) as typeof dayPlan.items;

          optimizedDayPlans.push({
            ...dayPlan,
            items: reorderedItems,
          });
        } else {
          optimizedDayPlans.push(dayPlan);
        }
      }

      // 更新行程
      const finalDayPlans = dayIndex !== null
        ? itinerary.dayPlans.map((day, idx) => idx === dayIndex ? optimizedDayPlans[0] : day)
        : optimizedDayPlans;

      return await this.updateItinerary(userId, itineraryId, {
        dayPlans: finalDayPlans,
      });
    } catch (error) {
      console.error('[ItineraryService] Error optimizing itinerary:', error);
      throw error;
    }
  }
}

