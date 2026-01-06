# AIAgentFactory 和 EcosystemService 使用指南

## 📋 概述

這兩個服務是基於手寫筆記哲學理念實現的：

- **AIAgentFactory**: 符合「讓 AI 變成程式」的理念
- **EcosystemService**: 符合「服務生命，讓世界更好更平衡」的理念

---

## 🤖 AIAgentFactory 使用指南

### 基本使用

```javascript
import { ServiceFactory } from './services/ServiceFactory.js';

// 創建服務工廠
const serviceFactory = new ServiceFactory(env);

// 獲取 AIAgentFactory
const agentFactory = serviceFactory.getService('aiAgentFactory');

// 創建 Agent
const travelAgent = agentFactory.createAgent('travel_planner', {
  mode: 'traveler'
});
```

### 可用的 Agent 類型

#### 1. TravelPlannerAgent - 行程規劃 Agent

```javascript
const plannerAgent = agentFactory.createAgent('travel_planner', {
  mode: 'traveler' // 使用 Gemini
});

// 執行行程規劃
const result = await plannerAgent.execute({
  userId: 'user123',
  sessionId: 'session456',
  query: '我想規劃一個3天的澎湖行程',
  context: {}
});

// 優化行程
const optimized = await plannerAgent.optimizeItinerary(
  itineraryData,
  { userId: 'user123', preferences: { budget: 10000 } }
);
```

#### 2. KnowledgeExtractorAgent - 知識提取 Agent

```javascript
const extractorAgent = agentFactory.createAgent('knowledge_extractor', {
  mode: 'resident' // 使用 GPT
});

// 提取知識
const knowledge = await extractorAgent.execute({
  userId: 'user123',
  sessionId: 'session456',
  conversation: '澎湖的天后宮是很有名的景點',
  context: {}
});

// 驗證知識
const validation = await extractorAgent.validateKnowledge(knowledge.knowledge);

// 批量提取
const batchResults = await extractorAgent.extractBatch([
  { userId: 'user1', sessionId: 's1', content: '...' },
  { userId: 'user2', sessionId: 's2', content: '...' }
]);
```

#### 3. RecommendationAgent - 推薦 Agent

```javascript
const recommendationAgent = agentFactory.createAgent('recommendation', {
  mode: null // 自動判斷
});

// 執行推薦
const recommendations = await recommendationAgent.execute({
  userId: 'user123',
  sessionId: 'session456',
  query: '我想找適合看夕陽的地方',
  context: {}
});

// 個性化推薦
const personalized = await recommendationAgent.getPersonalizedRecommendations(
  'user123',
  { preferences: { type: 'sunset', budget: 'low' }
});
```

#### 4. ConversationAgent - 對話 Agent

```javascript
const conversationAgent = agentFactory.createAgent('conversation', {
  mode: null // 自動判斷
});

// 執行對話
const response = await conversationAgent.execute({
  userId: 'user123',
  sessionId: 'session456',
  message: '澎湖有什麼好吃的？',
  context: {}
});

// 繼續對話
const nextResponse = await conversationAgent.continueConversation(
  'session456',
  '還有什麼推薦的嗎？',
  'user123'
);

// 獲取對話歷史
const history = await conversationAgent.getConversationHistory('session456', 50);
```

### Agent 編排（Agent Chain）

```javascript
// 創建多個 Agent 並編排執行
const agentChain = agentFactory.createAgentChain([
  { type: 'knowledge_extractor', mode: 'resident' },
  { type: 'recommendation', mode: null },
  { type: 'travel_planner', mode: 'traveler' }
]);

// 依次執行
let result = input;
for (const agent of agentChain) {
  result = await agent.execute(result);
}
```

### Agent 管理

```javascript
// 獲取 Agent 狀態
const state = travelAgent.getState();

// 獲取所有 Agent 的狀態
const allStates = agentFactory.getAllAgentStates();

// 獲取統計信息
const stats = agentFactory.getStats();

// 清除緩存
agentFactory.clearCache('travel_planner'); // 清除特定類型
agentFactory.clearCache(); // 清除所有
```

---

## 🌍 EcosystemService 使用指南

### 基本使用

```javascript
import { ServiceFactory } from './services/ServiceFactory.js';

// 創建服務工廠
const serviceFactory = new ServiceFactory(env);

// 獲取 EcosystemService
const ecosystemService = serviceFactory.getService('ecosystemService');
```

### 用戶福祉追蹤

```javascript
// 追蹤用戶福祉
await ecosystemService.trackUserWellbeing('user123', {
  satisfaction: 85, // 滿意度 (0-100)
  engagement: 90,   // 參與度 (0-100)
  experience: 88,   // 體驗分數 (0-100)
  metadata: {
    source: 'user_feedback',
    feedback: 'Great service!'
  }
});

// 獲取用戶福祉指標
const wellbeing = await ecosystemService.getUserWellbeing('user123', {
  days: 30, // 查詢最近30天
  limit: 50
});
```

### 資源使用追蹤

```javascript
// 追蹤資源使用
await ecosystemService.trackResourceUsage({
  apiCalls: 150,
  aiCalls: 50,
  storage: 1024, // MB
  bandwidth: 512, // MB
  cost: 12.5, // USD
  metadata: {
    period: 'daily',
    date: '2025-01-20'
  }
});

// 獲取資源使用統計
const usage = await ecosystemService.getResourceUsage({
  days: 7 // 查詢最近7天
});
```

### 社區健康追蹤

```javascript
// 追蹤社區健康
await ecosystemService.trackCommunityHealth({
  activeUsers: 500,
  interactions: 1200,
  contentDiversity: 75, // 內容多樣性 (0-100)
  engagementRate: 80,  // 參與率 (0-100)
  metadata: {
    period: 'daily',
    date: '2025-01-20'
  }
});

// 獲取社區健康指標
const health = await ecosystemService.getCommunityHealth({
  days: 7 // 查詢最近7天
});
```

### 完整生態系統報告

```javascript
// 獲取完整的生態系統報告
const report = await ecosystemService.getEcosystemReport({
  days: 7 // 查詢最近7天
});

// 報告包含：
// - wellbeing: 用戶福祉數據
// - resourceUsage: 資源使用數據
// - communityHealth: 社區健康數據
// - overallScore: 總體分數 (0-100)
// - recommendations: 改進建議
```

---

## 🔄 整合到現有代碼

### 在 Worker 中使用

```javascript
import { ServiceFactory } from './services/ServiceFactory.js';

export default {
  async fetch(request, env, ctx) {
    const serviceFactory = new ServiceFactory(env);
    
    // 獲取服務
    const agentFactory = serviceFactory.getService('aiAgentFactory');
    const ecosystemService = serviceFactory.getService('ecosystemService');
    
    // 使用 Agent
    const conversationAgent = agentFactory.createAgent('conversation');
    const result = await conversationAgent.execute({
      userId: user.id,
      sessionId: sessionId,
      message: userMessage
    });
    
    // 追蹤用戶福祉（背景執行）
    ctx.waitUntil(
      ecosystemService.trackUserWellbeing(user.id, {
        satisfaction: calculateSatisfaction(result),
        engagement: calculateEngagement(result)
      })
    );
    
    return new Response(JSON.stringify(result));
  }
};
```

### 在 API 中使用

```javascript
// 在 API 路由中使用
export async function handleAIRequest(request, env, user) {
  const serviceFactory = new ServiceFactory(env);
  const agentFactory = serviceFactory.getService('aiAgentFactory');
  
  const { message, sessionId } = await request.json();
  
  // 使用 ConversationAgent
  const conversationAgent = agentFactory.createAgent('conversation');
  const result = await conversationAgent.execute({
    userId: user.id,
    sessionId,
    message
  });
  
  return new Response(JSON.stringify(result));
}
```

---

## 📊 監控和報告

### 定期生成生態系統報告

```javascript
// 可以設置定時任務來生成報告
async function generateDailyReport() {
  const serviceFactory = new ServiceFactory(env);
  const ecosystemService = serviceFactory.getService('ecosystemService');
  
  const report = await ecosystemService.getEcosystemReport({ days: 1 });
  
  // 發送報告給管理員
  await sendReportToAdmin(report);
  
  // 根據建議採取行動
  for (const recommendation of report.recommendations) {
    await handleRecommendation(recommendation);
  }
}
```

---

## 🎯 理念對應

### AIAgentFactory
- ✅ **「程式要判斷的事 → 交給 AI」**: Agent 封裝 AI 判斷邏輯
- ✅ **「讓 AI 變成程式」**: Agent 將 AI 能力模組化、可重用

### EcosystemService
- ✅ **「去處理，活在世界的生物」**: 監控用戶福祉
- ✅ **「有更好的生活」**: 追蹤用戶滿意度和體驗
- ✅ **「世界是球、更好更平衡」**: 確保資源使用平衡、社區健康

---

## 📝 注意事項

1. **數據表創建**: 使用前需要執行遷移文件 `0036_add_ecosystem_tracking_tables.sql`
2. **緩存**: 兩個服務都支持緩存，可以通過配置選項控制
3. **錯誤處理**: 如果數據表不存在，服務會優雅降級，不會中斷流程
4. **性能**: Agent 支持單例模式，避免重複創建

---

## 🚀 下一步

1. 執行數據庫遷移
2. 在現有代碼中整合 Agent
3. 設置定期追蹤任務
4. 建立監控儀表板

