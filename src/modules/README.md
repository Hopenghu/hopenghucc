# Modules - 模組化架構

## 核心哲學：「人、事、時、地、物」

本目錄包含基於「人、事、時、地、物」哲學架構的模組：

- **「人、地、物」** = 核心物件（Entities）- 見 `src/models/`
- **「事、時」** = 組件變量與條件（Actions & States）- 本目錄

## 模組說明

### TimeModule（時）

管理時間相關的操作和格式化。

```javascript
import { TimeModule } from './modules/index.js';

const timeModule = new TimeModule();

// 獲取當前時間戳記
const timestamp = timeModule.getCurrentTimestamp();
const datetime = timeModule.getCurrentDatetime();

// 格式化時間
const formatted = timeModule.formatDatetime(new Date());
const relative = timeModule.formatRelativeTime('2025-01-15');
// 輸出：5 天前

// 計算時間差
const diff = timeModule.calculateTimeDifference('2025-01-15', '2025-01-20');
// { days: 5, hours: 0, minutes: 0, seconds: 0, ... }

// 解析時間描述
const date = timeModule.parseTimeDescription('3 天前');

// 為 Story 生成時間描述
const storyTime = timeModule.getStoryTimeDescription(story);
```

### ActionModule（事）

管理行動（Action）相關的操作和狀態。

```javascript
import { ActionModule } from './modules/index.js';

const actionModule = new ActionModule();

// 獲取行動類型的中文名稱
const name = actionModule.getActionTypeName('visited');
// 輸出：來過

// 獲取行動類型的圖標
const icon = actionModule.getActionTypeIcon('visited');
// 輸出：✓

// 獲取行動類型的顏色
const color = actionModule.getActionTypeColor('visited');
// 輸出：green

// 生成行動描述
const description = actionModule.generateActionDescription('visited', '澎湖天后宮');
// 輸出：✓ 來過 澎湖天后宮

// 獲取按鈕樣式類別
const buttonClass = actionModule.getActionButtonClass('visited', true);
// 輸出：bg-green-500 text-white action-visited action-color-green

// 從使用者輸入識別行動
const actionType = actionModule.identifyActionFromInput('我想去澎湖');
// 輸出：want_to_visit

// 獲取行動統計
const stats = actionModule.getActionStatistics(stories);
// {
//   visited: 10,
//   want_to_visit: 5,
//   want_to_revisit: 3,
//   total: 18
// }

// 過濾 Story
const visitedStories = actionModule.filterStoriesByAction(stories, 'visited');

// 排序 Story（按優先級）
const sortedStories = actionModule.sortStoriesByActionPriority(stories);
```

## 整合範例

### 結合 Models 使用

```javascript
import { Person, Location, Story, ObjectRelations } from '../models/index.js';
import { TimeModule, ActionModule } from './modules/index.js';

const timeModule = new TimeModule();
const actionModule = new ActionModule();
const relations = new ObjectRelations(db);

// 獲取 Person 的故事
const stories = await relations.getPersonStories(personId);

// 使用 TimeModule 格式化時間
stories.forEach(story => {
  story.timeDescription = timeModule.getStoryTimeDescription(story);
});

// 使用 ActionModule 生成描述
stories.forEach(story => {
  story.actionDescription = actionModule.generateActionDescription(
    story.action_type,
    story._location?.name
  );
  story.actionIcon = actionModule.getActionTypeIcon(story.action_type);
  story.actionColor = actionModule.getActionTypeColor(story.action_type);
});

// 獲取統計資訊
const stats = actionModule.getActionStatistics(stories);
```

### 在 API 中使用

```javascript
import { TimeModule, ActionModule } from '../modules/index.js';

export async function handleStoriesRequest(request, env) {
  const timeModule = new TimeModule();
  const actionModule = new ActionModule();
  
  // 獲取故事
  const stories = await getStoriesFromDb();
  
  // 格式化回應
  const response = stories.map(story => ({
    ...story.toJSON(),
    timeDescription: timeModule.formatRelativeTime(story.created_at),
    actionName: actionModule.getActionTypeName(story.action_type),
    actionIcon: actionModule.getActionTypeIcon(story.action_type)
  }));
  
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 架構優勢

1. **統一的時間處理**：TimeModule 提供一致的時間格式化
2. **行動類型管理**：ActionModule 統一管理所有行動類型
3. **易於擴展**：可以輕鬆添加新的行動類型或時間格式
4. **模組化設計**：低耦合，高內聚
5. **故事導向**：支援「人、時、地、事」的完整組合

## 支援的行動類型

### 地點相關
- `visited` - 來過
- `want_to_visit` - 想來
- `want_to_revisit` - 想再來
- `created` - 建立了地點
- `shared` - 分享了地點

### 商家相關
- `claimed` - 認領了地點
- `updated` - 更新了資訊

### 其他
- `liked` - 喜歡
- `commented` - 評論
- `followed` - 關注

## 未來擴展

- [ ] 添加更多時間格式
- [ ] 支援時區轉換
- [ ] 添加行動歷史追蹤
- [ ] 整合到更多現有服務

