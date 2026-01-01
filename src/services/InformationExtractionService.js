/**
 * InformationExtractionService - 非結構化資訊提取服務
 * 整合 penghu_ai_core_model.md 的資訊提取策略
 */
export class InformationExtractionService {
  constructor(db, openaiApiKey, geminiApiKey = null) {
    if (!db) {
      throw new Error("Database connection is required for InformationExtractionService.");
    }
    this.db = db;
    this.openaiApiKey = openaiApiKey;
    this.geminiApiKey = geminiApiKey;
    this.openaiApiBaseUrl = "https://api.openai.com/v1/chat/completions";
    this.geminiApiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
  }

  /**
   * 提取使用者訊息中的關鍵資訊
   * @param {string} userMessage - 使用者訊息
   * @param {string} userId - 使用者 ID（可選）
   * @param {string} sessionId - 會話 ID（可選）
   */
  async extractInformation(userMessage, userId = null, sessionId = null) {
    try {
      // 使用 Gemini Pro 進行資訊提取（結構化輸出好）
      if (this.geminiApiKey) {
        return await this.extractWithGemini(userMessage);
      } else if (this.openaiApiKey) {
        return await this.extractWithOpenAI(userMessage);
      } else {
        // 如果沒有 API Key，使用簡單的正則表達式提取
        return this.extractWithRegex(userMessage);
      }
    } catch (error) {
      console.error('[InformationExtractionService] Error extracting information:', error);
      // 回退到簡單提取
      return this.extractWithRegex(userMessage);
    }
  }

  /**
   * 使用 Gemini Pro 提取資訊
   */
  async extractWithGemini(userMessage) {
    const extractionPrompt = `分析以下使用者訊息，提取關鍵資訊：

使用者訊息：${userMessage}

請以JSON格式回傳（只返回JSON，不要其他文字）：
{
  "userType": {
    "type": "resident | visitor | potential_visitor | curious | unknown",
    "confidence": 0.0-1.0,
    "evidence": "string"
  },
  "interests": [
    {
      "interest": "string",
      "confidence": 0.0-1.0
    }
  ],
  "travelPlan": {
    "isPlanning": false,
    "timeframe": null,
    "duration": null
  },
  "emotionalTone": "positive | neutral | negative | excited | worried",
  "needsFollowUp": false,
  "suggestedNextTopic": null
}

只根據明確提到的資訊判斷，不要過度推測。如果沒有明確資訊，使用預設值。`;

    try {
      const url = `${this.geminiApiBaseUrl}?key=${this.geminiApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: extractionPrompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const extractedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      // 嘗試解析 JSON（可能包含 markdown 代碼塊）
      let extractedData;
      try {
        // 移除可能的 markdown 代碼塊標記
        const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.warn('[InformationExtractionService] Failed to parse Gemini response, using regex fallback');
        return this.extractWithRegex(userMessage);
      }

      return this.normalizeExtractedData(extractedData);
    } catch (error) {
      console.error('[InformationExtractionService] Error with Gemini extraction:', error);
      return this.extractWithRegex(userMessage);
    }
  }

  /**
   * 使用 OpenAI 提取資訊
   */
  async extractWithOpenAI(userMessage) {
    const extractionPrompt = `分析以下使用者訊息，提取關鍵資訊：

使用者訊息：${userMessage}

請以JSON格式回傳（只返回JSON，不要其他文字）：
{
  "userType": {
    "type": "resident | visitor | potential_visitor | curious | unknown",
    "confidence": 0.0-1.0,
    "evidence": "string"
  },
  "interests": [
    {
      "interest": "string",
      "confidence": 0.0-1.0
    }
  ],
  "travelPlan": {
    "isPlanning": false,
    "timeframe": null,
    "duration": null
  },
  "emotionalTone": "positive | neutral | negative | excited | worried",
  "needsFollowUp": false,
  "suggestedNextTopic": null
}

只根據明確提到的資訊判斷，不要過度推測。如果沒有明確資訊，使用預設值。`;

    try {
      const response = await fetch(this.openaiApiBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "你是一個資訊提取助手。只返回有效的 JSON 格式，不要添加任何解釋或額外文字。"
            },
            {
              role: "user",
              content: extractionPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const extractedText = data.choices[0]?.message?.content || "{}";
      
      // 嘗試解析 JSON
      let extractedData;
      try {
        const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extractedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.warn('[InformationExtractionService] Failed to parse OpenAI response, using regex fallback');
        return this.extractWithRegex(userMessage);
      }

      return this.normalizeExtractedData(extractedData);
    } catch (error) {
      console.error('[InformationExtractionService] Error with OpenAI extraction:', error);
      return this.extractWithRegex(userMessage);
    }
  }

  /**
   * 使用正則表達式提取資訊（回退方案）
   */
  extractWithRegex(userMessage) {
    const messageLower = userMessage.toLowerCase();
    const extracted = {
      userType: {
        type: 'unknown',
        confidence: 0.5,
        evidence: ''
      },
      interests: [],
      travelPlan: {
        isPlanning: false,
        timeframe: null,
        duration: null
      },
      emotionalTone: 'neutral',
      needsFollowUp: false,
      suggestedNextTopic: null
    };

    // 提取用戶類型
    if (messageLower.includes('居民') || messageLower.includes('住在') || messageLower.includes('在地')) {
      extracted.userType = {
        type: 'resident',
        confidence: 0.8,
        evidence: '提到是居民或住在澎湖'
      };
    } else if (messageLower.includes('來過') || messageLower.includes('去過') || messageLower.includes('之前')) {
      extracted.userType = {
        type: 'visitor',
        confidence: 0.8,
        evidence: '提到來過或去過澎湖'
      };
    } else if (messageLower.includes('想來') || messageLower.includes('計劃') || messageLower.includes('打算')) {
      extracted.userType = {
        type: 'potential_visitor',
        confidence: 0.8,
        evidence: '提到想來或計劃來澎湖'
      };
      extracted.travelPlan.isPlanning = true;
    }

    // 提取興趣關鍵字
    const interestKeywords = {
      'beach': ['海灘', '沙灘', '海水', '游泳', '玩水'],
      'culture': ['文化', '古蹟', '歷史', '廟宇', '天后宮'],
      'food': ['美食', '小吃', '餐廳', '海鮮', '吃'],
      'photography': ['拍照', '攝影', '照片', '風景'],
      'diving': ['潛水', '浮潛', '海底'],
      'nature': ['自然', '風景', '夕陽', '日出', '星空']
    };

    for (const [interest, keywords] of Object.entries(interestKeywords)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        extracted.interests.push({
          interest,
          confidence: 0.7
        });
      }
    }

    // 提取情感語調
    if (messageLower.includes('好') || messageLower.includes('棒') || messageLower.includes('喜歡') || messageLower.includes('期待')) {
      extracted.emotionalTone = 'positive';
    } else if (messageLower.includes('擔心') || messageLower.includes('害怕') || messageLower.includes('不確定')) {
      extracted.emotionalTone = 'worried';
    } else if (messageLower.includes('興奮') || messageLower.includes('期待') || messageLower.includes('開心')) {
      extracted.emotionalTone = 'excited';
    }

    return extracted;
  }

  /**
   * 標準化提取的資料
   */
  normalizeExtractedData(data) {
    return {
      userType: data.userType || {
        type: 'unknown',
        confidence: 0.5,
        evidence: ''
      },
      interests: Array.isArray(data.interests) ? data.interests : [],
      travelPlan: data.travelPlan || {
        isPlanning: false,
        timeframe: null,
        duration: null
      },
      emotionalTone: data.emotionalTone || 'neutral',
      needsFollowUp: data.needsFollowUp || false,
      suggestedNextTopic: data.suggestedNextTopic || null
    };
  }

  /**
   * 更新用戶檔案（根據提取的資訊）
   */
  async updateUserProfile(userId, extractedInfo) {
    if (!userId) return false;

    try {
      // 獲取現有用戶資料
      const user = await this.db.prepare('SELECT interests, user_type FROM users WHERE id = ?').bind(userId).first();
      
      let existingInterests = {};
      if (user?.interests) {
        try {
          existingInterests = JSON.parse(user.interests);
        } catch {
          existingInterests = {};
        }
      }

      // 更新使用者類型（使用高信心度覆蓋）
      if (extractedInfo.userType.confidence > 0.7) {
        let userType = 'traveler';
        if (extractedInfo.userType.type === 'resident') {
          userType = 'local';
        } else if (extractedInfo.userType.type === 'visitor') {
          userType = 'visited_traveler';
        } else if (extractedInfo.userType.type === 'potential_visitor') {
          userType = 'planning_traveler';
        }

        await this.db.prepare('UPDATE users SET user_type = ? WHERE id = ?').bind(userType, userId).run();
      }

      // 累積興趣標籤（去重）
      const currentInterests = existingInterests.interests || [];
      for (const interestItem of extractedInfo.interests) {
        if (interestItem.confidence > 0.6) {
          const interestName = interestItem.interest;
          if (!currentInterests.includes(interestName)) {
            currentInterests.push(interestName);
          }
        }
      }

      // 更新旅行計畫
      if (extractedInfo.travelPlan.isPlanning) {
        existingInterests.travelPlan = extractedInfo.travelPlan;
      }

      // 更新 interests 欄位
      existingInterests.interests = currentInterests;
      await this.db.prepare('UPDATE users SET interests = ? WHERE id = ?')
        .bind(JSON.stringify(existingInterests), userId).run();

      return true;
    } catch (error) {
      console.error('[InformationExtractionService] Error updating user profile:', error);
      return false;
    }
  }
}
