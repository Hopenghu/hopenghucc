/**
 * Question Analysis Service - 分析問題品質和模式，學習如何問更好的問題
 * 功能：
 * 1. 分析用戶問題的品質
 * 2. 分析AI問的問題的有效性
 * 3. 提取問題模板
 * 4. 改進問題品質
 */
export class QuestionAnalysisService {
  constructor(db) {
    if (!db) {
      throw new Error("Database connection is required for QuestionAnalysisService.");
    }
    this.db = db;
  }

  /**
   * 分析用戶問題
   * @param {string} userQuestion - 用戶問題
   * @param {string} conversationId - 對話ID
   * @param {number} answerQuality - 答案品質分數（0-1），可選
   * @param {string} contextType - 上下文類型（'local', 'visited_traveler', 'planning_traveler', 'merchant'）
   * @returns {Promise<Object>} 分析結果
   */
  async analyzeUserQuestion(userQuestion, conversationId = null, answerQuality = null, contextType = null) {
    try {
      const analysis = {
        question_type: 'user_query',
        category: this.categorizeQuestion(userQuestion),
        intent: this.extractIntent(userQuestion),
        entities: this.extractEntities(userQuestion),
        quality_score: 0,
        clarity: this.assessClarity(userQuestion),
        specificity: this.assessSpecificity(userQuestion),
        completeness: this.assessCompleteness(userQuestion),
        structure: this.assessStructure(userQuestion)
      };

      // 計算總體品質分數
      analysis.quality_score = this.calculateQualityScore(analysis);

      // 如果有答案品質資訊，評估問題是否成功
      if (answerQuality !== null) {
        analysis.led_to_successful_answer = answerQuality > 0.7;
        analysis.answer_quality_score = answerQuality;
      }

      // 儲存到學習表
      const savedId = await this.saveQuestionLearning(
        analysis,
        userQuestion,
        conversationId,
        contextType
      );
      analysis.id = savedId;

      return analysis;
    } catch (error) {
      console.error('[QuestionAnalysisService] Error analyzing user question:', error);
      throw error;
    }
  }

  /**
   * 分析AI問的問題
   * @param {string} aiQuestion - AI問題
   * @param {Object} context - 上下文資訊
   * @param {string} userResponse - 用戶回應（可選）
   * @param {string} conversationId - 對話ID
   * @returns {Promise<Object>} 分析結果
   */
  async analyzeAIQuestion(aiQuestion, context = {}, userResponse = null, conversationId = null) {
    try {
      const analysis = {
        question_type: 'ai_question',
        category: this.categorizeQuestion(aiQuestion),
        intent: this.extractIntent(aiQuestion),
        clarity: this.assessClarity(aiQuestion),
        specificity: this.assessSpecificity(aiQuestion),
        completeness: this.assessCompleteness(aiQuestion),
        context_appropriateness: this.assessContextAppropriateness(aiQuestion, context)
      };

      // 如果有用戶回應，評估問題是否有效
      if (userResponse) {
        analysis.effectiveness = this.assessEffectiveness(aiQuestion, userResponse);
        analysis.led_to_successful_answer = analysis.effectiveness > 0.7;
        analysis.effectiveness_score = analysis.effectiveness;
      }

      // 計算品質分數
      analysis.quality_score = this.calculateQualityScore(analysis);

      // 儲存到學習表
      const savedId = await this.saveQuestionLearning(
        analysis,
        aiQuestion,
        conversationId,
        context.contextType || null
      );
      analysis.id = savedId;

      return analysis;
    } catch (error) {
      console.error('[QuestionAnalysisService] Error analyzing AI question:', error);
      throw error;
    }
  }

  /**
   * 分類問題類型
   * @param {string} question - 問題
   * @returns {string} 問題類別
   */
  categorizeQuestion(question) {
    const q = question.toLowerCase();
    
    if (q.includes('哪裡') || q.includes('地點') || q.includes('位置') || q.includes('在哪') || q.includes('什麼地方')) {
      return 'location';
    }
    if (q.includes('價格') || q.includes('多少錢') || q.includes('費用') || q.includes('消費') || q.includes('價錢')) {
      return 'price';
    }
    if (q.includes('時間') || q.includes('多久') || q.includes('幾點') || q.includes('營業') || q.includes('何時')) {
      return 'time';
    }
    if (q.includes('距離') || q.includes('多遠') || q.includes('怎麼去') || q.includes('路線')) {
      return 'distance';
    }
    if (q.includes('回憶') || q.includes('體驗') || q.includes('感受') || q.includes('分享') || q.includes('去過')) {
      return 'memory';
    }
    if (q.includes('身份') || q.includes('是') || q.includes('居民') || q.includes('旅客') || q.includes('商家')) {
      return 'identity';
    }
    
    return 'general';
  }

  /**
   * 提取意圖
   * @param {string} question - 問題
   * @returns {string} 意圖
   */
  extractIntent(question) {
    const intents = {
      '查詢': ['查', '找', '搜尋', '想知道', '問', '了解'],
      '確認': ['是', '對', '確認', '沒錯', '正確'],
      '分享': ['分享', '告訴', '提供', '給', '說'],
      '比較': ['比較', '哪個', '更好', '推薦', '選擇'],
      '請求': ['請', '幫', '能否', '可以', '能不能']
    };

    const q = question.toLowerCase();
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(kw => q.includes(kw))) {
        return intent;
      }
    }
    return 'unknown';
  }

  /**
   * 提取實體（地點、時間、人物等）
   * @param {string} question - 問題
   * @returns {Object} 實體物件
   */
  extractEntities(question) {
    const entities = {
      locations: [],
      time_periods: [],
      numbers: [],
      people: []
    };

    // 提取數字
    const numberMatches = question.match(/\d+/g);
    if (numberMatches) {
      entities.numbers = numberMatches.map(n => parseInt(n));
    }

    // 提取時間相關詞彙
    const timeKeywords = ['年', '月', '日', '小時', '分鐘', '早上', '下午', '晚上', '季節'];
    const timeMatches = question.match(new RegExp(`[\\u4e00-\\u9fa5]*[${timeKeywords.join('|')}][\\u4e00-\\u9fa5]*`, 'g'));
    if (timeMatches) {
      entities.time_periods = timeMatches;
    }

    // 地點名稱需要通過LocationService來識別，這裡先留空
    // 未來可以整合地點識別服務

    return entities;
  }

  /**
   * 計算問題品質分數
   * @param {Object} analysis - 分析結果
   * @returns {number} 品質分數（0-1）
   */
  calculateQualityScore(analysis) {
    let score = 0.5; // 基礎分數

    // 清晰度（0-0.3）
    if (analysis.clarity !== undefined) {
      score += analysis.clarity * 0.3;
    }

    // 具體性（0-0.3）
    if (analysis.specificity !== undefined) {
      score += analysis.specificity * 0.3;
    }

    // 完整性（0-0.2）
    if (analysis.completeness !== undefined) {
      score += analysis.completeness * 0.2;
    }

    // 結構性（0-0.2）
    if (analysis.structure !== undefined) {
      score += analysis.structure * 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * 評估清晰度
   * @param {string} question - 問題
   * @returns {number} 清晰度分數（0-1）
   */
  assessClarity(question) {
    const unclearPatterns = ['那個', '這個', '那個地方', '某個', '某處'];
    const hasUnclear = unclearPatterns.some(pattern => question.includes(pattern));
    
    const length = question.length;
    const tooShort = length < 5;
    const tooLong = length > 200;
    
    let score = 1.0;
    if (hasUnclear) score -= 0.3;
    if (tooShort) score -= 0.2;
    if (tooLong) score -= 0.1;
    
    return Math.max(score, 0);
  }

  /**
   * 評估具體性
   * @param {string} question - 問題
   * @returns {number} 具體性分數（0-1）
   */
  assessSpecificity(question) {
    const specificIndicators = ['哪個', '什麼', '多少', '何時', '哪裡', '誰', '如何', '為什麼'];
    const hasSpecific = specificIndicators.some(indicator => question.includes(indicator));
    
    // 檢查是否有具體的名詞或地點名稱
    const hasLocation = question.match(/[\u4e00-\u9fa5]{2,}/g)?.length > 0;
    
    // 檢查是否有數字（表示具體）
    const hasNumber = /\d+/.test(question);
    
    let score = 0.5;
    if (hasSpecific) score += 0.2;
    if (hasLocation) score += 0.2;
    if (hasNumber) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 評估完整性
   * @param {string} question - 問題
   * @returns {number} 完整性分數（0-1）
   */
  assessCompleteness(question) {
    const hasContext = question.length > 10;
    const hasQuestionMark = question.includes('？') || question.includes('?');
    const hasSubject = question.length > 5; // 有主詞
    
    let score = 0.5;
    if (hasContext) score += 0.2;
    if (hasQuestionMark) score += 0.2;
    if (hasSubject) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 評估結構性
   * @param {string} question - 問題
   * @returns {number} 結構性分數（0-1）
   */
  assessStructure(question) {
    const hasQuestionWord = /(什麼|哪裡|哪個|多少|何時|怎麼|為什麼|如何)/.test(question);
    const isCompleteSentence = question.length > 5 && (question.includes('？') || question.includes('?'));
    const hasProperFormat = !question.startsWith('？') && !question.endsWith('？') || question.includes('？');
    
    let score = 0.5;
    if (hasQuestionWord) score += 0.3;
    if (isCompleteSentence) score += 0.2;
    if (hasProperFormat) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 評估上下文適切性（AI問題）
   * @param {string} question - AI問題
   * @param {Object} context - 上下文
   * @returns {number} 適切性分數（0-1）
   */
  assessContextAppropriateness(question, context) {
    // 檢查問題是否與上下文相關
    let score = 0.7; // 基礎分數
    
    // 如果上下文中有地點資訊，檢查問題是否提到
    if (context.location_name && question.includes(context.location_name)) {
      score += 0.2;
    }
    
    // 如果上下文中有用戶類型，檢查問題是否適合
    if (context.userType) {
      const isAppropriate = this.checkQuestionAppropriateness(question, context.userType);
      if (isAppropriate) score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 檢查問題是否適合用戶類型
   * @param {string} question - 問題
   * @param {string} userType - 用戶類型
   * @returns {boolean} 是否適合
   */
  checkQuestionAppropriateness(question, userType) {
    const q = question.toLowerCase();
    
    if (userType === 'merchant') {
      // 商家相關問題
      return q.includes('商家') || q.includes('營業') || q.includes('產品') || q.includes('價格');
    } else if (userType === 'local') {
      // 居民相關問題
      return q.includes('居住') || q.includes('區域') || q.includes('在地');
    } else if (userType === 'traveler') {
      // 旅客相關問題
      return q.includes('旅遊') || q.includes('景點') || q.includes('回憶') || q.includes('體驗');
    }
    
    return true; // 預設適合
  }

  /**
   * 評估問題有效性（AI問的問題是否獲得有效回答）
   * @param {string} aiQuestion - AI問題
   * @param {string} userResponse - 用戶回應
   * @returns {number} 有效性分數（0-1）
   */
  assessEffectiveness(aiQuestion, userResponse) {
    const responseLength = userResponse.length;
    const isComplete = responseLength > 5;
    const isRelevant = this.checkRelevance(aiQuestion, userResponse);
    const isInformative = responseLength > 10; // 有足夠資訊
    
    let score = 0.5;
    if (isComplete) score += 0.2;
    if (isRelevant) score += 0.2;
    if (isInformative) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 檢查相關性
   * @param {string} question - 問題
   * @param {string} response - 回應
   * @returns {boolean} 是否相關
   */
  checkRelevance(question, response) {
    const questionKeywords = this.extractKeywords(question);
    const responseKeywords = this.extractKeywords(response);
    
    if (questionKeywords.length === 0) return true;
    
    const commonKeywords = questionKeywords.filter(kw => responseKeywords.includes(kw));
    return commonKeywords.length > 0;
  }

  /**
   * 提取關鍵字
   * @param {string} text - 文字
   * @returns {Array<string>} 關鍵字陣列
   */
  extractKeywords(text) {
    // 提取中文詞彙（2個字以上）
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    return chineseWords;
  }

  /**
   * 儲存問題學習記錄
   * @param {Object} analysis - 分析結果
   * @param {string} originalQuestion - 原始問題
   * @param {string} conversationId - 對話ID
   * @param {string} contextType - 上下文類型
   * @returns {Promise<string>} 儲存的記錄ID
   */
  async saveQuestionLearning(analysis, originalQuestion, conversationId = null, contextType = null) {
    try {
      const result = await this.db.prepare(
        `INSERT INTO ai_question_learning (
          original_question, question_type, question_category,
          extracted_intent, extracted_entities, question_quality_score,
          led_to_successful_answer, answer_quality_score,
          conversation_id, context_type,
          clarity_score, specificity_score, completeness_score, effectiveness_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        originalQuestion,
        analysis.question_type,
        analysis.category || 'general',
        JSON.stringify(analysis.intent || 'unknown'),
        JSON.stringify(analysis.entities || {}),
        analysis.quality_score || 0,
        analysis.led_to_successful_answer || false,
        analysis.answer_quality_score || null,
        conversationId,
        contextType,
        analysis.clarity || 0,
        analysis.specificity || 0,
        analysis.completeness || 0,
        analysis.effectiveness_score || analysis.effectiveness || 0
      ).run();

      return result.meta.last_row_id ? String(result.meta.last_row_id) : null;
    } catch (error) {
      console.error('[QuestionAnalysisService] Error saving question learning:', error);
      throw error;
    }
  }

  /**
   * 從學習記錄中提取問題模板
   * @param {number} minSuccessRate - 最低成功率（0-1）
   * @param {number} minQualityScore - 最低品質分數（0-1）
   * @returns {Promise<Array>} 提取的模板陣列
   */
  async extractQuestionTemplates(minSuccessRate = 0.7, minQualityScore = 0.7) {
    try {
      // 查詢成功率高於閾值的問題
      const successfulQuestions = await this.db.prepare(
        `SELECT original_question, question_category, context_type, 
                question_quality_score, led_to_successful_answer
         FROM ai_question_learning
         WHERE led_to_successful_answer = true 
           AND question_quality_score >= ?
         ORDER BY question_quality_score DESC
         LIMIT 100`
      ).bind(minQualityScore).all();

      // 分析問題模式，提取模板
      const templates = [];
      const templateMap = new Map();

      for (const q of successfulQuestions.results || []) {
        const template = this.createTemplateFromQuestion(
          q.original_question,
          q.question_category,
          q.context_type
        );
        
        if (template) {
          const key = `${template.template_type}_${template.context_type || 'general'}`;
          
          if (!templateMap.has(key)) {
            templateMap.set(key, {
              ...template,
              success_count: 1,
              total_quality: template.quality_score || 0
            });
          } else {
            const existing = templateMap.get(key);
            existing.success_count += 1;
            existing.total_quality += template.quality_score || 0;
          }
        }
      }

      // 計算成功率和平均品質
      for (const [key, template] of templateMap.entries()) {
        const successRate = template.success_count / (successfulQuestions.results?.length || 1);
        const avgQuality = template.total_quality / template.success_count;
        
        if (successRate >= minSuccessRate) {
          templates.push({
            template_text: template.template_text,
            template_type: template.template_type,
            context_type: template.context_type,
            variables: template.variables,
            success_rate: successRate,
            average_question_quality: avgQuality
          });
        }
      }

      // 儲存模板
      for (const template of templates) {
        await this.saveQuestionTemplate(template);
      }

      return templates;
    } catch (error) {
      console.error('[QuestionAnalysisService] Error extracting templates:', error);
      throw error;
    }
  }

  /**
   * 從問題創建模板
   * @param {string} question - 問題
   * @param {string} category - 問題類別
   * @param {string} contextType - 上下文類型
   * @returns {Object} 模板物件
   */
  createTemplateFromQuestion(question, category, contextType = null) {
    // 簡單的模板提取：識別可能的變數位置
    // 未來可以使用更智能的NLP來識別變數
    
    let templateText = question;
    const variables = [];

    // 識別常見的變數模式
    // 地點名稱（通常是被問的對象）
    if (category === 'location' || category === 'price' || category === 'time') {
      // 可以提取地點名稱作為變數，但這裡先保持原樣
      // 未來可以整合地點識別服務
    }

    // 時間相關變數
    if (question.includes('什麼時候') || question.includes('何時')) {
      variables.push('time_period');
    }

    // 地點相關變數
    if (question.includes('哪裡') || question.includes('哪個地方')) {
      variables.push('location_name');
    }

    return {
      template_text: templateText,
      template_type: category,
      context_type: contextType,
      variables: variables,
      quality_score: 0.8 // 預設品質分數
    };
  }

  /**
   * 儲存問題模板
   * @param {Object} template - 模板物件
   * @returns {Promise<string>} 模板ID
   */
  async saveQuestionTemplate(template) {
    try {
      // 檢查是否已存在類似模板
      const existing = await this.db.prepare(
        `SELECT id, usage_count, success_rate, average_question_quality
         FROM ai_question_templates 
         WHERE template_text = ? AND template_type = ? AND (context_type = ? OR (context_type IS NULL AND ? IS NULL))`
      ).bind(
        template.template_text,
        template.template_type,
        template.context_type || null,
        template.context_type || null
      ).first();

      if (existing) {
        // 更新使用次數和成功率
        const newUsageCount = existing.usage_count + 1;
        const newSuccessRate = (existing.success_rate * existing.usage_count + template.success_rate) / newUsageCount;
        const newAvgQuality = (existing.average_question_quality * existing.usage_count + template.average_question_quality) / newUsageCount;

        await this.db.prepare(
          `UPDATE ai_question_templates 
           SET usage_count = ?,
               success_rate = ?,
               average_question_quality = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).bind(newUsageCount, newSuccessRate, newAvgQuality, existing.id).run();

        return existing.id;
      } else {
        // 新增模板
        const result = await this.db.prepare(
          `INSERT INTO ai_question_templates (
            template_text, template_type, context_type, variables, 
            success_rate, usage_count, average_question_quality
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          template.template_text,
          template.template_type,
          template.context_type || null,
          JSON.stringify(template.variables || []),
          template.success_rate || 0,
          1,
          template.average_question_quality || 0
        ).run();

        return result.meta.last_row_id ? String(result.meta.last_row_id) : null;
      }
    } catch (error) {
      console.error('[QuestionAnalysisService] Error saving template:', error);
      throw error;
    }
  }

  /**
   * 獲取最佳問題模板
   * @param {string} category - 問題類別
   * @param {string} contextType - 上下文類型（可選）
   * @returns {Promise<Object|null>} 最佳模板
   */
  async getBestQuestionTemplate(category, contextType = null) {
    try {
      let query = `SELECT * FROM ai_question_templates 
                   WHERE template_type = ? AND is_active = true`;
      const params = [category];

      if (contextType) {
        query += ` AND (context_type = ? OR context_type IS NULL)`;
        params.push(contextType);
      }

      query += ` ORDER BY success_rate DESC, average_question_quality DESC, usage_count DESC LIMIT 1`;

      const result = await this.db.prepare(query).bind(...params).first();
      return result;
    } catch (error) {
      console.error('[QuestionAnalysisService] Error getting best template:', error);
      return null;
    }
  }

  /**
   * 改進問題
   * @param {string} originalQuestion - 原始問題
   * @param {Object} context - 上下文
   * @returns {Promise<string>} 改進後的問題
   */
  async improveQuestion(originalQuestion, context) {
    try {
      // 分析原始問題
      const analysis = await this.analyzeUserQuestion(originalQuestion, null, null, context.contextType);
      
      // 獲取最佳模板
      const bestTemplate = await this.getBestQuestionTemplate(analysis.category, context.contextType);
      
      if (bestTemplate) {
        // 使用模板改進問題
        const improved = this.applyTemplate(bestTemplate, context);
        
        // 記錄改進
        await this.recordImprovement(analysis.id, originalQuestion, improved, analysis);
        
        return improved;
      }
      
      return originalQuestion;
    } catch (error) {
      console.error('[QuestionAnalysisService] Error improving question:', error);
      return originalQuestion;
    }
  }

  /**
   * 應用模板
   * @param {Object} template - 模板物件
   * @param {Object} context - 上下文
   * @returns {string} 應用模板後的問題
   */
  applyTemplate(template, context) {
    let question = template.template_text;
    
    // 替換變數
    const variables = JSON.parse(template.variables || '[]');
    for (const variable of variables) {
      if (context[variable]) {
        question = question.replace(`{${variable}}`, context[variable]);
      }
    }
    
    return question;
  }

  /**
   * 記錄改進
   * @param {string} originalQuestionId - 原始問題ID
   * @param {string} originalQuestion - 原始問題
   * @param {string} improvedQuestion - 改進後的問題
   * @param {Object} analysis - 分析結果
   * @returns {Promise<void>}
   */
  async recordImprovement(originalQuestionId, originalQuestion, improvedQuestion, analysis) {
    try {
      if (!originalQuestionId) return;

      await this.db.prepare(
        `INSERT INTO ai_question_improvements (
          original_question_id, improved_question, improvement_reason,
          improvement_type, before_score, after_score
        ) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        originalQuestionId,
        improvedQuestion,
        'Applied best template from learning',
        'structure',
        analysis.quality_score || 0,
        (analysis.quality_score || 0) + 0.1 // 假設改進後分數提升
      ).run();
    } catch (error) {
      console.error('[QuestionAnalysisService] Error recording improvement:', error);
    }
  }

  /**
   * 評估答案品質（簡單版本）
   * @param {string} answer - 答案
   * @param {string} question - 問題
   * @returns {number} 品質分數（0-1）
   */
  evaluateAnswerQuality(answer, question) {
    if (!answer || answer.length < 5) return 0.2;
    
    let score = 0.5;
    
    // 答案長度
    if (answer.length > 20) score += 0.2;
    if (answer.length > 50) score += 0.1;
    
    // 相關性
    const questionKeywords = this.extractKeywords(question);
    const answerKeywords = this.extractKeywords(answer);
    const commonKeywords = questionKeywords.filter(kw => answerKeywords.includes(kw));
    if (commonKeywords.length > 0) score += 0.2;
    
    return Math.min(score, 1.0);
  }
}

