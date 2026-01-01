#!/usr/bin/env node

/**
 * 快速驗證數據庫結構
 * 使用簡單的 SQL 查詢驗證核心模型整合所需的表和字段
 */

import { execSync } from 'child_process';

const DB_NAME = 'hopenghucc_db';

function executeCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return output;
  } catch (error) {
    return null;
  }
}

function checkTable(tableName, isRemote = false) {
  const flag = isRemote ? '--remote' : '';
  const command = `npx wrangler d1 execute ${DB_NAME} ${flag} --command="SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';"`;
  const output = executeCommand(command);
  
  if (output && output.includes(`"name": "${tableName}"`)) {
    return true;
  }
  return false;
}

function checkColumn(tableName, columnName, isRemote = false) {
  const flag = isRemote ? '--remote' : '';
  const command = `npx wrangler d1 execute ${DB_NAME} ${flag} --command="PRAGMA table_info(${tableName});"`;
  const output = executeCommand(command);
  
  if (output && output.includes(`"name": "${columnName}"`)) {
    return true;
  }
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const isRemote = args.includes('--remote');

  console.log('🔍 快速驗證數據庫結構');
  console.log(`目標環境: ${isRemote ? '遠端' : '本地'}`);
  console.log('='.repeat(60));
  console.log('');

  let allPassed = true;

  // 檢查表
  console.log('📋 檢查表:');
  const tables = [
    'user_relationship_profiles',
    'conversation_summaries'
  ];

  for (const table of tables) {
    const exists = checkTable(table, isRemote);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    if (!exists) allPassed = false;
  }

  // 檢查字段
  console.log('\n📋 檢查字段:');
  
  const aiConversationStatesColumns = [
    'conversation_stage',
    'total_rounds',
    'relationship_depth'
  ];

  console.log('  ai_conversation_states:');
  for (const column of aiConversationStatesColumns) {
    const exists = checkColumn('ai_conversation_states', column, isRemote);
    console.log(`    ${exists ? '✅' : '❌'} ${column}`);
    if (!exists) allPassed = false;
  }

  const aiConversationsColumns = ['metadata'];
  console.log('  ai_conversations:');
  for (const column of aiConversationsColumns) {
    const exists = checkColumn('ai_conversations', column, isRemote);
    console.log(`    ${exists ? '✅' : '❌'} ${column}`);
    if (!exists) allPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ 所有檢查通過！數據庫結構正確。');
    console.log('\n💡 下一步：開始功能測試');
    console.log('   1. 在 AI 聊天頁面發送訊息');
    console.log('   2. 檢查關係深度是否正確計算');
    console.log('   3. 驗證對話階段是否正確轉換');
  } else {
    console.log('❌ 部分檢查失敗，請檢查數據庫結構。');
    console.log('\n💡 建議：');
    console.log('   1. 確認遷移文件已執行');
    console.log('   2. 檢查 wrangler 配置');
    process.exit(1);
  }
}

main();
