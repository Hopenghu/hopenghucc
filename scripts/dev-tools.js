#!/usr/bin/env node
/**
 * 開發工具腳本
 * 提供開發環境驗證、狀態檢查等功能
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * 讀取環境配置
 */
function loadEnvironmentConfig() {
  try {
    const wranglerPath = join(projectRoot, 'wrangler.toml');
    const wranglerContent = readFileSync(wranglerPath, 'utf-8');
    
    // 簡單解析 wrangler.toml（不完整，僅用於演示）
    const config = {
      hasWranglerConfig: true,
      content: wranglerContent
    };
    
    return config;
  } catch (error) {
    return {
      hasWranglerConfig: false,
      error: error.message
    };
  }
}

/**
 * 檢查項目結構
 */
async function checkProjectStructure() {
  const requiredDirs = [
    'src',
    'src/services',
    'src/api',
    'src/pages',
    'src/components',
    'dist'
  ];
  
  const requiredFiles = [
    'package.json',
    'wrangler.toml',
    'src/worker.js'
  ];
  
  const issues = [];
  const status = {
    directories: {},
    files: {},
    isValid: true
  };
  
  // 使用 Node.js fs 模組
  const fs = await import('fs');
  
  // 檢查目錄
  for (const dir of requiredDirs) {
    const dirPath = join(projectRoot, dir);
    try {
      const exists = fs.existsSync(dirPath);
      status.directories[dir] = exists;
      if (!exists) {
        issues.push(`Missing directory: ${dir}`);
        status.isValid = false;
      }
    } catch (error) {
      status.directories[dir] = false;
      issues.push(`Error checking directory ${dir}: ${error.message}`);
    }
  }
  
  // 檢查文件
  for (const file of requiredFiles) {
    const filePath = join(projectRoot, file);
    try {
      const exists = fs.existsSync(filePath);
      status.files[file] = exists;
      if (!exists) {
        issues.push(`Missing file: ${file}`);
        status.isValid = false;
      }
    } catch (error) {
      status.files[file] = false;
      issues.push(`Error checking file ${file}: ${error.message}`);
    }
  }
  
  return { ...status, issues };
}

/**
 * 驗證環境配置
 */
async function validateEnvironment() {
  console.log('🔍 Validating Development Environment...\n');
  
  const envConfig = loadEnvironmentConfig();
  const projectStructure = await checkProjectStructure();
  
  console.log('📁 Project Structure:');
  console.log('  Directories:');
  for (const [dir, exists] of Object.entries(projectStructure.directories)) {
    console.log(`    ${exists ? '✅' : '❌'} ${dir}`);
  }
  
  console.log('\n  Files:');
  for (const [file, exists] of Object.entries(projectStructure.files)) {
    console.log(`    ${exists ? '✅' : '❌'} ${file}`);
  }
  
  console.log('\n📋 Configuration:');
  console.log(`  Wrangler Config: ${envConfig.hasWranglerConfig ? '✅' : '❌'}`);
  
  if (projectStructure.issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    projectStructure.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log(`\n${projectStructure.isValid ? '✅' : '❌'} Environment is ${projectStructure.isValid ? 'valid' : 'invalid'}\n`);
  
  return projectStructure.isValid;
}

/**
 * 顯示項目狀態
 */
async function showStatus() {
  console.log('📊 Project Status\n');
  
  try {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, 'package.json'), 'utf-8')
    );
    
    console.log('📦 Package Info:');
    console.log(`  Name: ${packageJson.name}`);
    console.log(`  Version: ${packageJson.version}`);
    console.log(`  Description: ${packageJson.description || 'N/A'}`);
    
    console.log('\n🛠️  Available Scripts:');
    const scripts = Object.keys(packageJson.scripts || {});
    scripts.forEach(script => {
      console.log(`  - npm run ${script}`);
    });
    
    console.log('\n📚 Dependencies:');
    console.log(`  Total: ${Object.keys(packageJson.dependencies || {}).length} dependencies`);
    console.log(`  Dev: ${Object.keys(packageJson.devDependencies || {}).length} dev dependencies`);
    
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
  }
  
  const envConfig = loadEnvironmentConfig();
  console.log('\n⚙️  Configuration:');
  console.log(`  Wrangler Config: ${envConfig.hasWranglerConfig ? '✅' : '❌'}`);
  
  console.log('\n');
}

/**
 * 主函數
 */
async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'validate':
    case 'check':
      await validateEnvironment();
      break;
    
    case 'status':
      await showStatus();
      break;
    
    case 'help':
    default:
      console.log(`
🛠️  Development Tools

Usage: npm run dev:tools [command]

Commands:
  validate, check    Validate development environment
  status             Show project status
  help               Show this help message

Examples:
  npm run dev:tools validate
  npm run dev:tools status
      `);
      break;
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

