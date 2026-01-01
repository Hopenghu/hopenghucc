#!/usr/bin/env node

/**
 * Cloudflare 連線檢查腳本
 * 檢查 Cloudflare API 連線、帳號狀態和域名配置
 */

const https = require('https');
const { execSync } = require('child_process');

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

function checkCloudflareWebsite() {
  return new Promise((resolve) => {
    log('\n📡 檢查 Cloudflare 網站連線...', 'blue');
    const req = https.get('https://www.cloudflare.com', (res) => {
      if (res.statusCode === 200) {
        log('✅ Cloudflare 網站可訪問', 'green');
        resolve(true);
      } else {
        log(`⚠️  Cloudflare 網站回應狀態碼: ${res.statusCode}`, 'yellow');
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      log(`❌ 無法連線到 Cloudflare: ${err.message}`, 'red');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      log('❌ 連線超時', 'red');
      resolve(false);
    });
  });
}

function checkWranglerAuth() {
  log('\n🔐 檢查 Wrangler 認證狀態...', 'blue');
  try {
    const output = execSync('npx wrangler whoami', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    if (output.includes('You are logged in')) {
      log('✅ Wrangler 已登入', 'green');
      log(`   帳號資訊:\n${output}`, 'blue');
      return true;
    } else {
      log('⚠️  Wrangler 未登入', 'yellow');
      log('   請執行: npx wrangler login', 'yellow');
      return false;
    }
  } catch (error) {
    if (error.stdout && error.stdout.includes('Not logged in')) {
      log('❌ Wrangler 未登入', 'red');
      log('   請執行: npx wrangler login', 'yellow');
    } else {
      log(`❌ 檢查認證時發生錯誤: ${error.message}`, 'red');
    }
    return false;
  }
}

function checkDomainConfig() {
  log('\n🌐 檢查域名配置...', 'blue');
  try {
    const wranglerConfig = require('fs').readFileSync('wrangler.toml', 'utf-8');
    
    if (wranglerConfig.includes('hopenghu.cc')) {
      log('✅ wrangler.toml 中包含 hopenghu.cc 配置', 'green');
      
      // 提取域名資訊
      const zoneMatch = wranglerConfig.match(/zone_name\s*=\s*"([^"]+)"/);
      const routeMatches = wranglerConfig.matchAll(/pattern\s*=\s*"([^"]+)"/g);
      
      if (zoneMatch) {
        log(`   域名區域: ${zoneMatch[1]}`, 'blue');
      }
      
      const routes = Array.from(routeMatches).map(m => m[1]);
      if (routes.length > 0) {
        log(`   路由配置:`, 'blue');
        routes.forEach(route => log(`     - ${route}`, 'blue'));
      }
      
      return true;
    } else {
      log('⚠️  wrangler.toml 中未找到 hopenghu.cc 配置', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ 讀取配置檔案時發生錯誤: ${error.message}`, 'red');
    return false;
  }
}

function checkWorkerStatus() {
  log('\n⚙️  檢查 Worker 狀態...', 'blue');
  try {
    const output = execSync('npx wrangler deployments list', { 
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 10000
    });
    
    if (output.includes('hopenghucc')) {
      log('✅ 找到 hopenghucc Worker', 'green');
      log(`   部署資訊:\n${output}`, 'blue');
      return true;
    } else {
      log('⚠️  未找到 hopenghucc Worker 部署', 'yellow');
      return false;
    }
  } catch (error) {
    if (error.message.includes('Not logged in')) {
      log('⚠️  需要先登入才能檢查 Worker 狀態', 'yellow');
    } else {
      log(`⚠️  檢查 Worker 狀態時發生錯誤: ${error.message}`, 'yellow');
    }
    return false;
  }
}

async function main() {
  log('='.repeat(60), 'blue');
  log('Cloudflare 連線與配置檢查', 'blue');
  log('='.repeat(60), 'blue');
  log(`帳號: blackie.hsieh@gmail.com`, 'blue');
  log(`域名: hopenghu.cc`, 'blue');
  
  const results = {
    website: await checkCloudflareWebsite(),
    auth: checkWranglerAuth(),
    domain: checkDomainConfig(),
    worker: checkWorkerStatus(),
  };
  
  log('\n' + '='.repeat(60), 'blue');
  log('檢查結果摘要', 'blue');
  log('='.repeat(60), 'blue');
  
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const name = {
      website: 'Cloudflare 網站連線',
      auth: 'Wrangler 認證',
      domain: '域名配置',
      worker: 'Worker 狀態'
    }[key];
    log(`${status} ${name}`, value ? 'green' : 'red');
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n✅ 所有檢查通過！可以進行遠端設定。', 'green');
  } else {
    log('\n⚠️  部分檢查未通過，請根據上述資訊進行修復。', 'yellow');
    
    if (!results.auth) {
      log('\n📝 下一步操作：', 'blue');
      log('   1. 執行: npx wrangler login', 'yellow');
      log('   2. 在瀏覽器中完成 OAuth 登入', 'yellow');
      log('   3. 重新執行此檢查腳本', 'yellow');
    }
  }
  
  log('\n' + '='.repeat(60), 'blue');
}

main().catch(console.error);

