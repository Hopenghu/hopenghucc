/**
 * AI 問問題服務 - 管理對話狀態和引導使用者提供固定資訊
 */
export class AIQuestioningService {
  constructor(db) {
    if (!db) {
      throw new Error("Database connection is required for AIQuestioningService.");
    }
    this.db = db;
  }

  /**
   * 獲取或建立對話狀態
   */
  async getOrCreateConversationState(sessionId, userId, conversationType = 'general') {
    try {
      // 嘗試獲取現有狀態
      let state = await this.db.prepare(
        `SELECT * FROM ai_conversation_states 
         WHERE session_id = ? AND (user_id = ? OR (user_id IS NULL AND ? IS NULL))
         ORDER BY updated_at DESC LIMIT 1`
      ).bind(sessionId, userId || null, userId || null).first();

      if (!state) {
        // 建立新狀態
        const newId = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.db.prepare(
          `INSERT INTO ai_conversation_states 
           (id, session_id, user_id, conversation_type, current_step, context_data, collected_data)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          newId,
          sessionId,
          userId || null,
          conversationType,
          'start',
          JSON.stringify({}),
          JSON.stringify({})
        ).run();

        state = await this.db.prepare(
          'SELECT * FROM ai_conversation_states WHERE id = ?'
        ).bind(newId).first();
      }

      // 解析 JSON 資料
      if (state) {
        state.context_data = state.context_data ? JSON.parse(state.context_data) : {};
        state.collected_data = state.collected_data ? JSON.parse(state.collected_data) : {};
      }

      return state;
    } catch (error) {
      console.error('[AIQuestioningService] Error getting conversation state:', error);
      throw error;
    }
  }

  /**
   * 更新對話狀態
   */
  async updateConversationState(stateId, updates) {
    try {
      const contextData = updates.context_data ? JSON.stringify(updates.context_data) : null;
      const collectedData = updates.collected_data ? JSON.stringify(updates.collected_data) : null;

      await this.db.prepare(
        `UPDATE ai_conversation_states 
         SET current_step = ?,
             context_data = COALESCE(?, context_data),
             collected_data = COALESCE(?, collected_data),
             is_complete = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(
        updates.current_step || null,
        contextData,
        collectedData,
        updates.is_complete || false,
        stateId
      ).run();

      return true;
    } catch (error) {
      console.error('[AIQuestioningService] Error updating conversation state:', error);
      throw error;
    }
  }

  /**
   * 判斷使用者類型
   * @param {string} userId - 使用者 ID
   * @param {string} recentMessage - 最近的訊息（用於從對話中識別使用者類型）
   */
  async determineUserType(userId, recentMessage = null) {
    // 先從對話中識別使用者類型（如果提供了訊息）
    if (recentMessage) {
      const messageLower = recentMessage.toLowerCase();
      // 檢查是否明確說「我是商家」
      if (messageLower.includes('我是商家') || messageLower.includes('我是店家') || 
          messageLower.includes('我是老闆') || messageLower.includes('我是業者')) {
        // 更新使用者表中的標記
        if (userId) {
          try {
            await this.db.prepare(
              `UPDATE users SET user_type = 'merchant', is_merchant = true WHERE id = ?`
            ).bind(userId).run();
          } catch (error) {
            console.error('[AIQuestioningService] Error updating user type:', error);
          }
        }
        return 'merchant';
      }
      // 檢查是否明確說「我是旅客」或「我是遊客」
      if (messageLower.includes('我是旅客') || messageLower.includes('我是遊客') ||
          messageLower.includes('我是觀光客')) {
        return 'traveler';
      }
    }

    if (!userId) {
      return 'traveler'; // 未登入使用者預設為旅客
    }

    try {
      // 檢查使用者是否 claim 了地點（claim 地點 = 商家）
      const claimedLocations = await this.db.prepare(
        `SELECT COUNT(*) as count FROM locations WHERE claimed_by_user_id = ?`
      ).bind(userId).first();

      if (claimedLocations && claimedLocations.count > 0) {
        return 'merchant';
      }

      // 檢查使用者表中的標記
      const user = await this.db.prepare(
        'SELECT user_type, is_merchant FROM users WHERE id = ?'
      ).bind(userId).first();

      if (user) {
        if (user.is_merchant || user.user_type === 'merchant') {
          return 'merchant';
        }
        if (user.user_type === 'local') {
          return 'local';
        }
      }

      return 'traveler';
    } catch (error) {
      console.error('[AIQuestioningService] Error determining user type:', error);
      return 'traveler'; // 預設為旅客
    }
  }

  /**
   * 分析查詢，判斷是否需要問問題
   */
  analyzeQuery(query, userType, state) {
    const queryLower = query.toLowerCase();
    
    // 檢查是否在問問題流程中
    if (state && !state.is_complete) {
      return {
        shouldAsk: true,
        type: state.conversation_type,
        step: state.current_step
      };
    }

    // 檢查是否為首次對話（沒有對話狀態或狀態為空）
    const isFirstConversation = !state || !state.collected_data || Object.keys(state.collected_data).length === 0;
    
    // 檢查使用者是否已經明確回答身份問題
    const hasIdentityInfo = state?.collected_data?.user_identity || 
                            queryLower.includes('居民') || 
                            queryLower.includes('來過') || 
                            queryLower.includes('想來') ||
                            queryLower.includes('我是居民') ||
                            queryLower.includes('我是旅客') ||
                            queryLower.includes('我來過') ||
                            queryLower.includes('我想來');

    // 如果是首次對話且還沒有身份資訊，主動問身份問題
    if (isFirstConversation && !hasIdentityInfo) {
      // 檢查是否已經在回答身份問題
      if (queryLower.includes('居民') || queryLower.includes('來過') || queryLower.includes('想來') ||
          queryLower.includes('我是居民') || queryLower.includes('我是旅客') || 
          queryLower.includes('我來過') || queryLower.includes('我想來')) {
        // 使用者正在回答身份問題，繼續處理
      } else {
        // 首次對話，主動問身份問題
        return {
          shouldAsk: true,
          type: 'identity_guide',
          step: 'ask_identity'
        };
      }
    }

    // 商家相關關鍵字
    const merchantKeywords = ['商家', '店家', '營業', '產品', '價格', '費用', '消費', '服務'];
    const isMerchantQuery = merchantKeywords.some(keyword => queryLower.includes(keyword));

    // 旅客相關關鍵字
    const travelerKeywords = ['回憶', '去過', '造訪', '體驗', '感受', '想再去', '推薦'];
    const isTravelerQuery = travelerKeywords.some(keyword => queryLower.includes(keyword));

    // 距離相關關鍵字
    const distanceKeywords = ['距離', '多遠', '多久', '時間', '怎麼去', '路線'];
    const isDistanceQuery = distanceKeywords.some(keyword => queryLower.includes(keyword));

    // 判斷應該啟動哪種問問題流程
    // 如果是商家，且（有商家相關查詢 或 沒有對話狀態 或 明確說「我是商家」）
    if (userType === 'merchant' && (isMerchantQuery || !state || queryLower.includes('我是商家'))) {
      return {
        shouldAsk: true,
        type: 'merchant_setup',
        step: 'identify_location'
      };
    }

    if (userType === 'traveler' && (isTravelerQuery || !state)) {
      return {
        shouldAsk: true,
        type: 'traveler_memory',
        step: 'identify_location'
      };
    }

    if (isDistanceQuery) {
      return {
        shouldAsk: true,
        type: 'distance_query',
        step: 'identify_locations'
      };
    }

    return {
      shouldAsk: false,
      type: 'general',
      step: null
    };
  }

  /**
   * 生成問問題的提示詞（商家）
   */
  generateMerchantQuestion(state, collectedData) {
    const step = state.current_step;
    const collected = collectedData || {};

    switch (step) {
      case 'start':
      case 'identify_location':
        if (!collected.location_name && !collected.location_id) {
          return {
            question: "請問您要提供資訊的商家名稱是什麼？或者您可以直接告訴我地點名稱。",
            field: 'location_name',
            next_step: 'confirm_location'
          };
        }
        // 繼續到下一個問題
        return this.generateMerchantQuestion({ ...state, current_step: 'confirm_location' }, collected);

      case 'confirm_location':
        if (!collected.location_id) {
          return {
            question: "好的，關於「" + (collected.location_name || '這個地點') + "」，請問這是您的商家嗎？",
            field: 'location_confirmed',
            next_step: 'ask_business_type'
          };
        }
        return this.generateMerchantQuestion({ ...state, current_step: 'ask_business_type' }, collected);

      case 'ask_business_type':
        if (!collected.business_type) {
          return {
            question: "請問您的商家類型是什麼？（例如：餐廳、住宿、景點、商店等）",
            field: 'business_type',
            next_step: 'ask_opening_hours'
          };
        }
        return this.generateMerchantQuestion({ ...state, current_step: 'ask_opening_hours' }, collected);

      case 'ask_opening_hours':
        if (!collected.opening_hours) {
          return {
            question: "請問您的營業時間是？（例如：週一至週五 09:00-18:00，週六 10:00-20:00）",
            field: 'opening_hours',
            next_step: 'ask_products'
          };
        }
        return this.generateMerchantQuestion({ ...state, current_step: 'ask_products' }, collected);

      case 'ask_products':
        if (!collected.products || collected.products.length === 0) {
          return {
            question: "請問您提供什麼產品或服務？請告訴我產品名稱。",
            field: 'product_name',
            next_step: 'ask_product_price'
          };
        }
        // 檢查是否還有產品需要詢問
        const lastProduct = collected.products[collected.products.length - 1];
        if (!lastProduct.price && !lastProduct.price_confirmed) {
          return this.generateMerchantQuestion({ ...state, current_step: 'ask_product_price' }, collected);
        }
        if (!lastProduct.duration_minutes && !lastProduct.duration_confirmed) {
          return this.generateMerchantQuestion({ ...state, current_step: 'ask_product_duration' }, collected);
        }
        // 檢查是否還有更多產品
        if (collected.more_products === false) {
          return {
            question: null,
            field: null,
            next_step: 'complete'
          };
        }
        return {
          question: "還有其他產品或服務要提供嗎？如果沒有，請說「完成」。",
          field: 'more_products',
          next_step: 'ask_products' // 如果還有，繼續詢問
        };

      case 'ask_product_price':
        const currentProduct = collected.products?.[collected.products.length - 1];
        if (!currentProduct) {
          return this.generateMerchantQuestion({ ...state, current_step: 'ask_products' }, collected);
        }
        return {
          question: `請問「${currentProduct.name || '這個產品'}」的價格是多少？（如果免費或價格面議，請直接說明）`,
          field: 'product_price',
          next_step: 'ask_product_duration'
        };

      case 'ask_product_duration':
        const currentProduct2 = collected.products?.[collected.products.length - 1];
        if (!currentProduct2) {
          return this.generateMerchantQuestion({ ...state, current_step: 'ask_products' }, collected);
        }
        // 更新產品的價格（如果已提取）
        if (collected.price !== undefined && currentProduct2.price === null) {
          currentProduct2.price = collected.price;
        }
        return {
          question: `請問「${currentProduct2.name || '這個產品'}」的消費時間大約需要多久？（例如：30 分鐘、1 小時，如果不需要時間請說「不需要」）`,
          field: 'product_duration',
          next_step: 'ask_products' // 回到詢問更多產品
        };

      case 'complete':
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      default:
        return {
          question: "感謝您提供資訊！還有其他需要補充的嗎？",
          field: null,
          next_step: 'complete'
        };
    }
  }

  /**
   * 生成身份引導問題
   */
  generateIdentityQuestion(state, collectedData) {
    const step = state.current_step;
    const collected = collectedData || {};

    switch (step) {
      case 'start':
      case 'ask_identity':
        if (!collected.user_identity) {
          return {
            question: "為了更好地協助您，請問您是：\n1. 澎湖生活居民\n2. 來過澎湖的旅客\n3. 想來澎湖的旅客\n\n請直接告訴我您的身份，例如：我是居民、我來過、我想來。",
            field: 'user_identity',
            next_step: 'collect_identity_info'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'collect_identity_info' }, collected);

      case 'collect_identity_info':
        // 根據身份繼續問問題
        const identity = collected.user_identity;
        if (identity === 'local' || identity === '居民') {
          return {
            question: "太好了！你住在澎湖哪個區域呢？（例如：馬公、湖西、白沙、西嶼、望安、七美）",
            field: 'region',
            next_step: 'ask_local_interests'
          };
        } else if (identity === 'visited_traveler' || identity === '來過' || identity === '我來過') {
          return {
            question: "你什麼時候來過澎湖呢？（例如：2024年7月）",
            field: 'visit_period',
            next_step: 'ask_visited_places'
          };
        } else if (identity === 'planning_traveler' || identity === '想來' || identity === '我想來') {
          return {
            question: "你計劃什麼時候來澎湖呢？（例如：2025年夏天）",
            field: 'planned_period',
            next_step: 'ask_travel_interests'
          };
        }
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      case 'ask_local_interests':
        if (!collected.interests) {
          return {
            question: "你最常去哪些地方？或者對什麼類型的景點感興趣？",
            field: 'interests',
            next_step: 'ask_local_knowledge'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'ask_local_knowledge' }, collected);

      case 'ask_local_knowledge':
        if (!collected.local_knowledge) {
          return {
            question: "你對澎湖哪個區域最熟悉？有什麼特別推薦的地方或故事想分享嗎？",
            field: 'local_knowledge',
            next_step: 'ask_favorite_places'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'ask_favorite_places' }, collected);

      case 'ask_favorite_places':
        if (!collected.favorite_places) {
          return {
            question: "你最喜歡澎湖的哪些地方？為什麼？有什麼特別的回憶嗎？",
            field: 'favorite_places',
            next_step: 'complete'
          };
        }
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      case 'ask_visited_places':
        if (!collected.visited_places) {
          return {
            question: "你去過哪些景點？最喜歡哪個地方？",
            field: 'visited_places',
            next_step: 'ask_visited_experiences'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'ask_visited_experiences' }, collected);

      case 'ask_visited_experiences':
        if (!collected.visited_experiences) {
          return {
            question: "在那些地方有什麼特別的體驗或回憶嗎？可以分享一下嗎？",
            field: 'visited_experiences',
            next_step: 'ask_want_to_revisit'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'ask_want_to_revisit' }, collected);

      case 'ask_want_to_revisit':
        if (collected.want_to_revisit === undefined) {
          return {
            question: "你還想再去澎湖嗎？如果會，最想再去哪裡？",
            field: 'want_to_revisit',
            next_step: 'complete'
          };
        }
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      case 'ask_travel_interests':
        if (!collected.travel_interests) {
          return {
            question: "你對什麼類型的景點感興趣呢？（例如：自然景觀、文化古蹟、美食、住宿）",
            field: 'travel_interests',
            next_step: 'ask_travel_plans'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'ask_travel_plans' }, collected);

      case 'ask_travel_plans':
        if (!collected.travel_plans) {
          return {
            question: "你有特別想了解或想去的地方嗎？或者有什麼特別想體驗的活動？",
            field: 'travel_plans',
            next_step: 'ask_travel_questions'
          };
        }
        return this.generateIdentityQuestion({ ...state, current_step: 'ask_travel_questions' }, collected);

      case 'ask_travel_questions':
        if (!collected.travel_questions) {
          return {
            question: "關於澎湖，你有什麼特別想知道的嗎？我可以幫你找資訊！",
            field: 'travel_questions',
            next_step: 'complete'
          };
        }
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      case 'complete':
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      default:
        return {
          question: "感謝您！現在我可以更好地協助您了。您有什麼想了解的嗎？",
          field: null,
          next_step: 'complete'
        };
    }
  }

  /**
   * 生成問問題的提示詞（旅客）
   */
  generateTravelerQuestion(state, collectedData) {
    const step = state.current_step;
    const collected = collectedData || {};

    switch (step) {
      case 'start':
      case 'identify_location':
        if (!collected.location_name && !collected.location_id) {
          return {
            question: "您想分享哪個地點的回憶？請告訴我地點名稱。",
            field: 'location_name',
            next_step: 'ask_memory'
          };
        }
        return this.generateTravelerQuestion({ ...state, current_step: 'ask_memory' }, collected);

      case 'ask_memory':
        if (!collected.memory_content) {
          return {
            question: "請分享您在「" + (collected.location_name || '這個地點') + "」的回憶或體驗。",
            field: 'memory_content',
            next_step: 'ask_companions'
          };
        }
        return this.generateTravelerQuestion({ ...state, current_step: 'ask_companions' }, collected);

      case 'ask_companions':
        if (!collected.companions && !collected.companions_confirmed) {
          return {
            question: "您當時和誰一起去的？（例如：家人、朋友、獨自一人）",
            field: 'companions',
            next_step: 'ask_visited_date'
          };
        }
        return this.generateTravelerQuestion({ ...state, current_step: 'ask_visited_date' }, collected);

      case 'ask_visited_date':
        if (!collected.visited_date && !collected.visited_date_confirmed) {
          return {
            question: "您是什麼時候去的？（例如：2024 年 7 月）",
            field: 'visited_date',
            next_step: 'ask_revisit'
          };
        }
        return this.generateTravelerQuestion({ ...state, current_step: 'ask_revisit' }, collected);

      case 'ask_revisit':
        if (collected.want_to_revisit === undefined) {
          return {
            question: "您還想再去「" + (collected.location_name || '這個地點') + "」嗎？",
            field: 'want_to_revisit',
            next_step: 'ask_revisit_reason'
          };
        }
        return this.generateTravelerQuestion({ ...state, current_step: 'ask_revisit_reason' }, collected);

      case 'ask_revisit_reason':
        if (collected.want_to_revisit && !collected.revisit_reason) {
          return {
            question: "為什麼想再去呢？",
            field: 'revisit_reason',
            next_step: 'complete'
          };
        }
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      case 'complete':
        return {
          question: null,
          field: null,
          next_step: 'complete'
        };

      default:
        return {
          question: "感謝您分享回憶！還有其他地點想分享嗎？",
          field: null,
          next_step: 'complete'
        };
    }
  }

  /**
   * 從使用者回答中提取結構化資訊
   */
  extractStructuredInfo(userMessage, field, conversationType) {
    const message = userMessage.trim();
    const extracted = {};

    switch (field) {
      case 'product_price':
        // 提取價格（數字）
        const priceMatch = message.match(/(\d+)\s*(元|塊|NT|NTD|TWD)/i) || message.match(/(\d+)/);
        if (priceMatch) {
          extracted.price = parseInt(priceMatch[1]) * 100; // 轉換為分
          extracted.price_confirmed = true;
        } else if (message.includes('免費') || message.includes('不用錢')) {
          extracted.price = 0;
          extracted.price_confirmed = true;
        } else if (message.includes('面議') || message.includes('詢問')) {
          extracted.price = null; // 價格面議
          extracted.price_confirmed = true;
        }
        break;

      case 'product_duration':
      case 'duration_minutes':
        // 提取時間（分鐘）
        const durationMatch = message.match(/(\d+)\s*(分鐘|分|小時|時|hr|min)/i);
        if (durationMatch) {
          const value = parseInt(durationMatch[1]);
          if (message.includes('小時') || message.includes('時') || message.includes('hr')) {
            extracted.duration_minutes = value * 60;
          } else {
            extracted.duration_minutes = value;
          }
          extracted.duration_confirmed = true;
        }
        break;

      case 'opening_hours':
        // 提取營業時間（簡單版本，可以改進）
        extracted.opening_hours = message; // 先儲存原始文字
        // 這裡可以加入更複雜的解析邏輯，轉換為 JSON 格式
        break;

      case 'visited_date':
        // 提取日期
        const dateMatch = message.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/i) || 
                         message.match(/(\d{4})-(\d{1,2})/);
        if (dateMatch) {
          extracted.visited_date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-01`;
          extracted.visited_date_confirmed = true;
        } else {
          // 如果無法解析，儲存原始文字
          extracted.visited_date = message;
        }
        break;

      case 'want_to_revisit':
        // 提取是否想再去
        if (message.includes('想') || message.includes('會') || message.includes('要') || 
            message.includes('是') || message.toLowerCase().includes('yes')) {
          extracted.want_to_revisit = true;
        } else if (message.includes('不想') || message.includes('不會') || message.includes('不要') ||
                   message.includes('不') || message.toLowerCase().includes('no')) {
          extracted.want_to_revisit = false;
        }
        break;

      case 'user_identity':
        // 提取身份
        const messageLower = message.toLowerCase();
        if (messageLower.includes('居民') || messageLower.includes('在地') || messageLower.includes('住在')) {
          extracted.user_identity = 'local';
        } else if (messageLower.includes('來過') || messageLower.includes('去過') || messageLower.includes('曾經')) {
          extracted.user_identity = 'visited_traveler';
        } else if (messageLower.includes('想來') || messageLower.includes('計劃') || messageLower.includes('打算')) {
          extracted.user_identity = 'planning_traveler';
        } else if (messageLower.includes('旅客') || messageLower.includes('遊客')) {
          extracted.user_identity = 'traveler'; // 需要進一步確認
        }
        break;

      case 'location_confirmed':
        // 確認地點
        if (message.includes('是') || message.includes('對') || message.includes('沒錯') ||
            message.toLowerCase().includes('yes')) {
          extracted.location_confirmed = true;
        } else {
          extracted.location_confirmed = false;
        }
        break;

      case 'more_products':
        // 是否還有更多產品
        if (message.includes('完成') || message.includes('沒有') || message.includes('沒了') ||
            message.includes('結束')) {
          extracted.more_products = false;
        } else {
          extracted.more_products = true;
        }
        break;
    }

    return extracted;
  }

  /**
   * 儲存收集到的固定資訊
   */
  async saveFixedInformation(informationType, data, locationId, userId, conversationId) {
    try {
      const informationKey = data.key || 'default';
      const informationValue = JSON.stringify(data.value || data);

      await this.db.prepare(
        `INSERT INTO fixed_information 
         (information_type, location_id, user_id, information_key, information_value, source_conversation_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        informationType,
        locationId || null,
        userId || null,
        informationKey,
        informationValue,
        conversationId || null
      ).run();

      return true;
    } catch (error) {
      console.error('[AIQuestioningService] Error saving fixed information:', error);
      return false;
    }
  }

  /**
   * 儲存商家產品資訊
   */
  async saveMerchantProduct(locationId, productData, userId) {
    try {
      await this.db.prepare(
        `INSERT INTO merchant_products 
         (location_id, product_name, product_description, price, duration_minutes, category, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        locationId,
        productData.name,
        productData.description || null,
        productData.price,
        productData.duration_minutes,
        productData.category || null,
        userId || null
      ).run();

      return true;
    } catch (error) {
      console.error('[AIQuestioningService] Error saving merchant product:', error);
      return false;
    }
  }

  /**
   * 儲存旅遊回憶
   */
  async saveTravelMemory(userId, locationId, memoryData) {
    try {
      const companionsJson = memoryData.companions ? JSON.stringify(memoryData.companions) : null;

      await this.db.prepare(
        `INSERT INTO travel_memories 
         (user_id, location_id, memory_content, visited_date, companions, want_to_revisit, revisit_reason, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        userId,
        locationId,
        memoryData.content,
        memoryData.visited_date || null,
        companionsJson,
        memoryData.want_to_revisit || false,
        memoryData.revisit_reason || null,
        memoryData.rating || null
      ).run();

      return true;
    } catch (error) {
      console.error('[AIQuestioningService] Error saving travel memory:', error);
      return false;
    }
  }
}
