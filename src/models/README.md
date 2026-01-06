# Models - 物件導向架構

## 核心哲學：「人、事、時、地、物」

本目錄包含基於「人、事、時、地、物」哲學架構的核心物件類別：

- **「人、地、物」** = 核心物件（Entities）
- **「事、時」** = 組件變量與條件（Actions & States）
- **故事連結機制**：每個用戶的「人、時、地」組合形成獨特故事

## 物件類別

### Person（人）

代表系統中的使用者。

```javascript
import { Person } from './models/index.js';

// 從資料庫記錄創建
const person = Person.fromDbRecord(dbRecord);

// 檢查使用者類型
if (person.isMerchant()) {
  // 商家邏輯
} else if (person.isTraveler()) {
  // 旅客邏輯
}

// 更新使用者類型
await person.setUserType('merchant', db);
```

### Location（地）

代表地點/場所。

```javascript
import { Location } from './models/index.js';

// 從資料庫記錄創建
const location = Location.fromDbRecord(dbRecord);

// 獲取地點類型
const types = location.getTypes(translateFn);

// 計算距離
const distance = await location.getDistanceTo(otherLocation, distanceService);
```

### Story（故事）

代表「人 + 時 + 地 + 事」的組合。

```javascript
import { Story } from './models/index.js';

// 從 user_locations 記錄創建
const story = Story.fromUserLocationRecord(userLocationRecord);

// 獲取故事標題
const title = story.getTitle();

// 檢查行動類型
if (story.isActionType('visited')) {
  // 處理「來過」的故事
}
```

### ObjectRelations（物件關係管理）

管理 Person、Location、Story 之間的關係。

```javascript
import { ObjectRelations } from './models/index.js';

const relations = new ObjectRelations(db);

// 獲取 Person 的所有 Location
const locations = await relations.getPersonLocations(personId, 'visited');

// 獲取 Person 的所有 Story
const stories = await relations.getPersonStories(personId);

// 獲取 Person 的故事時間線
const timeline = await relations.getPersonTimeline(personId);

// 創建新的 Story
const newStory = await relations.createStory(
  personId,
  locationId,
  'visited',
  '這是一個很棒的地方！'
);

// 獲取 Location 的互動統計
const stats = await relations.getLocationStats(locationId);
```

## 使用範例

### 完整的故事查詢

```javascript
import { ObjectRelations } from './models/index.js';

const relations = new ObjectRelations(db);

// 獲取完整的故事（包含 Person 和 Location）
const story = await relations.getFullStory(storyId);

console.log(story.toJSON());
// {
//   id: "...",
//   person: { id: "...", name: "..." },
//   location: { id: "...", name: "..." },
//   action_type: "visited",
//   ...
// }
```

### 整合到現有服務

```javascript
import { Person, Location, ObjectRelations } from './models/index.js';
import { LocationService } from '../services/LocationService.js';

// 在 LocationService 中使用 Location 物件
const locationService = new LocationService(db, apiKey);
const dbRecord = await locationService.getLocationById(locationId);
const location = Location.fromDbRecord(dbRecord);

// 使用 ObjectRelations 獲取相關故事
const relations = new ObjectRelations(db);
const stories = await relations.getLocationStories(locationId);
```

## 架構優勢

1. **清晰的物件邊界**：每個物件都有明確的職責
2. **統一的資料轉換**：`fromDbRecord()` 和 `toJSON()` 方法
3. **關係管理**：ObjectRelations 統一管理物件間的關係
4. **故事導向**：Story 物件體現「人、時、地、事」的組合
5. **易於擴展**：可以輕鬆添加新方法和屬性

## 未來擴展

- [ ] 添加驗證方法
- [ ] 添加快取機制
- [ ] 添加事件系統
- [ ] 整合到更多現有服務

