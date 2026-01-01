# HOPENGHU好澎湖 v2.0 升級指南

## 🚀 從 v1.0 升級到 v2.0

### 📋 升級前準備

#### 1. 備份現有數據
```bash
# 備份用戶數據
cp -r static-site/ static-site-backup/

# 備份配置文件
cp wrangler.toml wrangler.toml.backup
```

#### 2. 檢查系統要求
- Node.js 16+ 
- npm 8+
- 現代瀏覽器支援
- 穩定的網路連接

### 🔄 升級步驟

#### 步驟 1：停止現有服務
```bash
# 停止本地開發服務器
pkill -f "python3 -m http.server"

# 停止 Cloudflare Worker (如果正在運行)
wrangler dev --stop
```

#### 步驟 2：更新文件結構
```bash
# 創建 v2 目錄
mkdir -p static-site/v2

# 複製新文件
cp -r static-site/v2/* static-site/

# 或者直接使用 v2 目錄
cd static-site/v2
```

#### 步驟 3：更新依賴
```bash
# 檢查 package.json (如果有的話)
npm install

# 更新 Tailwind CSS
npm install -D tailwindcss@latest

# 更新其他依賴
npm update
```

#### 步驟 4：配置環境變數
```bash
# 更新 wrangler.toml
[env.production.vars]
GOOGLE_MAPS_API_KEY = "your-api-key"
GOOGLE_CLIENT_ID = "your-client-id"
GOOGLE_CLIENT_SECRET = "your-client-secret"
GOOGLE_REDIRECT_URI = "https://your-domain.com/auth/google/callback"
```

#### 步驟 5：測試新功能
```bash
# 啟動本地服務器
python3 -m http.server 8080

# 在瀏覽器中測試
open http://localhost:8080
```

### 🆕 新功能使用指南

#### 1. 用戶認證
```javascript
// 登入功能
document.getElementById('loginBtn').addEventListener('click', () => {
    // 顯示登入模態框
    showLoginModal();
});

// Google 登入
document.getElementById('googleLoginBtn').addEventListener('click', () => {
    // 執行 Google OAuth 流程
    loginWithGoogle();
});
```

#### 2. 內容上傳
```javascript
// 上傳照片
document.getElementById('uploadBtn').addEventListener('click', () => {
    // 顯示上傳模態框
    showUploadModal();
});

// 處理照片選擇
document.getElementById('photoUpload').addEventListener('change', (e) => {
    handlePhotoSelection(e);
});
```

#### 3. 社交互動
```javascript
// 點讚功能
document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        handleLike(e.target);
    });
});

// 關注功能
document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        handleFollow(e.target);
    });
});
```

#### 4. 智能推薦
```javascript
// 應用篩選
function applyFilters() {
    const relevance = document.getElementById('relevanceFilter').value;
    const memory = document.getElementById('memoryFilter').value;
    const sort = document.getElementById('sortFilter').value;
    
    // 執行篩選邏輯
    filterFriends(relevance, memory, sort);
}
```

### 🔧 配置選項

#### 1. 個人化設定
```javascript
// 用戶偏好設定
const userPreferences = {
    notifications: true,
    autoPlay: false,
    theme: 'light',
    language: 'zh-TW'
};

// 保存設定
localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
```

#### 2. 推薦算法配置
```javascript
// 推薦權重設定
const recommendationWeights = {
    location: 0.4,    // 地點相似度權重
    time: 0.3,        // 時間相似度權重
    interest: 0.3     // 興趣相似度權重
};
```

#### 3. 通知設定
```javascript
// 通知偏好
const notificationSettings = {
    likes: true,
    comments: true,
    follows: true,
    recommendations: false
};
```

### 📱 移動端優化

#### 1. 響應式設計
```css
/* 移動端樣式 */
@media (max-width: 768px) {
    .text-mobile-xl {
        font-size: 1.5rem;
        line-height: 2rem;
    }
    
    .btn-mobile {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }
}
```

#### 2. 觸控優化
```javascript
// 觸控事件處理
document.addEventListener('touchstart', (e) => {
    // 處理觸控開始
    handleTouchStart(e);
});

document.addEventListener('touchend', (e) => {
    // 處理觸控結束
    handleTouchEnd(e);
});
```

### 🔒 安全性配置

#### 1. 數據加密
```javascript
// 敏感數據加密
function encryptData(data) {
    // 使用 Web Crypto API 加密
    return crypto.subtle.encrypt(algorithm, key, data);
}

// 數據解密
function decryptData(encryptedData) {
    return crypto.subtle.decrypt(algorithm, key, encryptedData);
}
```

#### 2. XSS 防護
```javascript
// 輸入驗證和清理
function sanitizeInput(input) {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
```

### 📊 數據分析

#### 1. 用戶行為追蹤
```javascript
// 追蹤用戶行為
function trackUserAction(action, data) {
    const event = {
        action: action,
        data: data,
        timestamp: new Date(),
        userId: getCurrentUserId()
    };
    
    // 發送到分析服務
    sendAnalytics(event);
}
```

#### 2. 性能監控
```javascript
// 性能監控
function monitorPerformance() {
    const perfData = {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime
    };
    
    console.log('Performance Data:', perfData);
}
```

### 🚀 部署指南

#### 1. 本地部署
```bash
# 啟動開發服務器
python3 -m http.server 8080

# 或使用 Node.js
npx serve static-site/v2 -p 8080
```

#### 2. Cloudflare Workers 部署
```bash
# 部署到 Cloudflare Workers
wrangler deploy

# 部署到預覽環境
wrangler deploy --env preview
```

#### 3. 靜態網站部署
```bash
# 部署到 GitHub Pages
git add .
git commit -m "Upgrade to v2.0"
git push origin main

# 部署到 Netlify
netlify deploy --prod --dir=static-site/v2
```

### 🔍 故障排除

#### 1. 常見問題

**問題：登入功能不工作**
```javascript
// 檢查 OAuth 配置
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
```

**問題：上傳功能失敗**
```javascript
// 檢查文件大小限制
const maxFileSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxFileSize) {
    showError('文件大小超過限制');
}
```

**問題：推薦不準確**
```javascript
// 檢查推薦算法
const relevance = calculateRelevance(user, friend);
console.log('Relevance Score:', relevance);
```

#### 2. 調試工具
```javascript
// 啟用調試模式
const DEBUG = true;

function debugLog(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data);
    }
}
```

### 📞 技術支援

#### 1. 獲取幫助
- **文檔**：查看完整文檔
- **社群**：加入用戶社群
- **郵件**：發送技術支援郵件
- **GitHub**：提交 Issue 或 PR

#### 2. 回報問題
```markdown
## 問題描述
簡潔描述遇到的問題

## 重現步驟
1. 步驟一
2. 步驟二
3. 步驟三

## 預期行為
描述預期的行為

## 實際行為
描述實際發生的行為

## 環境信息
- 瀏覽器版本：
- 操作系統：
- 設備類型：
```

### 🎉 升級完成

恭喜！您已成功升級到 HOPENGHU好澎湖 v2.0！

#### 下一步：
1. 測試所有新功能
2. 配置個人偏好
3. 邀請朋友使用
4. 提供反饋建議

#### 享受新功能：
- 🎯 智能推薦朋友
- 📸 輕鬆分享回憶
- 💬 豐富社交互動
- 🔍 精準內容篩選

**HOPENGHU好澎湖團隊**  
祝您使用愉快！
