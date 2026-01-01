#!/usr/bin/env node

/**
 * 驗證數據庫結構
 * 檢查核心模型整合所需的表和字段是否存在
 */

import { execSync } from 'child_process';

const DB_NAME = 'hopenghucc_db';

// 檢查表結構的 SQL 查詢
const CHECK_QUERIES = {
  'ai_conversation_states': `
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='ai_conversation_states'
  `,
  'ai_conversations': `
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='ai_conversations'
  `,
  'user_relationship_profiles': `
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='user_relationship_profiles'
  `,
  'conversation_summaries': `
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='conversation_summaries'
  `
};

// 檢查字段的 SQL 查詢
const CHECK_COLUMNS = {
  'ai_conversation_states': [
    'conversation_stage',
    'total_rounds',
    'relationship_depth'
  ],
  'ai_conversations': [
    'metadata'
  ]
};

// 檢查索引
const CHECK_INDEXES = [
  'idx_ai_conversation_states_stage',
  'idx_ai_conversation_states_relationship_depth',
  'idx_ai_conversations_metadata',
  'idx_user_relationship_profiles_user_id',
  'idx_user_relationship_profiles_stage',
  'idx_conversation_summaries_user_id'
];

async function executeQuery(query, isRemote = false) {
  try {
    const command = `npx wrangler d1 execute ${DB_NAME} --command="${query.replace(/"/g, '\\"')}" ${isRemote ? '--remote' : ''}`;
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    
    // wrangler 輸出是 JSON 數組，找到最後的 JSON 數組
    const lines = output.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('[')) {
        try {
          const parsed = JSON.parse(line);
          // wrangler 返回格式: [{ results: [...], success: true, ... }]
          if (Array.isArray(parsed) && parsed[0]?.results !== undefined) {
            return parsed[0];
          }
          return parsed;
        } catch (e) {
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    // 忽略錯誤，返回 null
    return null;
  }
}

async function checkTable(tableName, isRemote = false) {
  console.log(`\n📋 檢查表: ${tableName}`);
  const result = await executeQuery(CHECK_QUERIES[tableName], isRemote);
  
  if (result && result.results && result.results.length > 0 && result.results[0].sql) {
    console.log(`✅ 表 ${tableName} 存在`);
    return true;
  } else {
    console.log(`❌ 表 ${tableName} 不存在`);
    return false;
  }
}

async function checkColumns(tableName, columns, isRemote = false) {
  console.log(`\n📋 檢查表 ${tableName} 的字段:`);
  let allExist = true;

  for (const column of columns) {
    const query = `SELECT COUNT(*) as count FROM pragma_table_info('${tableName}') WHERE name='${column}'`;
    const result = await executeQuery(query, isRemote);
    
    if (result && result.results && result.results[0]?.count > 0) {
      console.log(`  ✅ ${column} - 存在`);
    } else {
      console.log(`  ❌ ${column} - 不存在`);
      allExist = false;
    }
  }

  return allExist;
}

async function checkIndexes(isRemote = false) {
  console.log(`\n📋 檢查索引:`);
  let allExist = true;

  for (const indexName of CHECK_INDEXES) {
    const query = `SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name='${indexName}'`;
    const result = await executeQuery(query, isRemote);
    
    if (result && result.results && result.results[0]?.count > 0) {
      console.log(`  ✅ ${indexName} - 存在`);
    } else {
      console.log(`  ❌ ${indexName} - 不存在`);
      allExist = false;
    }
  }

  return allExist;
}

async function main() {
  const args = process.argv.slice(2);
  const isRemote = args.includes('--remote');

  console.log('🔍 開始驗證數據庫結構');
  console.log(`目標環境: ${isRemote ? '遠端' : '本地'}`);
  console.log('='.repeat(60));

  let allPassed = true;

  // 檢查表
  for (const tableName of Object.keys(CHECK_QUERIES)) {
    const exists = await checkTable(tableName, isRemote);
    if (!exists) allPassed = false;
  }

  // 檢查字段
  for (const [tableName, columns] of Object.entries(CHECK_COLUMNS)) {
    const allExist = await checkColumns(tableName, columns, isRemote);
    if (!allExist) allPassed = false;
  }

  // 檢查索引
  const indexesExist = await checkIndexes(isRemote);
  if (!indexesExist) allPassed = false;

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ 所有檢查通過！數據庫結構正確。');
  } else {
    console.log('❌ 部分檢查失敗，請檢查數據庫結構。');
    process.exit(1);
  }
}

main();
