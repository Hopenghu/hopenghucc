#!/usr/bin/env node

/**
 * 安全執行 0037 遷移
 * 檢查欄位是否存在，避免重複添加
 */

import { execSync } from 'child_process';

const DB_NAME = 'hopenghucc_db';
const isRemote = process.argv.includes('--remote');

function executeCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return output;
  } catch (error) {
    return null;
  }
}

function checkColumnExists(tableName, columnName) {
  const flag = isRemote ? '--remote' : '';
  const command = `npx wrangler d1 execute ${DB_NAME} ${flag} --command="PRAGMA table_info(${tableName});"`;
  const output = executeCommand(command);
  
  if (output && output.includes(`"name": "${columnName}"`)) {
    return true;
  }
  return false;
}

async function safeAddColumn(tableName, columnName, columnDef) {
  if (checkColumnExists(tableName, columnName)) {
    console.log(`  ⏭️  欄位 ${tableName}.${columnName} 已存在，跳過`);
    return true;
  }
  
  const flag = isRemote ? '--remote' : '';
  const command = `npx wrangler d1 execute ${DB_NAME} ${flag} --command="ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};"`;
  
  try {
    executeCommand(command);
    console.log(`  ✅ 成功添加欄位 ${tableName}.${columnName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ 添加欄位 ${tableName}.${columnName} 失敗:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 開始安全執行 0037 遷移');
  console.log(`目標環境: ${isRemote ? '遠端' : '本地'}\n`);

  // 檢查並添加 locations 表欄位
  console.log('📋 檢查 locations 表欄位...');
  await safeAddColumn('locations', 'total_visits', 'INTEGER DEFAULT 0');
  await safeAddColumn('locations', 'total_itinerary_uses', 'INTEGER DEFAULT 0');
  await safeAddColumn('locations', 'category', 'TEXT');

  // 檢查並添加 itinerary_items 表欄位
  console.log('\n📋 檢查 itinerary_items 表欄位...');
  await safeAddColumn('itinerary_items', 'status', "TEXT DEFAULT 'planned'");
  await safeAddColumn('itinerary_items', 'notes', 'TEXT');
  await safeAddColumn('itinerary_items', 'estimated_cost', 'REAL');
  await safeAddColumn('itinerary_items', 'updated_at', 'INTEGER');

  // 更新現有記錄
  console.log('\n📋 更新現有記錄...');
  const flag = isRemote ? '--remote' : '';
  try {
    executeCommand(`npx wrangler d1 execute ${DB_NAME} ${flag} --command="UPDATE itinerary_items SET updated_at = created_at WHERE updated_at IS NULL;"`);
    console.log('  ✅ 更新現有記錄完成');
  } catch (error) {
    console.warn('  ⚠️  更新現有記錄時出現警告（可能沒有需要更新的記錄）');
  }

  // 創建索引
  console.log('\n📋 創建索引...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);',
    'CREATE INDEX IF NOT EXISTS idx_locations_total_visits ON locations(total_visits);',
    'CREATE INDEX IF NOT EXISTS idx_locations_total_itinerary_uses ON locations(total_itinerary_uses);',
    'CREATE INDEX IF NOT EXISTS idx_itinerary_items_status ON itinerary_items(status);',
    'CREATE INDEX IF NOT EXISTS idx_itinerary_items_updated_at ON itinerary_items(updated_at);'
  ];

  for (const indexSql of indexes) {
    try {
      executeCommand(`npx wrangler d1 execute ${DB_NAME} ${flag} --command="${indexSql}"`);
      console.log(`  ✅ 索引創建成功`);
    } catch (error) {
      console.warn(`  ⚠️  索引創建警告: ${error.message}`);
    }
  }

  // 創建視圖
  console.log('\n📋 創建統計視圖...');
  const viewSql = `
    CREATE VIEW IF NOT EXISTS location_stats AS
    SELECT 
      l.id,
      l.name,
      l.category,
      l.google_place_id,
      l.latitude,
      l.longitude,
      l.google_rating,
      l.total_visits,
      l.total_itinerary_uses,
      COUNT(DISTINCT ul.user_id) as total_users,
      COUNT(DISTINCT CASE WHEN ul.status = 'visited' THEN ul.user_id END) as visited_users,
      COUNT(DISTINCT CASE WHEN ul.status = 'want_to_visit' THEN ul.user_id END) as want_to_visit_users,
      COUNT(DISTINCT CASE WHEN ul.status = 'favorite' THEN ul.user_id END) as favorite_users,
      AVG(ul.user_rating) as avg_user_rating
    FROM locations l
    LEFT JOIN user_locations ul ON l.id = ul.location_id
    GROUP BY l.id;
  `.replace(/\n/g, ' ').trim();

  try {
    executeCommand(`npx wrangler d1 execute ${DB_NAME} ${flag} --command="${viewSql}"`);
    console.log('  ✅ 統計視圖創建成功');
  } catch (error) {
    console.warn(`  ⚠️  視圖創建警告: ${error.message}`);
  }

  console.log('\n✅ 遷移完成！');
}

main().catch(console.error);

