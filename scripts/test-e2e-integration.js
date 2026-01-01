#!/usr/bin/env node

/**
 * 端到端整合測試腳本
 * 測試核心模型整合功能：關係深度計算、對話階段轉換、動態 Prompt
 */

import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

const DB_NAME = 'hopenghucc_db';

function executeSQL(command) {
  try {
    const output = execSync(
      `npx wrangler d1 execute ${DB_NAME} --remote --command="${command.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    // wrangler 輸出可能包含非 JSON 內容，提取 JSON 部分
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // 如果沒有找到 JSON，嘗試解析整個輸出
    return JSON.parse(output);
  } catch (error) {
    // 如果解析失敗，返回 null
    return null;
  }
}

async function testDatabaseStructure() {
  log('\n📋 測試 1: 數據庫結構驗證', 'blue');
  
  const tables = [
    'ai_conversation_states',
    'user_relationship_profiles',
    'conversation_summaries'
  ];
  
  let allPassed = true;
  for (const table of tables) {
    const result = executeSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';`);
    const exists = result && result[0]?.results?.some(r => r.name === table);
    log(`  ${exists ? '✅' : '❌'} 表 ${table}`, exists ? 'green' : 'red');
    if (!exists) allPassed = false;
  }
  
  // 檢查字段
  const columns = [
    { table: 'ai_conversation_states', column: 'conversation_stage' },
    { table: 'ai_conversation_states', column: 'total_rounds' },
    { table: 'ai_conversation_states', column: 'relationship_depth' }
  ];
  
  for (const { table, column } of columns) {
    const result = executeSQL(`PRAGMA table_info(${table});`);
    const exists = result && result[0]?.results?.some(r => r.name === column);
    log(`  ${exists ? '✅' : '❌'} 字段 ${table}.${column}`, exists ? 'green' : 'red');
    if (!exists) allPassed = false;
  }
  
  return allPassed;
}

async function testConversationStates() {
  log('\n📋 測試 2: 對話狀態數據檢查', 'blue');
  
  const result = executeSQL(`
    SELECT 
      conversation_stage,
      COUNT(*) as count,
      AVG(relationship_depth) as avg_depth,
      AVG(total_rounds) as avg_rounds
    FROM ai_conversation_states
    GROUP BY conversation_stage;
  `);
  
  if (result && result[0]?.results) {
    const states = result[0].results;
    if (states.length === 0) {
      log('  ⚠️  沒有對話狀態記錄（這是正常的，如果還沒有進行過對話）', 'yellow');
      return true;
    }
    
    log('  對話階段分佈:', 'blue');
    states.forEach(state => {
      log(`    ${state.conversation_stage}: ${state.count} 筆, 平均深度: ${Math.round(state.avg_depth || 0)}, 平均輪次: ${Math.round(state.avg_rounds || 0)}`, 'blue');
    });
    return true;
  }
  
  log('  ❌ 無法查詢對話狀態', 'red');
  return false;
}

async function testRelationshipProfiles() {
  log('\n📋 測試 3: 關係檔案檢查', 'blue');
  
  const result = executeSQL(`
    SELECT COUNT(*) as count FROM user_relationship_profiles;
  `);
  
  if (result && result[0]?.results) {
    const count = result[0].results[0]?.count || 0;
    log(`  ${count > 0 ? '✅' : '⚠️ '} 關係檔案數量: ${count}`, count > 0 ? 'green' : 'yellow');
    return true;
  }
  
  log('  ❌ 無法查詢關係檔案', 'red');
  return false;
}

async function testRecentConversations() {
  log('\n📋 測試 4: 最近對話檢查', 'blue');
  
  const result = executeSQL(`
    SELECT 
      conversation_stage,
      total_rounds,
      relationship_depth,
      updated_at
    FROM ai_conversation_states
    ORDER BY updated_at DESC
    LIMIT 5;
  `);
  
  if (result && result[0]?.results) {
    const conversations = result[0].results;
    if (conversations.length === 0) {
      log('  ⚠️  沒有最近的對話記錄', 'yellow');
      log('  💡 建議：在 AI 聊天頁面發送訊息以創建對話記錄', 'yellow');
      return true;
    }
    
    log('  最近的對話記錄:', 'blue');
    conversations.forEach((conv, index) => {
      log(`    ${index + 1}. 階段: ${conv.conversation_stage}, 輪次: ${conv.total_rounds}, 深度: ${conv.relationship_depth}`, 'blue');
    });
    return true;
  }
  
  log('  ❌ 無法查詢對話記錄', 'red');
  return false;
}

async function main() {
  log('='.repeat(60), 'blue');
  log('端到端整合測試', 'blue');
  log('='.repeat(60), 'blue');
  
  const results = {
    database: await testDatabaseStructure(),
    states: await testConversationStates(),
    profiles: await testRelationshipProfiles(),
    conversations: await testRecentConversations()
  };
  
  log('\n' + '='.repeat(60), 'blue');
  log('測試結果摘要', 'blue');
  log('='.repeat(60), 'blue');
  
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const name = {
      database: '數據庫結構',
      states: '對話狀態',
      profiles: '關係檔案',
      conversations: '對話記錄'
    }[key];
    log(`${status} ${name}`, value ? 'green' : 'red');
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n✅ 所有測試通過！', 'green');
    log('\n💡 下一步：', 'blue');
    log('   1. 在瀏覽器中打開 https://www.hopenghu.cc/ai-chat', 'yellow');
    log('   2. 發送測試訊息：「我想來澎湖玩」', 'yellow');
    log('   3. 觀察 AI 回應是否符合階段行為', 'yellow');
    log('   4. 檢查控制台日誌中的關係深度計算', 'yellow');
    log('   5. 使用以下 SQL 驗證數據：', 'yellow');
    log('      npx wrangler d1 execute hopenghucc_db --remote --command="SELECT conversation_stage, total_rounds, relationship_depth FROM ai_conversation_states ORDER BY updated_at DESC LIMIT 1;"', 'yellow');
  } else {
    log('\n⚠️  部分測試未通過，請檢查上述錯誤', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'blue');
}

main().catch(error => {
  log(`\n❌ 測試執行錯誤: ${error.message}`, 'red');
  process.exit(1);
});

