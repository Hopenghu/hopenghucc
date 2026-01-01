/**
 * ItineraryService - 行程管理服務（後端）
 * 處理行程的建立、讀取、更新、刪除、優化等操作
 */

export class ItineraryService {
  constructor(db, locationService, aiService) {
    if (!db) {
      throw new Error('Database connection is required for ItineraryService.');
    }
    this.db = db;
    this.locationService = locationService;
    this.aiService = aiService;
  }

  /**
   * 建立新行程
   * @param {string} userId - 用戶 ID
   * @param {object} data - 行程資料 { title, dayPlans }
   * @returns {Promise<object>} 建立的行程物件
   */
  async createItinerary(userId, data) {
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
          // 生成新的唯一 itemId（不使用前端提供的 ID，避免衝突）
          const itemId = `item_${dayId}_${itemIndex}_${now}_${Math.random().toString(36).substr(2, 9)}`;

          // 處理地點：如果地點有 Google Place 資料，自動創建或獲取地點
          let placeId = item.place?.id || null;
          
          // 如果地點有 google_place_id 但沒有 location id，嘗試從 Google Maps 創建
          if (item.place?.google_place_id && !placeId && this.locationService) {
            try {
              const googlePlaceData = {
                place_id: item.place.google_place_id,
                name: item.place.name,
                formatted_address: item.place.address || item.place.formatted_address,
                geometry: {
                  location: {
                    lat: item.place.latitude || item.place.lat,
                    lng: item.place.longitude || item.place.lng
                  }
                },
                types: item.place.types || [],
                website: item.place.website,
                international_phone_number: item.place.phone_number,
                business_status: item.place.business_status,
                rating: item.place.rating || item.place.google_rating,
                user_ratings_total: item.place.user_ratings_total,
                photos: item.place.photos || []
              };

              const location = await this.locationService.createOrGetLocationFromGoogleMaps(
                googlePlaceData,
                userId,
                {
                  autoLink: true,
                  initialStatus: 'want_to_visit',
                  sourceType: 'itinerary_added'
                }
              );
              
              placeId = location.id;
              
              // 更新統計：增加行程使用次數
              await this.locationService.incrementItineraryUseCount(location.id);
              
              console.log(`[ItineraryService] Created/linked location from Google Maps: ${location.id}`);
            } catch (error) {
              console.warn('[ItineraryService] Failed to create location from Google Maps:', error);
              // 繼續使用 place_name，不設置 place_id
            }
          } else if (placeId) {
            // 驗證 place_id 是否存在於 locations 表中
            try {
              const placeExists = await this.db.prepare(
                `SELECT id FROM locations WHERE id = ?`
              ).bind(placeId).first();
              if (!placeExists) {
                // 如果 place_id 不存在，設為 NULL
                placeId = null;
              } else {
                // 如果存在，更新統計
                if (this.locationService) {
                  await this.locationService.incrementItineraryUseCount(placeId);
                }
              }
            } catch (error) {
              console.warn('[ItineraryService] Failed to verify place_id:', error);
              placeId = null;
            }
          }

          await this.db.prepare(
            `INSERT INTO itinerary_items (
              id, day_id, place_id, place_name, start_time, duration, order_index, created_at, updated_at, status, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            itemId,
            dayId,
            placeId,
            item.place?.name || '未知地點',
            item.startTime || '09:00',
            item.duration || 60,
            itemIndex,
            now,
            now,  // updated_at
            'planned',  // status
            item.notes || null  // notes
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
   * @param {string} userId - 用戶 ID
   * @param {string} itineraryId - 行程 ID
   * @returns {Promise<object>} 行程物件
   */
  async getItinerary(userId, itineraryId) {
    try {
      // 獲取行程主記錄
      const itinerary = await this.db.prepare(
        `SELECT id, user_id, title, created_at, updated_at
         FROM itineraries
         WHERE id = ? AND user_id = ?`
      ).bind(itineraryId, userId).first();

      if (!itinerary) {
        return null;
      }

      // 獲取天數記錄
      const days = await this.db.prepare(
        `SELECT id, day_number, date
         FROM itinerary_days
         WHERE itinerary_id = ?
         ORDER BY day_number ASC`
      ).bind(itineraryId).all();

      const dayPlans = [];

      for (const day of days.results) {
        // 獲取項目記錄
        const items = await this.db.prepare(
          `SELECT id, place_id, place_name, start_time, duration, order_index
           FROM itinerary_items
           WHERE day_id = ?
           ORDER BY order_index ASC`
        ).bind(day.id).all();

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
        title: itinerary.title,
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
   * @param {string} userId - 用戶 ID
   * @returns {Promise<Array>} 行程列表
   */
  async getUserItineraries(userId) {
    try {
      const itineraries = await this.db.prepare(
        `SELECT id, title, created_at, updated_at
         FROM itineraries
         WHERE user_id = ?
         ORDER BY updated_at DESC`
      ).bind(userId).all();

      // 只返回基本資訊，不包含完整 dayPlans（節省資源）
      return itineraries.results.map(it => ({
        id: it.id,
        userId,
        title: it.title,
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
   * @param {string} userId - 用戶 ID
   * @param {string} itineraryId - 行程 ID
   * @param {object} updates - 更新資料 { title, dayPlans }
   * @returns {Promise<object>} 更新後的行程物件
   */
  async updateItinerary(userId, itineraryId, updates) {
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
        // 先刪除所有相關的項目記錄（使用 CASCADE 或直接刪除）
        await this.db.prepare(
          `DELETE FROM itinerary_items 
           WHERE day_id IN (SELECT id FROM itinerary_days WHERE itinerary_id = ?)`
        ).bind(itineraryId).run();

        // 刪除所有天數記錄
        await this.db.prepare(
          `DELETE FROM itinerary_days WHERE itinerary_id = ?`
        ).bind(itineraryId).run();

        // 重新建立天數和項目記錄
        for (let dayIndex = 0; dayIndex < dayPlans.length; dayIndex++) {
          const dayPlan = dayPlans[dayIndex];
          // 生成新的唯一 dayId（包含時間戳確保唯一性）
          const dayId = `day_${itineraryId}_${dayIndex}_${now}_${Math.random().toString(36).substr(2, 9)}`;

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
            // 生成新的唯一 itemId（不使用前端提供的 ID，避免衝突）
            const itemId = `item_${dayId}_${itemIndex}_${now}_${Math.random().toString(36).substr(2, 9)}`;

            // 處理地點：如果地點有 Google Place 資料，自動創建或獲取地點
            let placeId = item.place?.id || null;
            
            // 如果地點有 google_place_id 但沒有 location id，嘗試從 Google Maps 創建
            if (item.place?.google_place_id && !placeId && this.locationService) {
              try {
                const googlePlaceData = {
                  place_id: item.place.google_place_id,
                  name: item.place.name,
                  formatted_address: item.place.address || item.place.formatted_address,
                  geometry: {
                    location: {
                      lat: item.place.latitude || item.place.lat,
                      lng: item.place.longitude || item.place.lng
                    }
                  },
                  types: item.place.types || [],
                  website: item.place.website,
                  international_phone_number: item.place.phone_number,
                  business_status: item.place.business_status,
                  rating: item.place.rating || item.place.google_rating,
                  user_ratings_total: item.place.user_ratings_total,
                  photos: item.place.photos || []
                };

                const location = await this.locationService.createOrGetLocationFromGoogleMaps(
                  googlePlaceData,
                  userId,
                  {
                    autoLink: true,
                    initialStatus: 'want_to_visit',
                    sourceType: 'itinerary_added'
                  }
                );
                
                placeId = location.id;
                
                // 更新統計：增加行程使用次數
                await this.locationService.incrementItineraryUseCount(location.id);
                
                console.log(`[ItineraryService] Created/linked location from Google Maps: ${location.id}`);
              } catch (error) {
                console.warn('[ItineraryService] Failed to create location from Google Maps:', error);
                // 繼續使用 place_name，不設置 place_id
              }
            } else if (placeId) {
              // 驗證 place_id 是否存在於 locations 表中
              try {
                const placeExists = await this.db.prepare(
                  `SELECT id FROM locations WHERE id = ?`
                ).bind(placeId).first();
                if (!placeExists) {
                  // 如果 place_id 不存在，設為 NULL
                  placeId = null;
                } else {
                  // 如果存在，更新統計
                  if (this.locationService) {
                    await this.locationService.incrementItineraryUseCount(placeId);
                  }
                }
              } catch (error) {
                console.warn('[ItineraryService] Failed to verify place_id:', error);
                placeId = null;
              }
            }

            await this.db.prepare(
              `INSERT INTO itinerary_items (
                id, day_id, place_id, place_name, start_time, duration, order_index, created_at, updated_at, status, notes
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              itemId,
              dayId,
              placeId,
              item.place?.name || '未知地點',
              item.startTime || '09:00',
              item.duration || 60,
              itemIndex,
              now,
              now,  // updated_at
              'planned',  // status
              item.notes || null  // notes
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
   * @param {string} userId - 用戶 ID
   * @param {string} itineraryId - 行程 ID
   * @returns {Promise<void>}
   */
  async deleteItinerary(userId, itineraryId) {
    try {
      // 獲取所有天數 ID
      const days = await this.db.prepare(
        `SELECT id FROM itinerary_days WHERE itinerary_id = ?`
      ).bind(itineraryId).all();

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
   * @param {string} userId - 用戶 ID
   * @param {string} itineraryId - 行程 ID
   * @param {number} dayIndex - 要優化的天數索引（可選）
   * @returns {Promise<object>} 優化後的行程物件
   */
  async optimizeItinerary(userId, itineraryId, dayIndex = null) {
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
          const reorderedItems = optimizedData.itinerary.map((optItem) => {
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
          }).filter(Boolean);

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

