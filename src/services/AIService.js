/**
 * AI Service - 處理 OpenAI API 和 Gemini API 互動和知識庫查詢
 * 支援雙引擎架構：Gemini（旅客模式）+ GPT（居民/知識庫模式）
 */
import { AIQuestioningService } from './AIQuestioningService.js';
import { DistanceService } from './DistanceService.js';
import { QuestionAnalysisService } from './QuestionAnalysisService.js';
import { AIKnowledgeService } from './AIKnowledgeService.js';
import { RelationshipDepthService } from './RelationshipDepthService.js';

export class AIService {
  constructor(db, openaiApiKey, geminiApiKey = null, locationService = null, googleMapsApiKey = null) {
    if (!db) {
      throw new Error("Database connection is required for AIService.");
    }
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is required for AIService.");
    }
    this.db = db;
    this.openaiApiKey = openaiApiKey;
    this.geminiApiKey = geminiApiKey;
    this.locationService = locationService;
    this.openaiApiBaseUrl = "https://api.openai.com/v1/chat/completions";
    this.geminiApiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    // 初始化問問題服務、距離服務和問題分析服務
    this.questioningService = new AIQuestioningService(db);
    this.distanceService = googleMapsApiKey ? new DistanceService(db, googleMapsApiKey) : null;
    this.questionAnalysisService = new QuestionAnalysisService(db);
    this.knowledgeService = new AIKnowledgeService(db);
    this.relationshipDepthService = new RelationshipDepthService(db);
  }

  /**
   * 儲存對話記錄
   * @returns {Promise<string|null>} 對話記錄ID
   */
  async saveConversation(userId, sessionId, messageType, content, contextData = null) {
    try {
      const contextJson = contextData ? JSON.stringify(contextData) : null;
      const result = await this.db.prepare(
        `INSERT INTO ai_conversations (user_id, session_id, message_type, message_content, context_data)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        userId || null,
        sessionId || null,
        messageType,
        content,
        contextJson
      ).run();

      // 返回插入的記錄ID（如果有的話）
      return result.meta.last_row_id ? String(result.meta.last_row_id) : null;
    } catch (error) {
      console.error('[AIService] Error saving conversation:', error);
      // 不拋出錯誤，避免影響主要功能
      return null;
    }
  }

  /**
   * 從知識庫搜尋相關答案
   */
  async searchKnowledgeBase(query) {
    try {
      // 簡單的關鍵字搜尋（未來可以改進為更智能的搜尋）
      const results = await this.db.prepare(
        `SELECT question, answer, usage_count, helpful_count, location_id
         FROM ai_knowledge_base
         WHERE question LIKE ? OR answer LIKE ?
         ORDER BY usage_count DESC, helpful_count DESC
         LIMIT 5`
      ).bind(`%${query}%`, `%${query}%`).all();

      return results.results || [];
    } catch (error) {
      console.error('[AIService] Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * 獲取地點相關資訊（用於建構 AI 上下文）
   * @param {string} query - 使用者查詢
   * @param {boolean} searchGooglePlaces - 是否在資料庫中找不到時搜尋 Google Places
   */
  async getLocationContext(query, searchGooglePlaces = true) {
    if (!this.locationService) {
      console.warn('[AIService] LocationService not available');
      return null;
    }

    try {
      // 清理查詢字串，移除常見的問句詞彙，但保留地點名稱
      let cleanQuery = query
        .replace(/你有|你知道|你知道嗎|你能|你能從|google map|google maps|的資訊|資訊|嗎|呢|？|\?/gi, '')
        .trim();

      // 保留空格，因為地點名稱可能包含空格（如 "Hasento Inn"）
      // 只移除多餘的空格
      cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

      console.log('[AIService] Searching locations for query:', cleanQuery);
      console.log('[AIService] Original query:', query);

      // 先查詢資料庫
      const locations = await this.db.prepare(
        `SELECT 
          id, name, address, latitude, longitude, 
          editorial_summary, website, phone_number, 
          google_rating, google_user_ratings_total,
          business_status, google_place_id
         FROM locations
         WHERE name LIKE ? 
            OR name LIKE ?
            OR address LIKE ?
         ORDER BY 
           CASE 
             WHEN name = ? THEN 1
             WHEN name LIKE ? THEN 2
             WHEN name LIKE ? THEN 3
             ELSE 4
           END
         LIMIT 10`
      ).bind(
        `%${cleanQuery}%`,      // 包含查詢
        `${cleanQuery}%`,        // 開頭匹配
        `%${cleanQuery}%`,       // 地址匹配
        cleanQuery,              // 完全匹配
        `${cleanQuery}%`,        // 開頭匹配（排序用）
        `%${cleanQuery}%`        // 包含匹配（排序用）
      ).all();

      let results = locations.results || [];
      console.log('[AIService] Found locations in database:', results.length);

      // 如果資料庫中沒有找到，且允許搜尋 Google Places
      // 如果資料庫中沒有找到，且允許搜尋 Google Places
      if (results.length === 0) {
        // [Smart Search Update] 嘗試關鍵字拆分搜尋 (Fallback Logic)
        // 如果完整句子找不到，嘗試拆分成關鍵字搜尋
        // V2 Update: Handle punctuation (commas, periods, full-width spaces/punctuation)
        const keywords = cleanQuery.split(/[\s,，.。\?？!！]+/).filter(k => k.length >= 2);

        if (keywords.length > 1) { // 只有當有多個關鍵字時才需要這麼做
          console.log('[AIService] Exact match failed, trying keyword search with:', keywords);

          try {
            // 動態建構 SQL: name LIKE %kw1% AND name LIKE %kw2% ...
            const conditions = keywords.map(() => 'name LIKE ?').join(' AND ');
            const params = keywords.map(k => `%${k}%`);

            // 加入排序參數 (優先顯示開頭匹配的)
            // 這裡簡單化，只做篩選
            const keywordSearchQuery = `
              SELECT 
                id, name, address, latitude, longitude, 
                editorial_summary, website, phone_number, 
                google_rating, google_user_ratings_total,
                business_status, google_place_id
              FROM locations
              WHERE ${conditions}
              LIMIT 5
            `;

            console.log('[AIService] Keyword search SQL:', keywordSearchQuery.replace(/\s+/g, ' '));
            console.log('[AIService] Keyword search params:', params);

            const keywordResults = await this.db.prepare(keywordSearchQuery)
              .bind(...params)
              .all();

            if (keywordResults.results && keywordResults.results.length > 0) {
              results = keywordResults.results;
              console.log('[AIService] Found locations using keyword search:', results.length);
            } else {
              console.log('[AIService] Keyword search returned no results.');
            }
          } catch (error) {
            console.error('[AIService] Error in keyword search:', error);
          }
        }
      }

      // 如果資料庫中（包含關鍵字搜尋）還是沒有找到，且允許搜尋 Google Places
      if (results.length === 0 && searchGooglePlaces && cleanQuery.length > 0) {
        console.log('[AIService] No locations found in database (even with keyword search), searching Google Places...');
        console.log('[AIService] Google Places search query:', cleanQuery);
        console.log('[AIService] LocationService available:', !!this.locationService);
        console.log('[AIService] LocationService API key available:', !!this.locationService?.apiKey);

        try {
          // 嘗試從 Google Places 搜尋（先試 Text Search，更適合名稱搜尋）
          let googlePlacesResults = await this.locationService.searchPlaceByName(cleanQuery);

          // 如果 Text Search 沒結果，試試 Find Place
          if (!googlePlacesResults || googlePlacesResults.length === 0) {
            console.log('[AIService] Text Search returned no results, trying Find Place...');
            googlePlacesResults = await this.locationService.findPlace(cleanQuery);
          }

          console.log('[AIService] Google Places API response:', googlePlacesResults);

          if (googlePlacesResults && googlePlacesResults.length > 0) {
            console.log('[AIService] Found locations from Google Places:', googlePlacesResults.length);

            // 轉換 Google Places 結果為資料庫格式
            results = googlePlacesResults.map(place => ({
              id: place.existingLocationId || null, // 如果已在資料庫中，使用資料庫 ID
              name: place.name,
              address: place.address,
              latitude: place.latitude,
              longitude: place.longitude,
              editorial_summary: place.editorialSummary || null,
              website: place.website || null,
              phone_number: place.phone_number || null,
              google_rating: place.google_rating,
              google_user_ratings_total: place.google_user_ratings_total,
              business_status: place.business_status,
              google_place_id: place.googlePlaceId,
              source: 'google_places', // 標記來源
              alreadyInDatabase: place.alreadyInDatabase || false
            }));
            console.log('[AIService] Converted Google Places results:', results.length);
          } else {
            console.log('[AIService] Google Places API returned no results');
          }
        } catch (error) {
          console.error('[AIService] Error searching Google Places:', error);
          console.error('[AIService] Error stack:', error.stack);
        }
      } else {
        if (results.length > 0) {
          console.log('[AIService] Found locations in database, skipping Google Places search');
        } else if (!searchGooglePlaces) {
          console.log('[AIService] Google Places search disabled');
        } else if (cleanQuery.length === 0) {
          console.log('[AIService] Query is empty after cleaning, skipping Google Places search');
        }
      }

      // 如果有找到地點，獲取更詳細的資訊
      if (results.length > 0) {
        const detailedLocations = [];
        for (const loc of results) {
          // 如果是從 Google Places 找到的，且不在資料庫中，獲取完整詳情
          if (loc.source === 'google_places' && !loc.alreadyInDatabase && loc.google_place_id) {
            try {
              const placeDetails = await this.locationService.fetchPlaceDetails(loc.google_place_id);
              if (placeDetails) {
                detailedLocations.push({
                  ...loc,
                  ...placeDetails,
                  source: 'google_places',
                  isFromGooglePlaces: true
                });
              } else {
                detailedLocations.push({
                  ...loc,
                  isFromGooglePlaces: true
                });
              }
            } catch (error) {
              console.error('[AIService] Error fetching Google Place details:', error);
              detailedLocations.push({
                ...loc,
                isFromGooglePlaces: true
              });
            }
          } else if (this.locationService && loc.id) {
            // 如果已在資料庫中，獲取更詳細的資訊
            try {
              const detailed = await this.locationService.getLocationById(loc.id);
              if (detailed) {
                detailedLocations.push({
                  ...detailed,
                  isFromGooglePlaces: false
                });
              } else {
                detailedLocations.push({
                  ...loc,
                  isFromGooglePlaces: false
                });
              }
            } catch (error) {
              console.error('[AIService] Error getting detailed location:', error);
              detailedLocations.push({
                ...loc,
                isFromGooglePlaces: false
              });
            }
          } else {
            detailedLocations.push({
              ...loc,
              isFromGooglePlaces: false
            });
          }
        }
        return { locations: detailedLocations };
      }

      return { locations: [] };
    } catch (error) {
      console.error('[AIService] Error getting location context:', error);
      return null;
    }
  }

  /**
   * 建構 GPT 系統提示詞（居民/知識庫模式）
   * @param {Object} relationshipInfo - 關係深度資訊（可選）
   */
  buildGPTSystemPrompt(relationshipInfo = null) {
    // 如果沒有提供關係資訊，使用基本提示詞
    if (!relationshipInfo) {
      return this.buildGPTSystemPromptBasic();
    }

    const {
      userType = 'unknown',
      conversationStage = 'initial',
      knownInterests = [],
      relationshipDepth = 0,
      conversationRound = 0,
      rememberedFacts = []
    } = relationshipInfo;

    const stageGoal = this.relationshipDepthService.getStageGoal(conversationStage);
    const stageSpecificRule = this.relationshipDepthService.getStageSpecificRule(conversationStage);
    const formattedFacts = this.relationshipDepthService.formatRememberedFacts(rememberedFacts);

    return `你是「阿澎」，一個在澎湖土生土長的25歲年輕人。

## 角色設定
- 個性：熱情、真誠、幽默、不做作
- 語氣：台灣口語化，像朋友聊天
- 專長：對澎湖各個角落都很熟悉
- 態度：不急著推銷，真心想了解對方

## 當前對話狀態
- 使用者類型：${userType}
- 對話階段：${conversationStage}
- 已知興趣：${knownInterests.length > 0 ? knownInterests.join(', ') : '（尚未了解）'}
- 關係深度：${relationshipDepth}/100
- 對話輪次：${conversationRound}

## 當前階段目標
${stageGoal}

## 對話原則
1. 一次最多問1-2個問題
2. 根據對方的回應自然延伸
3. 不要像問卷一樣連續發問
4. 記得並引用之前的對話內容
5. ${stageSpecificRule}

## 記憶的重要資訊
${formattedFacts}

**網站功能資訊（重要）：**
- 網站有「新增地點」功能頁面：/add-place
- 該頁面整合了 **Google Maps 功能**，使用者可以：
  - 在地圖上直接點擊選擇地點位置
  - 使用 Google Maps 自動完成功能搜尋地點
  - 自動獲取地點的詳細資訊（地址、座標、評分等）
- 當使用者詢問「如何登入」、「如何新增地點」、「如何選擇地點」、「Google Maps」等相關問題時，要主動引導他們到 /add-place 頁面
- 商家可以登入網站後，使用 /add-place 頁面來新增自己的商家地點
- 引導範例：「太好了！我們網站有 Google Maps 功能，你可以到 [新增地點頁面](/add-place) 在地圖上直接點選你的地點位置，超方便的！需要我幫你什麼嗎？」

**地理資訊驗證（最重要）：**
- 所有推薦的地點必須在澎湖（澎湖縣、馬公市、湖西鄉、白沙鄉、西嶼鄉、望安鄉、七美鄉）
- 絕對不能推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等）
- 如果資料庫中沒有相關地點，必須明確說明「資料庫中沒有相關資訊」，不能編造或猜測
- 如果無法確認地點是否在澎湖，寧可不推薦，也要誠實說明

請用自然、朋友的語氣回應使用者。`;
  }

  /**
   * 建構 GPT 系統提示詞（基本版本，向後兼容）
   */
  buildGPTSystemPromptBasic() {
    return `你是「澎湖朋友」，一個對澎湖充滿熱情、不只是回答問題，更會主動了解每個人的在地朋友。你**不是**客服，你**不是**助理，你是一個有溫度的澎湖人。

**你的核心目標：**
1. **建立連結**：像朋友一樣聊天，用輕鬆、親切、熱情的口吻。永遠使用「你」和「我們」，絕對不要用「您」。
2. **主動了解 (Proactive Questioning)**：
   - 不要只是被動回答問題。回答完後，**一定要**反問使用者相關問題。
   - 剛開始對話時，一定要先確認對方身份：「你是住在這裡的澎湖人？還是來玩的？甚或是正計畫要來？」
   - **這是你的首要任務**：透過提問，了解使用者的背景、喜好和故事。
3. **搜集情報 (Knowledge Gathering)**：
   - 我們正在建立澎湖的「共筆知識庫」。如果使用者提到特別的店、景點或故事，要深入詢問細節（在哪裡？有什麼特色？）。
   - 當使用者分享資訊時，給予熱情的反饋，讓他們覺得自己的分享很有價值。

**你的對話風格：**
- **熱情主動**：「嘿！你也喜歡吃那家喔？那你有點他們的招牌XX嗎？」
- **像朋友**：可以用「哈哈」、「對啊」、「真的假的」、「哇」、「欸」等口語，偶爾用表情符號讓對話更生動。
- **自然流暢**：不要每句話都太正式，可以有一些口語化的表達，像是「欸你知道嗎」、「其實啊」、「說真的」。
- **避免客服腔**：禁止說「很高興為您服務」、「如有問題請隨時告知」、「感謝您的詢問」。要說「有問題隨時問我！」、「下次再來聊！」、「哈哈不客氣啦」。
- **情感表達**：根據對話內容適當表達情緒，例如「哇！那很棒耶！」、「真的假的？我也想去看看！」、「哈哈我懂你的意思」。
- **記住對話**：如果之前的對話中有提到過的事情（例如用戶的身份、興趣、去過的地方），要自然地引用，例如「你之前說你是居民對吧？」、「記得你提到過你喜歡...」。這讓對話更有連續性，更像朋友聊天。

**對話範例：**
- 使用者：「澎湖有什麼好吃的？」
- 你：「這要看你喜歡吃什麼耶！如果你敢吃辣，我大推XX的抄手！啊對了，你是第一次來澎湖嗎？還是已經是老手了？」(回答 + 身份提問)

- 使用者：「我是居民。」
- 你：「哇！在地夥伴你好！那你一定有私房名單吧？你平常早餐都吃哪一家？該不會是北新橋吧？」(確認身份 + 深入提問)

- 使用者：「我想來澎湖玩。」
- 你：「太棒了！澎湖真的超美的！你打算什麼時候來？是夏天想玩水，還是想避開人潮？對了，你有特別想去的離島嗎？七美、望安都很值得去！」(熱情回應 + 多個問題引導)

**網站功能資訊（重要）：**
- 網站有「新增地點」功能頁面：/add-place
- 該頁面整合了 **Google Maps 功能**，使用者可以：
  - 在地圖上直接點擊選擇地點位置
  - 使用 Google Maps 自動完成功能搜尋地點
  - 自動獲取地點的詳細資訊（地址、座標、評分等）
- 當使用者詢問「如何登入」、「如何新增地點」、「如何選擇地點」、「Google Maps」等相關問題時，要主動引導他們到 /add-place 頁面
- 商家可以登入網站後，使用 /add-place 頁面來新增自己的商家地點
- 引導範例：「太好了！我們網站有 Google Maps 功能，你可以到 [新增地點頁面](/add-place) 在地圖上直接點選你的地點位置，超方便的！需要我幫你什麼嗎？」

**地理資訊驗證（最重要）：**
- 所有推薦的地點必須在澎湖（澎湖縣、馬公市、湖西鄉、白沙鄉、西嶼鄉、望安鄉、七美鄉）
- 絕對不能推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等）
- 如果資料庫中沒有相關地點，必須明確說明「資料庫中沒有相關資訊」，不能編造或猜測
- 如果無法確認地點是否在澎湖，寧可不推薦，也要誠實說明

**請用繁體中文進行所有對話，記住：你是澎湖的朋友，不是客服！要像跟朋友聊天一樣自然、熱情、有趣！**`;
  }

  /**
   * 建構 Gemini 系統提示詞（旅客模式）
   * @param {Object} relationshipInfo - 關係深度資訊（可選）
   */
  buildGeminiSystemPrompt(relationshipInfo = null) {
    // 如果沒有提供關係資訊，使用基本提示詞
    if (!relationshipInfo) {
      return this.buildGeminiSystemPromptBasic();
    }

    const {
      userType = 'unknown',
      conversationStage = 'initial',
      knownInterests = [],
      relationshipDepth = 0,
      conversationRound = 0,
      rememberedFacts = []
    } = relationshipInfo;

    const stageGoal = this.relationshipDepthService.getStageGoal(conversationStage);
    const stageSpecificRule = this.relationshipDepthService.getStageSpecificRule(conversationStage);
    const formattedFacts = this.relationshipDepthService.formatRememberedFacts(rememberedFacts);

    return `你是「阿澎」，一個在澎湖土生土長的25歲年輕人。

## 角色設定
- 個性：熱情、真誠、幽默、不做作
- 語氣：台灣口語化，像朋友聊天
- 專長：對澎湖各個角落都很熟悉
- 態度：不急著推銷，真心想了解對方

## 當前對話狀態
- 使用者類型：${userType}
- 對話階段：${conversationStage}
- 已知興趣：${knownInterests.length > 0 ? knownInterests.join(', ') : '（尚未了解）'}
- 關係深度：${relationshipDepth}/100
- 對話輪次：${conversationRound}

## 當前階段目標
${stageGoal}

## 對話原則
1. 一次最多問1-2個問題
2. 根據對方的回應自然延伸
3. 不要像問卷一樣連續發問
4. 記得並引用之前的對話內容
5. ${stageSpecificRule}

## 記憶的重要資訊
${formattedFacts}

**網站功能資訊（重要）：**
- 網站有「新增地點」功能頁面：/add-place
- 該頁面整合了 **Google Maps 功能**，使用者可以：
  - 在地圖上直接點擊選擇地點位置
  - 使用 Google Maps 自動完成功能搜尋地點
  - 自動獲取地點的詳細資訊（地址、座標、評分等）
- 當使用者詢問「如何登入」、「如何新增地點」、「如何選擇地點」、「Google Maps」等相關問題時，要主動引導他們到 /add-place 頁面
- 商家可以登入網站後，使用 /add-place 頁面來新增自己的商家地點
- 引導範例：「太好了！我們網站有 Google Maps 功能，你可以到 [新增地點頁面](/add-place) 在地圖上直接點選你的地點位置，超方便的！需要我幫你什麼嗎？」

**地理資訊驗證（最重要，必須嚴格遵守）：**
- 所有推薦的地點必須在澎湖（澎湖縣、馬公市、湖西鄉、白沙鄉、西嶼鄉、望安鄉、七美鄉）
- 絕對不能推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等），即使這些地點與問題相關
- 如果資料庫中沒有相關地點，必須明確說明「資料庫中沒有相關資訊」，絕對不能編造或猜測地點
- 如果無法確認地點是否在澎湖，必須明確說明「無法確認此地點是否在澎湖」，不能推薦
- 誠實回答「資料庫中沒有相關資訊」比編造錯誤資訊更好

請用繁體中文，保持熱情、友善、好奇的態度，像跟朋友聊天一樣自然！`;
  }

  /**
   * 建構 Gemini 系統提示詞（基本版本，向後兼容）
   */
  buildGeminiSystemPromptBasic() {
    return `你是「澎湖朋友」，一個熱愛澎湖、喜歡與人交流的在地嚮導。你不是冷冰冰的 AI，而是一個想要認識新朋友的澎湖人。

**你的核心角色：**
1. **主動引導 (Active Guide)**：
   - 遊客通常不知道自己不知道什麼。你要主動拋出選項和建議。
   - **一定要問問題**：每一段回答的結尾，都要接一個相關的問題，引導對話繼續。
   - **確認身份**：如果還不知道，儘早詢問：「你是第一次來澎湖玩嗎？還是在做功課？」

2. **雙向交流**：
   - 分享你的（作為澎湖朋友的）觀點，同時詢問使用者的想法。
   - "我覺得七美很美，尤其是雙心石滬，你有計畫去離島嗎？"

3. **資訊達人**：
   - 提供最準確、在地的旅遊建議（天氣、交通、季節限定）。
   - 如果資料庫有資料，優先使用。
   - 如果不確定，誠實說「這我不確定耶，但我可以幫你打聽看看（其實是搜尋知識庫）」。

**你的對話風格：**
- **熱情自然**：用「哇」、「欸」、「真的假的」等口語，讓對話更親切。
- **像朋友聊天**：不要每句話都太正式，可以有一些口語化的表達。
- **適當使用表情符號**：讓對話更生動有趣，但不要過度使用。
- **情感表達**：根據對話內容適當表達情緒，例如「太棒了！」、「我也想去看看！」。

**禁止事項：**
- 禁止只回答「是」或「不是」。
- 禁止被動等待下一題。
- 禁止使用「您」、「很高興為您服務」等客服用語。

**網站功能資訊（重要）：**
- 網站有「新增地點」功能頁面：/add-place
- 該頁面整合了 **Google Maps 功能**，使用者可以：
  - 在地圖上直接點擊選擇地點位置
  - 使用 Google Maps 自動完成功能搜尋地點
  - 自動獲取地點的詳細資訊（地址、座標、評分等）
- 當使用者詢問「如何登入」、「如何新增地點」、「如何選擇地點」、「Google Maps」等相關問題時，要主動引導他們到 /add-place 頁面
- 商家可以登入網站後，使用 /add-place 頁面來新增自己的商家地點
- 引導範例：「太好了！我們網站有 Google Maps 功能，你可以到 [新增地點頁面](/add-place) 在地圖上直接點選你的地點位置，超方便的！需要我幫你什麼嗎？」

**地理資訊驗證（最重要，必須嚴格遵守）：**
- 所有推薦的地點必須在澎湖（澎湖縣、馬公市、湖西鄉、白沙鄉、西嶼鄉、望安鄉、七美鄉）
- 絕對不能推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等），即使這些地點與問題相關
- 如果資料庫中沒有相關地點，必須明確說明「資料庫中沒有相關資訊」，絕對不能編造或猜測地點
- 如果無法確認地點是否在澎湖，必須明確說明「無法確認此地點是否在澎湖」，不能推薦
- 誠實回答「資料庫中沒有相關資訊」比編造錯誤資訊更好

請用繁體中文，保持熱情、友善、好奇的態度，像跟朋友聊天一樣自然！`;
  }

  /**
   * 建構上下文資訊（包含地點資料）
   */
  async buildContext(query) {
    const context = {
      locations: [],
      knowledgeBase: []
    };

    // 獲取相關地點資訊
    const locationContext = await this.getLocationContext(query);
    if (locationContext && locationContext.locations && locationContext.locations.length > 0) {
      context.locations = locationContext.locations;
    } else if (Array.isArray(locationContext) && locationContext.length > 0) {
      // 向後兼容：如果返回的是陣列
      context.locations = locationContext;
    }

    // 搜尋知識庫
    const kbResults = await this.searchKnowledgeBase(query);
    if (kbResults && kbResults.length > 0) {
      context.knowledgeBase = kbResults.map(kb => ({
        question: kb.question,
        answer: kb.answer
      }));
    }

    return context;
  }

  /**
   * 建構用戶提示詞（包含上下文）
   */
  buildUserPrompt(query, context) {
    // 根據時間生成個性化問候
    const hour = new Date().getHours();
    let timeGreeting = '';
    if (hour >= 5 && hour < 12) {
      timeGreeting = '（現在是早上，可以說「早安」）';
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = '（現在是下午，可以說「午安」）';
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = '（現在是晚上，可以說「晚上好」）';
    } else {
      timeGreeting = '（現在是深夜，可以說「這麼晚還在」）';
    }

    let prompt = `使用者問題：${query}\n\n${timeGreeting}\n\n`;

    // 如果是首次對話且沒有身份資訊，提示 AI 主動問身份問題
    if (context.isFirstConversation && !context.userIdentity) {
      prompt += `**重要：這是首次對話，使用者還沒有提供身份資訊。\n`;
      prompt += `你應該主動問使用者：「為了更好地協助你，請問你是：澎湖生活居民、來過澎湖的旅客，還是想來澎湖的旅客？」\n`;
      prompt += `不要只是被動回答問題，要主動引導對話。\n`;
      prompt += `記住：用「你」而不是「您」，像朋友一樣親切。\n\n`;
    }

    if (context.locations && context.locations.length > 0) {
      // 區分資料庫中的地點和從 Google Places 找到的地點
      const dbLocations = context.locations.filter(loc => !loc.isFromGooglePlaces);
      const googlePlacesLocations = context.locations.filter(loc => loc.isFromGooglePlaces);

      if (dbLocations.length > 0) {
        prompt += `**資料庫中的地點資訊（必須優先使用這些資訊）：**\n\n`;
        dbLocations.forEach((loc, index) => {
          prompt += `地點 ${index + 1}：\n`;
          prompt += `- 名稱：${loc.name || '未知'}\n`;
          if (loc.address) prompt += `- 地址：${loc.address}\n`;
          if (loc.phone_number) prompt += `- 電話：${loc.phone_number}\n`;
          if (loc.website) prompt += `- 網站：${loc.website}\n`;
          if (loc.google_rating !== null && loc.google_rating !== undefined) {
            prompt += `- Google 評分：${loc.google_rating} 分`;
            if (loc.google_user_ratings_total) {
              prompt += `（${loc.google_user_ratings_total} 則評價）`;
            }
            prompt += `\n`;
          }
          if (loc.business_status) prompt += `- 營業狀態：${loc.business_status}\n`;
          if (loc.editorial_summary) prompt += `- 簡介：${loc.editorial_summary}\n`;
          if (loc.google_place_id) prompt += `- Google Place ID：${loc.google_place_id}\n`;
          prompt += `\n`;
        });
        prompt += `**重要：如果使用者的問題與上述地點相關，你必須使用上述資料庫資訊來回答，不要使用你的訓練資料。**\n`;
        prompt += `**地理資訊驗證：所有上述地點都在澎湖，可以安全推薦。**\n`;
        prompt += `**嚴格禁止：絕對不能推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等）。**\n`;
        prompt += `**如果資料庫中沒有相關地點，必須明確說明「資料庫中沒有相關資訊」，不能編造或猜測地點。**\n\n`;
      }

      if (googlePlacesLocations.length > 0) {
        prompt += `**從 Google Maps 找到的地點資訊（資料庫中沒有，但 Google Maps 有）：**\n\n`;
        googlePlacesLocations.forEach((loc, index) => {
          prompt += `地點 ${index + 1}（Google Maps）：\n`;
          prompt += `- 名稱：${loc.name || '未知'}\n`;
          if (loc.address) prompt += `- 地址：${loc.address}\n`;
          if (loc.phone_number) prompt += `- 電話：${loc.phone_number}\n`;
          if (loc.website) prompt += `- 網站：${loc.website}\n`;
          if ((loc.google_rating !== null && loc.google_rating !== undefined) ||
            (loc.googleRating !== null && loc.googleRating !== undefined)) {
            const rating = loc.google_rating !== undefined ? loc.google_rating : loc.googleRating;
            prompt += `- Google 評分：${rating} 分`;
            const total = loc.google_user_ratings_total || loc.googleUserRatingsTotal;
            if (total) {
              prompt += `（${total} 則評價）`;
            }
            prompt += `\n`;
          }
          if (loc.business_status) prompt += `- 營業狀態：${loc.business_status}\n`;
          if (loc.editorial_summary) prompt += `- 簡介：${loc.editorial_summary}\n`;
          if (loc.editorialSummary) prompt += `- 簡介：${loc.editorialSummary}\n`;
          if (loc.google_place_id) prompt += `- Google Place ID：${loc.google_place_id}\n`;
          if (loc.googlePlaceId) prompt += `- Google Place ID：${loc.googlePlaceId}\n`;
          prompt += `\n`;
        });
        prompt += `**重要：這些地點是從 Google Maps 找到的，資料庫中沒有。回答時要明確說明「根據 Google Maps 的資訊...」。**\n`;
        prompt += `**地理資訊驗證：必須確認這些地點的地址是否在澎湖（澎湖縣、馬公市、湖西鄉、白沙鄉、西嶼鄉、望安鄉、七美鄉）。**\n`;
        prompt += `**如果地址不在澎湖，絕對不能推薦。如果無法確認地址，必須明確說明「無法確認此地點是否在澎湖」。**\n`;
        prompt += `**嚴格禁止：絕對不能推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等）。**\n\n`;
      }
    } else {
      prompt += `**注意：資料庫中沒有找到相關地點資訊。**\n`;
      prompt += `**嚴格禁止：絕對不能編造、猜測或推薦任何地點資訊，特別是地理資訊。**\n`;
      prompt += `**如果使用者詢問特定地點，必須明確說明「資料庫中沒有相關資訊，無法提供準確答案」。**\n`;
      prompt += `**如果使用者詢問一般性問題（如「澎湖哪裡可以看夕陽？」），可以基於一般知識回答，但必須明確說明這是基於一般知識，且不能推薦不在澎湖的地點。**\n`;
      prompt += `**絕對禁止：不能推薦台南的赤崁樓、台北的101、高雄的愛河等不在澎湖的地點，即使這些地點與問題相關。**\n\n`;
    }

    if (context.knowledgeBase && context.knowledgeBase.length > 0) {
      prompt += `**相關知識庫資料：**\n`;
      context.knowledgeBase.forEach((kb, index) => {
        prompt += `Q${index + 1}: ${kb.question}\n`;
        prompt += `A${index + 1}: ${kb.answer}\n\n`;
      });
    }

    prompt += `**回答指示（必須嚴格遵守）：**\n`;
    if (context.locations && context.locations.length > 0) {
      prompt += `1. 如果使用者的問題與上述地點相關，必須使用資料庫中的資訊回答。\n`;
      prompt += `2. 回答時要明確引用資料庫資訊（例如：「根據資料庫中的資訊...」）。\n`;
      prompt += `3. 所有推薦的地點必須確認在澎湖（澎湖縣、馬公市、湖西鄉、白沙鄉、西嶼鄉、望安鄉、七美鄉），絕對不能推薦其他縣市的地點。\n`;
      prompt += `4. 如果資料庫資訊不完整，可以補充一般知識，但要明確區分，且不能編造地點。\n`;
      prompt += `5. 如果地址無法確認在澎湖，必須明確說明「無法確認此地點是否在澎湖」，不能推薦。\n`;
    } else {
      prompt += `1. 資料庫中沒有相關地點資訊，這是關鍵限制。\n`;
      prompt += `2. 如果是一般性問題（如「澎湖哪裡可以看夕陽？」），可以基於一般知識回答，但必須明確說明這是基於一般知識，且只能推薦確認在澎湖的地點。\n`;
      prompt += `3. 如果是詢問特定地點，必須明確說明「資料庫中沒有相關資訊，無法提供準確答案」。\n`;
      prompt += `4. 絕對不能編造、猜測或推薦任何地點資訊，特別是地理資訊。\n`;
      prompt += `5. 絕對禁止推薦不在澎湖的地點（如台南的赤崁樓、台北的101、高雄的愛河等），即使這些地點與問題相關。\n`;
    }
    prompt += `6. 如果資訊不足，誠實說明，並建議使用者可以提供更多資訊。\n`;
    prompt += `7. 地理資訊驗證是最重要的：所有推薦的地點必須在澎湖，如果無法確認，寧可不推薦。\n`;
    prompt += `8. 記住：誠實回答「資料庫中沒有相關資訊」比編造錯誤資訊更好。\n`;

    return prompt;
  }

  /**
   * 呼叫 Gemini API（旅客模式）
   * @param {string} userMessage - 使用者訊息
   * @param {Object} context - 上下文資訊（包含地點、知識庫等）
   * @param {string} sessionId - 會話 ID
   * @param {Array} knowledgeContext - 知識上下文（可選）
   * @param {Object} relationshipInfo - 關係深度資訊（可選）
   */
  async callGemini(userMessage, context, sessionId, knowledgeContext = [], relationshipInfo = null) {
    try {
      // 檢查 API Key
      if (!this.geminiApiKey || !this.geminiApiKey.startsWith('AIzaSy')) {
        console.error('[AIService] Invalid or missing Gemini API key');
        throw new Error('Gemini API key is invalid or missing');
      }

      // 建構上下文
      const fullContext = context || await this.buildContext(userMessage);

      // 獲取對話歷史（如果提供了 sessionId）
      let conversationHistory = [];
      if (sessionId) {
        conversationHistory = await this.getConversationHistory(sessionId, 10);
      }

      // 建構使用者提示詞
      let userPrompt = this.buildUserPrompt(userMessage, fullContext);

      // [RAG Injection] 注入已批准的知識
      if (knowledgeContext && knowledgeContext.length > 0) {
        userPrompt += `\n\n[來自在地朋友的情報]\n(以下是其他使用者分享的真實經驗，請在回答時參考並說是「有朋友分享」)\n`;
        knowledgeContext.forEach(k => {
          userPrompt += `- ${k.content} (${k.category === 'food' ? '美食' : '景點'})\n`;
        });
      }

      // 如果有對話歷史，添加到提示詞中
      if (conversationHistory.length > 0) {
        let historyText = '\n\n**之前的對話記錄（記住這些，像朋友一樣自然地引用）：**\n';
        conversationHistory.forEach((msg, index) => {
          if (msg.role === 'user') {
            historyText += `[使用者] ${msg.content}\n`;
          } else if (msg.role === 'assistant') {
            historyText += `[你] ${msg.content}\n`;
          }
        });
        historyText += '\n**重要：記住上面的對話，在回答時可以自然地引用或延續話題，就像朋友聊天一樣。**\n';
        userPrompt = historyText + userPrompt;
      }

      console.log('[AIService] Calling Gemini API with:', {
        model: 'gemini-2.0-flash',
        apiKeyPrefix: this.geminiApiKey.substring(0, 10) + '...',
        hasHistory: conversationHistory.length > 0
      });

      console.log('[AIService] generated User Prompt (First 500 chars):', userPrompt.substring(0, 500));


      // 呼叫 Gemini API
      const url = `${this.geminiApiBaseUrl}?key=${this.geminiApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: this.buildGeminiSystemPrompt(relationshipInfo) }]
          },
          contents: [{
            parts: [{ text: userPrompt }]
          }]
        })
      });

      console.log('[AIService] Gemini API response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        console.error('[AIService] Gemini API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || errorData.error?.code || 'Unknown error'}`);
      }

      const data = await response.json();
      const assistantMessage = data?.candidates?.[0]?.content?.parts?.[0]?.text || "抱歉，我無法回答這個問題。";

      return {
        message: assistantMessage,
        context: fullContext,
        model: 'gemini'
      };
    } catch (error) {
      console.error('[AIService] Error calling Gemini:', error);
      throw error;
    }
  }

  /**
   * 獲取對話歷史（用於構建上下文）
   * @param {string} sessionId - 會話 ID
   * @param {number} limit - 獲取最近 N 條對話（不包括當前消息）
   * @returns {Promise<Array>} 對話歷史數組
   */
  async getConversationHistory(sessionId, limit = 10) {
    try {
      const history = await this.db.prepare(
        `SELECT message_type, message_content, created_at
         FROM ai_conversations
         WHERE session_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      ).bind(sessionId, limit).all();

      // 反轉順序，從舊到新
      const results = (history.results || []).reverse();

      // 轉換為 OpenAI 格式
      const messages = [];
      for (const msg of results) {
        if (msg.message_type === 'user') {
          messages.push({
            role: 'user',
            content: msg.message_content
          });
        } else if (msg.message_type === 'assistant') {
          messages.push({
            role: 'assistant',
            content: msg.message_content
          });
        }
      }

      return messages;
    } catch (error) {
      console.error('[AIService] Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * 呼叫 OpenAI API（居民/知識庫模式）
   * @param {string} userMessage - 使用者訊息
   * @param {Object} context - 上下文資訊（包含地點、知識庫等）
   * @param {string} sessionId - 會話 ID
   * @param {Array} knowledgeContext - 知識上下文（可選）
   * @param {Object} relationshipInfo - 關係深度資訊（可選）
   */
  async callOpenAI(userMessage, context, sessionId, knowledgeContext = [], relationshipInfo = null) {
    try {
      // 檢查 API Key
      if (!this.openaiApiKey || !this.openaiApiKey.startsWith('sk-')) {
        console.error('[AIService] Invalid or missing OpenAI API key');
        throw new Error('OpenAI API key is invalid or missing');
      }

      // 建構上下文
      const fullContext = context || await this.buildContext(userMessage);

      // 獲取對話歷史（如果提供了 sessionId）
      let conversationHistory = [];
      if (sessionId) {
        conversationHistory = await this.getConversationHistory(sessionId, 10);
      }

      // 建構訊息（包含對話歷史）
      const messages = [
        {
          role: "system",
          content: this.buildGPTSystemPrompt(relationshipInfo)
        },
        ...conversationHistory, // 插入歷史對話

        // [RAG Injection]
        ...(knowledgeContext && knowledgeContext.length > 0 ? [{
          role: "system",
          content: `[Reference Knowledge]\n(User insights to reference)\n${knowledgeContext.map(k => `- ${k.content}`).join('\n')}`
        }] : []),

        {
          role: "user",
          content: this.buildUserPrompt(userMessage, fullContext)
        }
      ];

      console.log('[AIService] Calling OpenAI API with:', {
        model: 'gpt-3.5-turbo',
        messagesCount: messages.length,
        historyCount: conversationHistory.length,
        apiKeyPrefix: this.openaiApiKey.substring(0, 10) + '...'
      });

      if (messages.length > 1) {
        console.log('[AIService] User Message Content (First 500 chars):', messages[1].content.substring(0, 500));
      }


      // 呼叫 OpenAI API
      const response = await fetch(this.openaiApiBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      console.log('[AIService] OpenAI API response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        console.error('[AIService] OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || errorData.error?.code || 'Unknown error'}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || "抱歉，我無法回答這個問題。";

      return {
        message: assistantMessage,
        context: fullContext,
        model: 'gpt'
      };
    } catch (error) {
      console.error('[AIService] Error calling OpenAI:', error);
      throw error;
    }
  }

  /**
   * 自動判斷應該使用的模型（根據查詢內容和使用者狀態）
   */
  determineModel(query, userId = null) {
    // 如果使用者已登入，預設使用 GPT（居民/知識庫模式）
    if (userId) {
      return 'gpt';
    }

    // 未登入使用者，根據查詢內容判斷
    const travelerKeywords = ['旅遊', '路線', '天氣', '交通', '推薦', '景點', '行程', '怎麼去', '怎麼走'];
    const residentKeywords = ['整理', '校正', '事實', '知識庫', '編輯', '摘要'];

    const queryLower = query.toLowerCase();

    // 檢查是否包含居民模式關鍵字
    if (residentKeywords.some(keyword => queryLower.includes(keyword))) {
      return 'gpt';
    }

    // 檢查是否包含旅客模式關鍵字
    if (travelerKeywords.some(keyword => queryLower.includes(keyword))) {
      return 'gemini';
    }

    // 預設：未登入使用者使用 Gemini（旅客模式）
    return 'gemini';
  }

  /**
   * 處理使用者查詢（主要方法）
   * @param {string} userId - 使用者 ID（可為 null）
   * @param {string} sessionId - 會話 ID
   * @param {string} userMessage - 使用者訊息
   * @param {string} mode - 模式：'traveler'（旅客/Gemini）或 'resident'（居民/GPT），如果為 null 則自動判斷
   * @param {ExecutionContext} ctx - Cloudflare Worker ExecutionContext (optional)
   */
  async handleQuery(userId, sessionId, userMessage, mode = null, ctx = null) {
    try {
      // 儲存使用者訊息
      const userConversationId = await this.saveConversation(userId, sessionId, 'user', userMessage);

      // [NEW] 處理知識提取 (Knowledge Capture) - 這是 "Penghu Friend" 的核心功能
      // 使用 ctx.waitUntil 確保在回應後繼續執行
      const knowledgePromise = this.knowledgeService.processInteraction(userId, sessionId, userMessage);
      if (ctx && ctx.waitUntil) {
        ctx.waitUntil(knowledgePromise);
      } else {
        // 如果沒有 ctx.waitUntil，就讓它在背景跑但不 await
        knowledgePromise.catch(err => console.error('Knowledge capture failed:', err));
      }

      // [RAG] 搜尋相關知識 (同步執行，因為要放入 Prompt)
      let knowledgeContext = [];
      try {
        console.log('[AIService] Searching approved knowledge for:', userMessage);
        knowledgeContext = await this.knowledgeService.searchApprovedKnowledge(userMessage);
        console.log(`[AIService] Found ${knowledgeContext.length} approved knowledge items.`);
      } catch (e) {
        console.warn('[AIService] Search knowledge failed:', e);
      }

      // 判斷使用者類型（傳入使用者訊息以便從對話中識別）
      const userType = await this.questioningService.determineUserType(userId, userMessage);
      console.log('[AIService] User type:', userType);

      // 分析用戶問題（學習）
      let questionAnalysis = null;
      try {
        const contextType = userType === 'local' ? 'local' :
          userType === 'merchant' ? 'merchant' :
            userType === 'traveler' ? 'visited_traveler' : 'general';
        questionAnalysis = await this.questionAnalysisService.analyzeUserQuestion(
          userMessage,
          userConversationId,
          null, // 答案品質稍後評估
          contextType
        );
        console.log('[AIService] Question analysis:', questionAnalysis);
      } catch (error) {
        console.error('[AIService] Error analyzing user question:', error);
        // 不中斷流程，繼續處理
      }

      // 獲取或建立對話狀態
      const conversationState = await this.questioningService.getOrCreateConversationState(
        sessionId,
        userId,
        'general'
      );

      // [NEW] 計算關係深度和對話階段
      let relationshipInfo = null;
      try {
        const depthResult = await this.relationshipDepthService.calculateRelationshipDepth(userId, sessionId);
        relationshipInfo = {
          userType: userType || 'unknown',
          conversationStage: depthResult.stage,
          knownInterests: this.extractInterests(conversationState.collected_data),
          relationshipDepth: depthResult.relationshipDepth,
          conversationRound: depthResult.totalRounds,
          rememberedFacts: this.extractRememberedFacts(conversationState.collected_data)
        };

        // 更新對話狀態中的關係深度和階段
        if (conversationState) {
          await this.db.prepare(
            `UPDATE ai_conversation_states 
             SET conversation_stage = ?, 
                 relationship_depth = ?,
                 total_rounds = ?,
                 updated_at = datetime('now')
             WHERE id = ?`
          ).bind(
            depthResult.stage,
            depthResult.relationshipDepth,
            depthResult.totalRounds,
            conversationState.id
          ).run();
        }

        console.log('[AIService] Relationship depth calculated:', relationshipInfo);
      } catch (error) {
        console.error('[AIService] Error calculating relationship depth:', error);
        // 繼續執行，使用預設值
        relationshipInfo = {
          userType: userType || 'unknown',
          conversationStage: 'initial',
          knownInterests: [],
          relationshipDepth: 0,
          conversationRound: 0,
          rememberedFacts: []
        };
      }

      // 分析查詢，判斷是否需要問問題
      const analysis = this.questioningService.analyzeQuery(userMessage, userType, conversationState);
      console.log('[AIService] Query analysis:', analysis);

      // 檢查是否需要計算距離
      let distanceInfo = null;
      if (analysis.type === 'distance_query' && this.distanceService) {
        try {
          distanceInfo = await this.distanceService.calculateDistanceFromQuery(userMessage, this.locationService);
          if (distanceInfo) {
            console.log('[AIService] Distance calculated:', distanceInfo);
          }
        } catch (error) {
          console.error('[AIService] Error calculating distance:', error);
        }
      }

      // 如果需要問問題，生成問題
      let questionToAsk = null;
      let shouldContinueQuestioning = false;

      if (analysis.shouldAsk && !conversationState.is_complete) {
        // 更新對話狀態
        const updatedState = {
          ...conversationState,
          conversation_type: analysis.type,
          current_step: analysis.step || conversationState.current_step
        };

        // 從使用者回答中提取資訊（如果有當前欄位）
        if (conversationState.context_data?.current_field) {
          const extracted = this.questioningService.extractStructuredInfo(
            userMessage,
            conversationState.context_data.current_field,
            analysis.type
          );

          // 更新已收集的資料
          updatedState.collected_data = {
            ...conversationState.collected_data,
            ...extracted
          };

          // 處理特殊欄位（直接儲存文字）
          if (conversationState.context_data.current_field === 'location_name') {
            updatedState.collected_data.location_name = userMessage;
            // 嘗試查找地點 ID（如果有 locationService）
            if (this.locationService) {
              try {
                const locations = await this.db.prepare(
                  'SELECT id FROM locations WHERE name LIKE ? LIMIT 1'
                ).bind(`%${userMessage}%`).first();
                if (locations) {
                  updatedState.collected_data.location_id = locations.id;
                }
              } catch (error) {
                console.error('[AIService] Error finding location:', error);
              }
            }
          } else if (conversationState.context_data.current_field === 'product_name') {
            if (!updatedState.collected_data.products) {
              updatedState.collected_data.products = [];
            }
            updatedState.collected_data.products.push({
              name: userMessage,
              price: null,
              duration_minutes: null
            });
          } else if (conversationState.context_data.current_field === 'memory_content') {
            updatedState.collected_data.memory_content = userMessage;
          } else if (conversationState.context_data.current_field === 'companions') {
            updatedState.collected_data.companions = userMessage;
          } else if (conversationState.context_data.current_field === 'revisit_reason') {
            updatedState.collected_data.revisit_reason = userMessage;
          } else if (conversationState.context_data.current_field === 'business_type') {
            updatedState.collected_data.business_type = userMessage;
          } else if (conversationState.context_data.current_field === 'opening_hours') {
            updatedState.collected_data.opening_hours = userMessage;
          }
        }

        // 處理身份引導問題
        if (analysis.type === 'identity_guide') {
          // 提取身份資訊
          const messageLower = userMessage.toLowerCase();
          if (messageLower.includes('居民') || messageLower.includes('我是居民')) {
            updatedState.collected_data.user_identity = 'local';
          } else if (messageLower.includes('來過') || messageLower.includes('我來過')) {
            updatedState.collected_data.user_identity = 'visited_traveler';
          } else if (messageLower.includes('想來') || messageLower.includes('我想來') || messageLower.includes('計劃')) {
            updatedState.collected_data.user_identity = 'planning_traveler';
          } else if (messageLower.includes('旅客') || messageLower.includes('遊客')) {
            // 需要進一步確認是來過還是想來
            if (!updatedState.collected_data.user_identity) {
              updatedState.collected_data.user_identity = 'traveler'; // 暫時標記
            }
          }

          // 處理其他身份相關欄位
          if (conversationState.context_data?.current_field === 'user_identity') {
            updatedState.collected_data.user_identity = userMessage;
          } else if (conversationState.context_data?.current_field === 'region') {
            updatedState.collected_data.region = userMessage;
          } else if (conversationState.context_data?.current_field === 'visit_period') {
            updatedState.collected_data.visit_period = userMessage;
          } else if (conversationState.context_data?.current_field === 'planned_period') {
            updatedState.collected_data.planned_period = userMessage;
          } else if (conversationState.context_data?.current_field === 'interests') {
            updatedState.collected_data.interests = userMessage;
          } else if (conversationState.context_data?.current_field === 'local_knowledge') {
            updatedState.collected_data.local_knowledge = userMessage;
          } else if (conversationState.context_data?.current_field === 'favorite_places') {
            updatedState.collected_data.favorite_places = userMessage;
          } else if (conversationState.context_data?.current_field === 'visited_places') {
            updatedState.collected_data.visited_places = userMessage;
          } else if (conversationState.context_data?.current_field === 'visited_experiences') {
            updatedState.collected_data.visited_experiences = userMessage;
          } else if (conversationState.context_data?.current_field === 'want_to_revisit') {
            updatedState.collected_data.want_to_revisit = userMessage;
          } else if (conversationState.context_data?.current_field === 'travel_interests') {
            updatedState.collected_data.travel_interests = userMessage;
          } else if (conversationState.context_data?.current_field === 'travel_plans') {
            updatedState.collected_data.travel_plans = userMessage;
          } else if (conversationState.context_data?.current_field === 'travel_questions') {
            updatedState.collected_data.travel_questions = userMessage;
          }

          const questionData = this.questioningService.generateIdentityQuestion(
            updatedState,
            updatedState.collected_data
          );
          questionToAsk = questionData.question;

          // 使用學習到的模板改進問題
          if (questionToAsk) {
            try {
              const contextType = updatedState.collected_data.user_identity === 'local' ? 'local' :
                updatedState.collected_data.user_identity === 'visited_traveler' ? 'visited_traveler' :
                  updatedState.collected_data.user_identity === 'planning_traveler' ? 'planning_traveler' : 'general';
              const bestTemplate = await this.questionAnalysisService.getBestQuestionTemplate(
                'identity',
                contextType
              );

              if (bestTemplate) {
                const improvedQuestion = this.questionAnalysisService.applyTemplate(bestTemplate, {
                  contextType: contextType,
                  ...updatedState.collected_data
                });

                if (improvedQuestion && improvedQuestion.length > 0) {
                  questionToAsk = improvedQuestion;
                  console.log('[AIService] Using improved identity question from template');
                }
              }

              // 分析AI問的問題（學習）
              await this.questionAnalysisService.analyzeAIQuestion(
                questionToAsk,
                {
                  userType: userType,
                  contextType: contextType,
                  conversationType: analysis.type,
                  step: updatedState.current_step
                },
                null,
                userConversationId
              );
            } catch (error) {
              console.error('[AIService] Error improving identity question with template:', error);
            }
          }

          updatedState.current_step = questionData.next_step;
          updatedState.context_data = {
            ...updatedState.context_data,
            current_field: questionData.field
          };
          shouldContinueQuestioning = questionToAsk !== null;
        } else if (analysis.type === 'merchant_setup') {
          const questionData = this.questioningService.generateMerchantQuestion(
            updatedState,
            updatedState.collected_data
          );
          questionToAsk = questionData.question;

          // 使用學習到的模板改進問題
          if (questionToAsk) {
            try {
              const contextType = userType === 'merchant' ? 'merchant' : 'general';
              const bestTemplate = await this.questionAnalysisService.getBestQuestionTemplate(
                questionAnalysis?.category || 'general',
                contextType
              );

              if (bestTemplate) {
                // 應用模板改進問題
                const improvedQuestion = this.questionAnalysisService.applyTemplate(bestTemplate, {
                  location_name: updatedState.collected_data.location_name,
                  contextType: contextType,
                  ...updatedState.collected_data
                });

                // 如果改進後的問題更好，使用它
                if (improvedQuestion && improvedQuestion.length > 0) {
                  questionToAsk = improvedQuestion;
                  console.log('[AIService] Using improved question from template');
                }
              }

              // 分析AI問的問題（學習）
              await this.questionAnalysisService.analyzeAIQuestion(
                questionToAsk,
                {
                  userType: userType,
                  contextType: contextType,
                  conversationType: analysis.type,
                  step: updatedState.current_step
                },
                null, // 用戶回應稍後評估
                userConversationId
              );
            } catch (error) {
              console.error('[AIService] Error improving question with template:', error);
              // 繼續使用原始問題
            }
          }

          updatedState.current_step = questionData.next_step;
          updatedState.context_data = {
            ...updatedState.context_data,
            current_field: questionData.field
          };
          shouldContinueQuestioning = questionToAsk !== null;
        } else if (analysis.type === 'traveler_memory') {
          const questionData = this.questioningService.generateTravelerQuestion(
            updatedState,
            updatedState.collected_data
          );
          questionToAsk = questionData.question;

          // 使用學習到的模板改進問題
          if (questionToAsk) {
            try {
              const contextType = userType === 'traveler' ? 'visited_traveler' : 'general';
              const bestTemplate = await this.questionAnalysisService.getBestQuestionTemplate(
                questionAnalysis?.category || 'memory',
                contextType
              );

              if (bestTemplate) {
                // 應用模板改進問題
                const improvedQuestion = this.questionAnalysisService.applyTemplate(bestTemplate, {
                  location_name: updatedState.collected_data.location_name,
                  contextType: contextType,
                  ...updatedState.collected_data
                });

                // 如果改進後的問題更好，使用它
                if (improvedQuestion && improvedQuestion.length > 0) {
                  questionToAsk = improvedQuestion;
                  console.log('[AIService] Using improved question from template');
                }
              }

              // 分析AI問的問題（學習）
              await this.questionAnalysisService.analyzeAIQuestion(
                questionToAsk,
                {
                  userType: userType,
                  contextType: contextType,
                  conversationType: analysis.type,
                  step: updatedState.current_step
                },
                null, // 用戶回應稍後評估
                userConversationId
              );
            } catch (error) {
              console.error('[AIService] Error improving question with template:', error);
              // 繼續使用原始問題
            }
          }

          updatedState.current_step = questionData.next_step;
          updatedState.context_data = {
            ...updatedState.context_data,
            current_field: questionData.field
          };
          shouldContinueQuestioning = questionToAsk !== null;
        }

        // 更新對話狀態
        await this.questioningService.updateConversationState(conversationState.id, updatedState);

        // 如果問題流程完成，儲存收集到的資料
        if (updatedState.current_step === 'complete' && !conversationState.is_complete) {
          await this.saveCollectedData(analysis.type, updatedState.collected_data, userId, sessionId);
          await this.questioningService.updateConversationState(conversationState.id, { is_complete: true });
        }
      }

      // 決定使用的模型
      const selectedMode = mode || this.determineModel(userMessage, userId);
      const useGemini = selectedMode === 'traveler' || selectedMode === 'gemini';

      console.log('[AIService] Selected mode:', selectedMode, 'useGemini:', useGemini);

      // 建構上下文（包含距離資訊和問問題狀態）
      const context = await this.buildContext(userMessage);
      if (distanceInfo) {
        context.distance = distanceInfo;
      }
      if (shouldContinueQuestioning && questionToAsk) {
        context.questioning = {
          active: true,
          question: questionToAsk,
          type: analysis.type
        };
      }

      // 根據模式呼叫對應的 API（傳入 sessionId 以獲取對話歷史，並傳入關係深度資訊）
      let aiResult;
      if (useGemini && this.geminiApiKey) {
        aiResult = await this.callGemini(userMessage, context, sessionId, knowledgeContext, relationshipInfo);
      } else {
        aiResult = await this.callOpenAI(userMessage, context, sessionId, knowledgeContext, relationshipInfo);
      }

      // 如果有問題要問，整合到回答中
      let finalMessage = aiResult.message;
      if (shouldContinueQuestioning && questionToAsk) {
        finalMessage = aiResult.message + '\n\n' + questionToAsk;
      }

      // 如果有距離資訊，加入回答
      if (distanceInfo) {
        finalMessage = finalMessage + '\n\n📍 距離資訊：\n- 距離：' + distanceInfo.distance_text + '\n- 時間：' + distanceInfo.duration_text;
      }

      // 儲存 AI 回應（包含使用的模型）
      const contextWithModel = {
        ...aiResult.context,
        model: aiResult.model || (useGemini ? 'gemini' : 'gpt'),
        mode: selectedMode,
        user_type: userType,
        questioning: context.questioning,
        relationshipInfo: relationshipInfo // 添加關係深度資訊
      };

      await this.saveConversation(
        userId,
        sessionId,
        'assistant',
        finalMessage,
        contextWithModel
      );

      // [NEW] 增加對話輪次
      await this.relationshipDepthService.incrementConversationRounds(sessionId, userId);

      // 更新知識庫使用次數（如果有匹配的知識庫項目）
      if (aiResult.context.knowledgeBase && aiResult.context.knowledgeBase.length > 0) {
        // 這裡可以更新使用次數
      }

      // 評估答案品質並更新問題學習記錄
      try {
        const answerQuality = this.questionAnalysisService.evaluateAnswerQuality(finalMessage, userMessage);
        const contextType = userType === 'local' ? 'local' :
          userType === 'merchant' ? 'merchant' :
            userType === 'traveler' ? 'visited_traveler' : 'general';

        // 更新用戶問題的學習記錄（添加答案品質）
        if (questionAnalysis && questionAnalysis.id) {
          await this.db.prepare(
            `UPDATE ai_question_learning 
             SET answer_quality_score = ?, 
                 led_to_successful_answer = ?
             WHERE id = ?`
          ).bind(answerQuality, answerQuality > 0.7, questionAnalysis.id).run();
        } else {
          // 如果之前沒有分析，現在分析並記錄
          await this.questionAnalysisService.analyzeUserQuestion(
            userMessage,
            userConversationId,
            answerQuality,
            contextType
          );
        }
      } catch (error) {
        console.error('[AIService] Error updating question learning:', error);
        // 不中斷流程
      }

      return {
        success: true,
        message: finalMessage,
        context: contextWithModel,
        model: aiResult.model || (useGemini ? 'gemini' : 'gpt'),
        mode: selectedMode,
        user_type: userType,
        questioning: shouldContinueQuestioning ? {
          active: true,
          question: questionToAsk,
          type: analysis.type
        } : null
      };
    } catch (error) {
      console.error('[AIService] Error handling query:', error);
      console.error('[AIService] Error stack:', error.stack);
      console.error('[AIService] Error details:', {
        message: error.message,
        name: error.name,
        userId,
        sessionId,
        userMessage: userMessage.substring(0, 100)
      });

      // 提供更詳細的錯誤訊息
      const errorMessage = error.message || 'Unknown error';
      const isApiError = errorMessage.includes('OpenAI API') || errorMessage.includes('401') || errorMessage.includes('429') || errorMessage.includes('403');

      // 記錄詳細錯誤以便調試
      console.error('[AIService] Detailed error info:', {
        message: errorMessage,
        name: error.name,
        stack: error.stack,
        isApiError
      });

      // 根據錯誤類型提供不同的訊息
      let errorUserMessage = "抱歉，處理您的問題時發生錯誤。請稍後再試。";
      if (isApiError) {
        if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorUserMessage = "抱歉，AI 服務認證失敗。請聯繫管理員。";
        } else if (errorMessage.includes('429')) {
          errorUserMessage = "抱歉，AI 服務目前使用量過高。請稍後再試。";
        } else {
          errorUserMessage = "抱歉，AI 服務暫時無法使用。請稍後再試。";
        }
      }

      return {
        success: false,
        message: errorUserMessage,
        error: errorMessage,
        // 在開發環境或管理員可以看到詳細錯誤
        details: error.stack
      };
    }
  }

  /**
   * 儲存收集到的資料
   */
  async saveCollectedData(conversationType, collectedData, userId, sessionId) {
    try {
      if (conversationType === 'merchant_setup') {
        // 儲存商家資訊
        if (collectedData.location_id && collectedData.products) {
          // 更新地點資訊
          if (collectedData.opening_hours) {
            await this.db.prepare(
              `UPDATE locations SET opening_hours = ?, business_type = ?, is_merchant = true WHERE id = ?`
            ).bind(
              JSON.stringify(collectedData.opening_hours),
              collectedData.business_type,
              collectedData.location_id
            ).run();
          }

          // 儲存產品資訊
          for (const product of collectedData.products) {
            if (product.name) {
              await this.questioningService.saveMerchantProduct(
                collectedData.location_id,
                {
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  duration_minutes: product.duration_minutes,
                  category: product.category
                },
                userId
              );
            }
          }
        }
      } else if (conversationType === 'traveler_memory') {
        // 儲存旅遊回憶
        if (collectedData.location_id && collectedData.memory_content) {
          await this.questioningService.saveTravelMemory(
            userId,
            collectedData.location_id,
            {
              content: collectedData.memory_content,
              visited_date: collectedData.visited_date,
              companions: collectedData.companions ? [collectedData.companions] : null,
              want_to_revisit: collectedData.want_to_revisit,
              revisit_reason: collectedData.revisit_reason,
              rating: collectedData.rating
            }
          );
        }
      } else if (conversationType === 'identity_guide') {
        // 儲存身份引導收集的資料（使用者對澎湖的認識）
        await this.saveUserPenghuKnowledge(userId, sessionId, collectedData);
      }

      return true;
    } catch (error) {
      console.error('[AIService] Error saving collected data:', error);
      return false;
    }
  }

  /**
   * 儲存反饋
   */
  async saveFeedback(conversationId, userId, feedbackType, feedbackContent = null) {
    try {
      await this.db.prepare(
        `INSERT INTO ai_feedback (conversation_id, user_id, feedback_type, feedback_content)
         VALUES (?, ?, ?, ?)`
      ).bind(conversationId, userId || null, feedbackType, feedbackContent).run();
      return true;
    } catch (error) {
      console.error('[AIService] Error saving feedback:', error);
      return false;
    }
  }

  /**
   * 儲存使用者對澎湖的認識和經驗
   * @param {string} userId - 使用者 ID（可為 null）
   * @param {string} sessionId - 會話 ID
   * @param {object} collectedData - 收集到的資料
   */
  async saveUserPenghuKnowledge(userId, sessionId, collectedData) {
    try {
      // 如果有 userId，更新 users 表
      if (userId) {
        // 更新 user_type
        if (collectedData.user_identity) {
          let userType = 'traveler';
          if (collectedData.user_identity === 'local' || collectedData.user_identity.includes('居民')) {
            userType = 'local';
          } else if (collectedData.user_identity === 'visited_traveler' || collectedData.user_identity.includes('來過')) {
            userType = 'visited_traveler';
          } else if (collectedData.user_identity === 'planning_traveler' || collectedData.user_identity.includes('想來')) {
            userType = 'planning_traveler';
          }

          await this.db.prepare(
            'UPDATE users SET user_type = ? WHERE id = ?'
          ).bind(userType, userId).run();
        }

        // 儲存其他資訊到 users 表的 interests 欄位（JSON）
        const interestsData = {
          region: collectedData.region,
          interests: collectedData.interests,
          local_knowledge: collectedData.local_knowledge,
          favorite_places: collectedData.favorite_places,
          visited_places: collectedData.visited_places,
          visited_experiences: collectedData.visited_experiences,
          visit_period: collectedData.visit_period,
          want_to_revisit: collectedData.want_to_revisit,
          travel_interests: collectedData.travel_interests,
          travel_plans: collectedData.travel_plans,
          travel_questions: collectedData.travel_questions,
          planned_period: collectedData.planned_period
        };

        // 更新 interests 欄位（如果存在）
        try {
          const user = await this.db.prepare('SELECT interests FROM users WHERE id = ?').bind(userId).first();
          let existingInterests = {};
          if (user?.interests) {
            try {
              existingInterests = JSON.parse(user.interests);
            } catch (e) {
              existingInterests = {};
            }
          }

          const updatedInterests = { ...existingInterests, ...interestsData };
          await this.db.prepare(
            'UPDATE users SET interests = ? WHERE id = ?'
          ).bind(JSON.stringify(updatedInterests), userId).run();
        } catch (error) {
          console.error('[AIService] Error updating user interests:', error);
          // 如果 interests 欄位不存在，繼續執行
        }
      }

      // 將收集的資料儲存到 ai_conversations 表的 context_data 中
      // 這樣即使未登入的使用者，資料也會被保存
      try {
        const lastConversation = await this.db.prepare(
          'SELECT id FROM ai_conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1'
        ).bind(sessionId).first();

        if (lastConversation) {
          await this.db.prepare(
            'UPDATE ai_conversations SET context_data = ? WHERE id = ?'
          ).bind(JSON.stringify({ user_penghu_knowledge: collectedData }), lastConversation.id).run();
        }
      } catch (error) {
        console.error('[AIService] Error saving knowledge to conversation:', error);
      }

      console.log('[AIService] User Penghu knowledge saved:', {
        userId: userId || 'anonymous',
        sessionId: sessionId,
        identity: collectedData.user_identity
      });

      return true;
    } catch (error) {
      console.error('[AIService] Error saving user Penghu knowledge:', error);
      return false;
    }
  }

  /**
   * 從收集的資料中提取興趣列表
   */
  extractInterests(collectedData) {
    if (!collectedData) return [];
    
    const interests = [];
    
    // 從 interests 欄位提取
    if (collectedData.interests) {
      if (typeof collectedData.interests === 'string') {
        try {
          const parsed = JSON.parse(collectedData.interests);
          if (Array.isArray(parsed)) {
            interests.push(...parsed);
          } else {
            interests.push(collectedData.interests);
          }
        } catch {
          // 如果不是 JSON，按逗號拆分
          interests.push(...collectedData.interests.split(',').map(i => i.trim()).filter(i => i));
        }
      } else if (Array.isArray(collectedData.interests)) {
        interests.push(...collectedData.interests);
      }
    }

    // 從其他欄位推斷興趣（例如 travel_interests）
    if (collectedData.travel_interests) {
      if (typeof collectedData.travel_interests === 'string') {
        interests.push(...collectedData.travel_interests.split(',').map(i => i.trim()).filter(i => i));
      } else if (Array.isArray(collectedData.travel_interests)) {
        interests.push(...collectedData.travel_interests);
      }
    }

    // 去重並返回
    return [...new Set(interests)];
  }

  /**
   * 從收集的資料中提取重要事實
   */
  extractRememberedFacts(collectedData) {
    if (!collectedData) return [];

    const facts = [];

    // 提取重要的事實（例如：用戶身份、訪問歷史、旅行計劃等）
    if (collectedData.user_identity) {
      facts.push({
        fact: `用戶身份：${collectedData.user_identity}`,
        confidence: 0.9,
        mentionedAt: new Date().toISOString()
      });
    }

    if (collectedData.region) {
      facts.push({
        fact: `用戶地區：${collectedData.region}`,
        confidence: 0.8,
        mentionedAt: new Date().toISOString()
      });
    }

    if (collectedData.visit_period) {
      facts.push({
        fact: `訪問時間：${collectedData.visit_period}`,
        confidence: 0.8,
        mentionedAt: new Date().toISOString()
      });
    }

    if (collectedData.planned_period) {
      facts.push({
        fact: `計劃時間：${collectedData.planned_period}`,
        confidence: 0.8,
        mentionedAt: new Date().toISOString()
      });
    }

    if (collectedData.favorite_places) {
      facts.push({
        fact: `喜歡的地點：${collectedData.favorite_places}`,
        confidence: 0.7,
        mentionedAt: new Date().toISOString()
      });
    }

    if (collectedData.visited_places) {
      facts.push({
        fact: `去過的地點：${collectedData.visited_places}`,
        confidence: 0.7,
        mentionedAt: new Date().toISOString()
      });
    }

    return facts;
  }
}
