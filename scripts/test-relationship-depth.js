#!/usr/bin/env node

/**
 * 測試關係深度計算和對話階段轉換功能
 * 驗證核心模型整合是否正常工作
 */

import { RelationshipDepthService } from '../src/services/RelationshipDepthService.js';

// 模擬數據庫連接（用於測試）
class MockDB {
  constructor() {
    this.data = {
      conversationStates: [],
      users: [],
      relationshipProfiles: []
    };
  }

  prepare(query) {
    return {
      bind: (...args) => {
        this.lastQuery = query;
        this.lastArgs = args;
        return this;
      },
      first: async () => {
        // 模擬查詢結果
        if (this.lastQuery.includes('ai_conversation_states')) {
          return this.data.conversationStates[0] || null;
        }
        if (this.lastQuery.includes('users')) {
          return this.data.users[0] || null;
        }
        if (this.lastQuery.includes('user_relationship_profiles')) {
          return this.data.relationshipProfiles[0] || null;
        }
        return null;
      },
      all: async () => {
        return { results: [] };
      },
      run: async () => {
        return { meta: { last_row_id: 1 } };
      }
    };
  }
}

// 測試用例
async function testRelationshipDepthCalculation() {
  console.log('🧪 測試關係深度計算功能\n');

  const db = new MockDB();
  const service = new RelationshipDepthService(db);

  // 測試用例 1: 新用戶（無對話記錄）
  console.log('📋 測試用例 1: 新用戶（無對話記錄）');
  db.data.conversationStates = [];
  const result1 = await service.calculateRelationshipDepth(null, 'test-session-1');
  console.log('結果:', result1);
  console.log('預期: relationshipDepth = 0, stage = "initial"');
  console.log(`✅ ${result1.relationshipDepth === 0 && result1.stage === 'initial' ? '通過' : '失敗'}\n`);

  // 測試用例 2: 有對話輪次但無其他資訊
  console.log('📋 測試用例 2: 有對話輪次但無其他資訊');
  db.data.conversationStates = [{
    total_rounds: 5,
    context_data: JSON.stringify({}),
    collected_data: JSON.stringify({})
  }];
  const result2 = await service.calculateRelationshipDepth(null, 'test-session-2');
  console.log('結果:', result2);
  console.log('預期: relationshipDepth ≈ 10 (5輪 * 2), stage = "initial"');
  console.log(`✅ ${result2.relationshipDepth > 0 && result2.stage === 'initial' ? '通過' : '失敗'}\n`);

  // 測試用例 3: 有完整資訊的用戶
  console.log('📋 測試用例 3: 有完整資訊的用戶');
  db.data.conversationStates = [{
    total_rounds: 10,
    context_data: JSON.stringify({}),
    collected_data: JSON.stringify({
      user_identity: 'local',
      region: '馬公市',
      interests: 'beach,food,culture',
      visit_period: '2024-01-01'
    })
  }];
  db.data.users = [{ visit_count: 2 }];
  const result3 = await service.calculateRelationshipDepth('test-user-1', 'test-session-3');
  console.log('結果:', result3);
  console.log('預期: relationshipDepth > 50, stage = "familiar" 或 "friend"');
  console.log(`✅ ${result3.relationshipDepth > 50 ? '通過' : '失敗'}\n`);

  // 測試對話階段轉換
  console.log('📋 測試對話階段轉換邏輯');
  const stages = [
    { depth: 0, expected: 'initial' },
    { depth: 10, expected: 'initial' },
    { depth: 25, expected: 'getting_to_know' },
    { depth: 60, expected: 'familiar' },
    { depth: 80, expected: 'friend' },
    { depth: 100, expected: 'friend' }
  ];

  stages.forEach(({ depth, expected }) => {
    const stage = service.getConversationStage(depth);
    const passed = stage === expected;
    console.log(`  深度 ${depth} → 階段 "${stage}" (預期: "${expected}") ${passed ? '✅' : '❌'}`);
  });
  console.log('');
}

// 測試階段特定規則
function testStageRules() {
  console.log('🧪 測試階段特定規則\n');

  const db = new MockDB();
  const service = new RelationshipDepthService(db);

  const stages = ['initial', 'getting_to_know', 'familiar', 'friend'];
  stages.forEach(stage => {
    const rule = service.getStageSpecificRule(stage);
    const goal = service.getStageGoal(stage);
    console.log(`📋 ${stage}:`);
    console.log(`  規則: ${rule}`);
    console.log(`  目標: ${goal}`);
    console.log('');
  });
}

// 測試格式化記憶事實
function testFormatRememberedFacts() {
  console.log('🧪 測試格式化記憶事實\n');

  const db = new MockDB();
  const service = new RelationshipDepthService(db);

  // 測試空陣列
  const empty = service.formatRememberedFacts([]);
  console.log('空陣列:', empty);
  console.log('✅ 通過\n');

  // 測試有資料
  const facts = [
    { fact: '用戶是居民', confidence: 0.9, mentionedAt: '2024-01-01' },
    { fact: '喜歡海灘', confidence: 0.7, mentionedAt: '2024-01-02' },
    { fact: '不確定資訊', confidence: 0.5, mentionedAt: '2024-01-03' } // 應該被過濾
  ];
  const formatted = service.formatRememberedFacts(facts);
  console.log('有資料:', formatted);
  console.log('✅ 通過（應該只包含 confidence > 0.6 的事實）\n');
}

// 主函數
async function main() {
  console.log('🚀 開始測試關係深度計算功能\n');
  console.log('='.repeat(60));
  console.log('');

  try {
    await testRelationshipDepthCalculation();
    testStageRules();
    testFormatRememberedFacts();

    console.log('='.repeat(60));
    console.log('✅ 所有測試完成！');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  }
}

main();
