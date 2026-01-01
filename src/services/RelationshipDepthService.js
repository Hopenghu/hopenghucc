/**
 * RelationshipDepthService - 關係深度計算和對話階段管理
 * 整合 penghu_ai_core_model.md 的核心概念
 */
export class RelationshipDepthService {
  constructor(db) {
    if (!db) {
      throw new Error("Database connection is required for RelationshipDepthService.");
    }
    this.db = db;
  }

  /**
   * 計算關係深度（0-100）
   * 根據核心模型的公式：
   * - 對話輪次貢獻 (40%)
   * - 資訊完整度 (30%)
   * - 偏好明確度 (20%)
   * - 回訪次數 (10%)
   */
  async calculateRelationshipDepth(userId, sessionId) {
    try {
      // 獲取對話狀態
      const conversationState = await this.db.prepare(
        `SELECT * FROM ai_conversation_states 
         WHERE session_id = ? AND (user_id = ? OR (user_id IS NULL AND ? IS NULL))
         ORDER BY updated_at DESC LIMIT 1`
      ).bind(sessionId, userId || null, userId || null).first();

      if (!conversationState) {
        return {
          relationshipDepth: 0,
          stage: 'initial',
          totalRounds: 0
        };
      }

      const totalRounds = conversationState.total_rounds || 0;
      const contextData = conversationState.context_data ? JSON.parse(conversationState.context_data) : {};
      const collectedData = conversationState.collected_data ? JSON.parse(conversationState.collected_data) : {};

      // 1. 對話輪次貢獻 (40%)
      const roundsScore = Math.min(totalRounds * 2, 40);

      // 2. 資訊完整度 (30%)
      // 計算已收集的身份資訊完整度
      const identityFields = ['user_identity', 'region', 'interests', 'visit_period', 'planned_period'];
      const filledFields = identityFields.filter(field => collectedData[field] && collectedData[field].trim() !== '').length;
      const profileCompleteness = filledFields / identityFields.length;
      const completenessScore = profileCompleteness * 30;

      // 3. 偏好明確度 (20%)
      // 計算興趣數量
      let preferenceCount = 0;
      if (collectedData.interests) {
        // 如果是字符串，嘗試解析或拆分
        if (typeof collectedData.interests === 'string') {
          try {
            const parsed = JSON.parse(collectedData.interests);
            preferenceCount = Array.isArray(parsed) ? parsed.length : 1;
          } catch {
            // 如果不是 JSON，按逗號拆分
            preferenceCount = collectedData.interests.split(',').filter(i => i.trim()).length;
          }
        } else if (Array.isArray(collectedData.interests)) {
          preferenceCount = collectedData.interests.length;
        } else {
          preferenceCount = 1;
        }
      }
      const preferenceScore = Math.min(preferenceCount * 4, 20);

      // 4. 回訪次數 (10%)
      // 獲取用戶回訪次數（從 users 表或會話記錄）
      let revisitCount = 0;
      if (userId) {
        try {
          const user = await this.db.prepare(
            'SELECT visit_count FROM users WHERE id = ?'
          ).bind(userId).first();
          revisitCount = user?.visit_count || 0;
        } catch (error) {
          console.warn('[RelationshipDepthService] Error getting revisit count:', error);
        }
      }
      const revisitScore = Math.min(revisitCount * 2, 10);

      // 計算總分
      const relationshipDepth = Math.min(
        roundsScore + completenessScore + preferenceScore + revisitScore,
        100
      );

      // 根據關係深度確定對話階段
      const stage = this.getConversationStage(relationshipDepth);

      return {
        relationshipDepth: Math.round(relationshipDepth * 10) / 10, // 保留一位小數
        stage,
        totalRounds,
        scores: {
          rounds: roundsScore,
          completeness: completenessScore,
          preference: preferenceScore,
          revisit: revisitScore
        }
      };
    } catch (error) {
      console.error('[RelationshipDepthService] Error calculating relationship depth:', error);
      return {
        relationshipDepth: 0,
        stage: 'initial',
        totalRounds: 0
      };
    }
  }

  /**
   * 根據關係深度獲取對話階段
   */
  getConversationStage(relationshipDepth) {
    if (relationshipDepth < 20) {
      return 'initial';
    } else if (relationshipDepth < 50) {
      return 'getting_to_know';
    } else if (relationshipDepth < 75) {
      return 'familiar';
    } else {
      return 'friend';
    }
  }

  /**
   * 獲取或創建用戶關係檔案
   */
  async getOrCreateRelationshipProfile(userId, sessionId) {
    try {
      let profile = await this.db.prepare(
        `SELECT * FROM user_relationship_profiles 
         WHERE user_id = ? AND (session_id = ? OR (session_id IS NULL AND ? IS NULL))
         ORDER BY updated_at DESC LIMIT 1`
      ).bind(userId || null, sessionId || null, sessionId || null).first();

      if (!profile) {
        const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.db.prepare(
          `INSERT INTO user_relationship_profiles 
           (id, user_id, session_id, relationship_depth, conversation_stage, total_rounds, first_interaction_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          profileId,
          userId || null,
          sessionId || null,
          0.0,
          'initial',
          0
        ).run();

        profile = await this.db.prepare(
          'SELECT * FROM user_relationship_profiles WHERE id = ?'
        ).bind(profileId).first();
      }

      return profile;
    } catch (error) {
      console.error('[RelationshipDepthService] Error getting relationship profile:', error);
      throw error;
    }
  }

  /**
   * 更新關係檔案
   */
  async updateRelationshipProfile(profileId, updates) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (updates.relationship_depth !== undefined) {
        updateFields.push('relationship_depth = ?');
        updateValues.push(updates.relationship_depth);
      }
      if (updates.conversation_stage !== undefined) {
        updateFields.push('conversation_stage = ?');
        updateValues.push(updates.conversation_stage);
      }
      if (updates.total_rounds !== undefined) {
        updateFields.push('total_rounds = ?');
        updateValues.push(updates.total_rounds);
      }
      if (updates.profile_completeness !== undefined) {
        updateFields.push('profile_completeness = ?');
        updateValues.push(updates.profile_completeness);
      }
      if (updates.preference_count !== undefined) {
        updateFields.push('preference_count = ?');
        updateValues.push(updates.preference_count);
      }
      if (updates.revisit_count !== undefined) {
        updateFields.push('revisit_count = ?');
        updateValues.push(updates.revisit_count);
      }
      if (updates.remembered_facts !== undefined) {
        updateFields.push('remembered_facts = ?');
        updateValues.push(JSON.stringify(updates.remembered_facts));
      }

      updateFields.push('last_interaction_at = datetime(\'now\')');
      updateFields.push('updated_at = datetime(\'now\')');
      updateValues.push(profileId);

      if (updateFields.length > 0) {
        await this.db.prepare(
          `UPDATE user_relationship_profiles 
           SET ${updateFields.join(', ')} 
           WHERE id = ?`
        ).bind(...updateValues).run();
      }

      return true;
    } catch (error) {
      console.error('[RelationshipDepthService] Error updating relationship profile:', error);
      throw error;
    }
  }

  /**
   * 增加對話輪次
   */
  async incrementConversationRounds(sessionId, userId) {
    try {
      // 更新對話狀態
      await this.db.prepare(
        `UPDATE ai_conversation_states 
         SET total_rounds = total_rounds + 1,
             updated_at = datetime('now')
         WHERE session_id = ? AND (user_id = ? OR (user_id IS NULL AND ? IS NULL))`
      ).bind(sessionId, userId || null, userId || null).run();

      // 更新關係檔案
      const profile = await this.getOrCreateRelationshipProfile(userId, sessionId);
      if (profile) {
        await this.updateRelationshipProfile(profile.id, {
          total_rounds: (profile.total_rounds || 0) + 1
        });
      }

      return true;
    } catch (error) {
      console.error('[RelationshipDepthService] Error incrementing rounds:', error);
      return false;
    }
  }

  /**
   * 獲取階段特定規則
   */
  getStageSpecificRule(stage) {
    const rules = {
      'initial': '專注於確認對方與澎湖的關係，不提供建議',
      'getting_to_know': '透過聊天逐步了解興趣，避免直接詢問偏好清單',
      'familiar': '可以開始給予初步建議，但要基於已知的偏好',
      'friend': '像老朋友一樣互動，主動關心，提供深度個人化建議'
    };
    return rules[stage] || rules['initial'];
  }

  /**
   * 獲取階段目標
   */
  getStageGoal(stage) {
    const goals = {
      'initial': '確認使用者身份（居民/來過/想來），建立初步連結',
      'getting_to_know': '了解基本偏好和興趣，自然探索，不過度提問',
      'familiar': '深化理解，記得先前對話，提供初步建議',
      'friend': '自然互動，主動關心，提供深度個人化建議'
    };
    return goals[stage] || goals['initial'];
  }

  /**
   * 格式化記憶的重要資訊
   */
  formatRememberedFacts(rememberedFacts) {
    if (!rememberedFacts || !Array.isArray(rememberedFacts) || rememberedFacts.length === 0) {
      return '（目前還沒有特別記住的重要資訊）';
    }

    return rememberedFacts
      .filter(fact => fact.confidence > 0.6)
      .map(fact => `- ${fact.fact}`)
      .join('\n');
  }
}
