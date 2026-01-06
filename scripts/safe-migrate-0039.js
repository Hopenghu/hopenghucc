/**
 * 安全遷移腳本 - 0039_extend_trip_planner_for_booking_and_share
 * 檢查欄位是否存在，避免重複添加
 */

import { execSync } from 'child_process';

const DB_NAME = 'hopenghucc_db';
const IS_REMOTE = process.argv.includes('--remote');

const commands = [
  // 檢查並添加 trip_plan_items 表的欄位
  {
    check: `SELECT COUNT(*) as count FROM pragma_table_info('trip_plan_items') WHERE name='booking_status';`,
    add: `ALTER TABLE trip_plan_items ADD COLUMN booking_status TEXT DEFAULT 'planned';`,
    name: 'booking_status'
  },
  {
    check: `SELECT COUNT(*) as count FROM pragma_table_info('trip_plan_items') WHERE name='booking_url';`,
    add: `ALTER TABLE trip_plan_items ADD COLUMN booking_url TEXT;`,
    name: 'booking_url'
  },
  {
    check: `SELECT COUNT(*) as count FROM pragma_table_info('trip_plan_items') WHERE name='booking_phone';`,
    add: `ALTER TABLE trip_plan_items ADD COLUMN booking_phone TEXT;`,
    name: 'booking_phone'
  },
  {
    check: `SELECT COUNT(*) as count FROM pragma_table_info('trip_plan_items') WHERE name='booking_notes';`,
    add: `ALTER TABLE trip_plan_items ADD COLUMN booking_notes TEXT;`,
    name: 'booking_notes'
  },
  // 檢查並添加 trip_plans 表的欄位
  {
    check: `SELECT COUNT(*) as count FROM pragma_table_info('trip_plans') WHERE name='share_token';`,
    add: `ALTER TABLE trip_plans ADD COLUMN share_token TEXT;`,
    name: 'share_token'
  },
  {
    check: `SELECT COUNT(*) as count FROM pragma_table_info('trip_plans') WHERE name='is_public';`,
    add: `ALTER TABLE trip_plans ADD COLUMN is_public INTEGER DEFAULT 0;`,
    name: 'is_public'
  }
];

const indexCommands = [
  {
    check: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name='idx_trip_plan_items_booking_status';`,
    add: `CREATE INDEX idx_trip_plan_items_booking_status ON trip_plan_items(booking_status);`,
    name: 'idx_trip_plan_items_booking_status'
  },
  {
    check: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name='idx_trip_plans_share_token';`,
    add: `CREATE INDEX idx_trip_plans_share_token ON trip_plans(share_token);`,
    name: 'idx_trip_plans_share_token'
  },
  {
    check: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name='idx_trip_plans_is_public';`,
    add: `CREATE INDEX idx_trip_plans_is_public ON trip_plans(is_public);`,
    name: 'idx_trip_plans_is_public'
  }
];

function executeCommand(command) {
  const remoteFlag = IS_REMOTE ? '--remote' : '';
  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --command "${command}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

function checkColumnExists(checkCommand) {
  const result = executeCommand(checkCommand);
  if (result.success) {
    // 解析輸出，查找 count 值
    const match = result.output.match(/count\s+(\d+)/i);
    if (match) {
      return parseInt(match[1]) > 0;
    }
  }
  return false;
}

async function runMigration() {
  console.log('🚀 開始執行安全遷移 0039');
  console.log(`目標環境: ${IS_REMOTE ? '遠端' : '本地'}`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // 執行欄位添加
  for (const cmd of commands) {
    console.log(`\n📋 檢查欄位: ${cmd.name}`);
    
    const exists = checkColumnExists(cmd.check);
    if (exists) {
      console.log(`   ⏭️  欄位 ${cmd.name} 已存在，跳過`);
      skipCount++;
      continue;
    }

    console.log(`   ➕ 添加欄位: ${cmd.name}`);
    const result = executeCommand(cmd.add);
    
    if (result.success) {
      console.log(`   ✅ 成功添加欄位: ${cmd.name}`);
      successCount++;
    } else {
      console.log(`   ❌ 失敗: ${cmd.name}`);
      console.log(`   錯誤: ${result.error}`);
      errorCount++;
    }
  }

  // 執行索引創建
  for (const cmd of indexCommands) {
    console.log(`\n📋 檢查索引: ${cmd.name}`);
    
    const exists = checkColumnExists(cmd.check);
    if (exists) {
      console.log(`   ⏭️  索引 ${cmd.name} 已存在，跳過`);
      skipCount++;
      continue;
    }

    console.log(`   ➕ 創建索引: ${cmd.name}`);
    const result = executeCommand(cmd.add);
    
    if (result.success) {
      console.log(`   ✅ 成功創建索引: ${cmd.name}`);
      successCount++;
    } else {
      console.log(`   ❌ 失敗: ${cmd.name}`);
      console.log(`   錯誤: ${result.error}`);
      errorCount++;
    }
  }

  // 添加 UNIQUE 約束到 share_token（如果欄位已存在但沒有約束）
  console.log(`\n📋 檢查 share_token UNIQUE 約束`);
  try {
    // 嘗試添加 UNIQUE 約束（如果表已存在，這可能會失敗，但沒關係）
    // SQLite 不支持直接添加 UNIQUE 約束到現有欄位，所以我們跳過這一步
    console.log(`   ⏭️  SQLite 不支持直接添加 UNIQUE 約束，跳過`);
  } catch (error) {
    console.log(`   ⚠️  無法添加 UNIQUE 約束（這通常是正常的）`);
  }

  console.log(`\n📊 遷移結果摘要:`);
  console.log(`   ✅ 成功: ${successCount} 個`);
  console.log(`   ⏭️  跳過: ${skipCount} 個`);
  console.log(`   ❌ 失敗: ${errorCount} 個`);
  console.log(`   📁 總計: ${commands.length + indexCommands.length} 個`);

  if (errorCount === 0) {
    console.log(`\n✅ 遷移完成！`);
  } else {
    console.log(`\n⚠️  有遷移失敗，請檢查錯誤訊息`);
  }
}

runMigration().catch(console.error);

