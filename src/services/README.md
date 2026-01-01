# Services 目錄說明

## 概述

本目錄包含所有服務類，遵循面向對象設計原則，使用依賴注入和單例模式。

## 服務工廠 (ServiceFactory)

### 使用方式

```javascript
import { ServiceFactory } from './services/ServiceFactory.js';

// 創建服務工廠
const serviceFactory = new ServiceFactory(env, {
  enableLogging: true,
  enableCaching: true
});

// 初始化核心服務
const services = serviceFactory.initializeCoreServices();

// 或初始化所有服務
const allServices = serviceFactory.initializeAllServices();

// 獲取單個服務
const locationService = serviceFactory.getService('locationService');
```

### 可用服務

- `userService` - 用戶服務
- `sessionService` - 會話服務
- `googleAuthService` - Google 認證服務
- `locationService` - 地點服務
- `locationInvitationService` - 地點邀請服務
- `businessVerificationService` - 商家驗證服務
- `authService` - 認證服務（依賴 userService, sessionService, googleAuthService）
- `aiService` - AI 服務（依賴 locationService）
- `itineraryService` - 行程服務（依賴 locationService, aiService）
- `recommendationService` - 推薦服務
- `searchService` - 搜尋服務
- `favoritesService` - 收藏服務
- `securityService` - 安全服務
- `rateLimitService` - 速率限制服務

## 服務設計原則

### 1. 單一職責原則
每個服務類只負責一個特定的業務領域。

### 2. 依賴注入
服務通過構造函數接收依賴，而不是在內部創建。

### 3. 單例模式
ServiceFactory 確保每個服務只創建一個實例。

### 4. 錯誤處理
所有服務在構造函數中驗證必需的依賴。

## 示例：在 Worker 中使用

```javascript
import { ServiceFactory } from './services/ServiceFactory.js';

export default {
  async fetch(request, env, ctx) {
    // 創建服務工廠
    const serviceFactory = new ServiceFactory(env);
    
    // 初始化核心服務
    const {
      authService,
      locationService,
      // ... 其他服務
    } = serviceFactory.initializeCoreServices();
    
    // 使用服務處理請求
    // ...
  }
};
```

## 開發環境工具

使用 `DevelopmentEnvironment` 類來管理開發環境：

```javascript
import { DevelopmentEnvironment } from './utils/DevelopmentEnvironment.js';

const devEnv = new DevelopmentEnvironment(env, {
  isDevelopment: true,
  enableDebugLogging: true,
  enablePerformanceMonitoring: true
});

// 驗證環境
const validation = devEnv.validateEnvironment();

// 記錄性能指標
devEnv.recordMetric('responseTime', 150);

// 獲取性能報告
const report = devEnv.getPerformanceReport();
```

## 添加新服務

1. 在 `src/services/` 目錄創建新的服務類
2. 在 `ServiceFactory.js` 中添加服務創建邏輯
3. 確保遵循依賴注入原則
4. 更新本文檔

