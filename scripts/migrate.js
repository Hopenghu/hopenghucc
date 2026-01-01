#!/usr/bin/env node

/**
 * 自動化資料庫遷移腳本
 * 執行所有 migrations 目錄下的 SQL 檔案
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const MIGRATIONS_DIR = './migrations';
const DB_NAME = 'hopenghucc_db';

async function getMigrationFiles() {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort(); // 按檔名排序，確保執行順序
  } catch (error) {
    console.error('❌ 無法讀取 migrations 目錄:', error.message);
    process.exit(1);
  }
}

async function executeMigration(filename, isRemote = false) {
  const filepath = join(MIGRATIONS_DIR, filename);
  
  try {
    console.log(`🔄 執行遷移: ${filename}`);
    
    const command = `npx wrangler d1 execute ${DB_NAME} --file=${filepath}${isRemote ? ' --remote' : ''}`;
    console.log(`執行命令: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(`✅ 遷移成功: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ 遷移失敗: ${filename}`);
    console.error('錯誤訊息:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isRemote = args.includes('--remote');
  const targetFile = args.find(arg => !arg.startsWith('--'));
  
  console.log('🚀 開始執行資料庫遷移');
  console.log(`目標環境: ${isRemote ? '遠端' : '本地'}`);
  
  if (targetFile) {
    console.log(`目標檔案: ${targetFile}`);
    const success = await executeMigration(targetFile, isRemote);
    process.exit(success ? 0 : 1);
  }
  
  const migrationFiles = await getMigrationFiles();
  console.log(`📁 找到 ${migrationFiles.length} 個遷移檔案`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const filename of migrationFiles) {
    const success = await executeMigration(filename, isRemote);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 在遷移之間稍作停頓
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 遷移結果摘要:');
  console.log(`✅ 成功: ${successCount} 個`);
  console.log(`❌ 失敗: ${failCount} 個`);
  console.log(`📁 總計: ${migrationFiles.length} 個`);
  
  if (failCount > 0) {
    console.log('\n⚠️  有遷移失敗，請檢查錯誤訊息');
    process.exit(1);
  } else {
    console.log('\n🎉 所有遷移執行完成！');
  }
}

// 顯示使用說明
function showUsage() {
  console.log(`
📖 使用說明:

  執行所有遷移:
    node scripts/migrate.js [--remote]

  執行特定遷移:
    node scripts/migrate.js [--remote] <filename>

範例:
  node scripts/migrate.js                    # 本地執行所有遷移
  node scripts/migrate.js --remote           # 遠端執行所有遷移
  node scripts/migrate.js --remote 0020_create_backup_history_table.sql  # 遠端執行特定遷移

選項:
  --remote    執行於遠端 Cloudflare D1 資料庫
  --help      顯示此說明
`);
}

if (process.argv.includes('--help')) {
  showUsage();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
}); 