# 澎湖AI夥伴核心建構模型

## 專案概述

**專案名稱：** 澎湖AI夥伴（Penghu AI Companion）  
**核心理念：** 透過對話建立關係，成為使用者的澎湖生活/旅遊夥伴  
**定位：** 朋友，而非客服

---

## 一、系統架構概覽

```
┌─────────────────────────────────────────────────────┐
│                    使用者介面層                        │
│            (Web Chat Interface / Mobile)            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│                   對話管理層                          │
│  ├─ 對話狀態管理                                      │
│  ├─ 上下文記憶                                        │
│  └─ 對話流程控制                                      │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│                   AI推理層                           │
│  ├─ ChatGPT API (深度對話)                           │
│  ├─ Gemini API (快速回應)                            │
│  └─ Prompt Engineering                              │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│                  資料持久層                           │
│  ├─ 使用者檔案                                        │
│  ├─ 對話歷史                                          │
│  ├─ 偏好標籤                                          │
│  └─ 關係深度指標                                      │
└─────────────────────────────────────────────────────┘
```

---

## 二、核心資料模型

### 2.1 使用者檔案結構

```json
{
  "userId": "uuid-string",
  "profile": {
    "userType": "resident | visitor | potential_visitor | curious",
    "createdAt": "timestamp",
    "lastActiveAt": "timestamp",
    "relationshipDepth": 0-100
  },
  "identity": {
    "isResident": boolean,
    "visitHistory": {
      "count": number,
      "lastVisit": "date",
      "visitedPlaces": ["string"]
    },
    "planningTrip": {
      "isPlanning": boolean,
      "targetDate": "date | null",
      "duration": "number | null"
    }
  },
  "preferences": {
    "interests": ["beach", "culture", "food", "photography", "diving"],
    "activityLevel": "relaxed | moderate | active",
    "crowdPreference": "popular | moderate | secluded",
    "seasonPreference": ["summer", "winter"],
    "travelStyle": "solo | couple | family | friends"
  },
  "conversationContext": {
    "totalRounds": number,
    "currentStage": "initial | getting_to_know | familiar | friend",
    "lastTopic": "string",
    "pendingQuestions": ["string"],
    "rememberedFacts": [
      {
        "fact": "string",
        "confidence": 0-1,
        "mentionedAt": "timestamp"
      }
    ]
  }
}
```

### 2.2 對話記錄結構

```json
{
  "conversationId": "uuid-string",
  "userId": "uuid-string",
  "messages": [
    {
      "messageId": "uuid-string",
      "role": "user | assistant",
      "content": "string",
      "timestamp": "timestamp",
      "metadata": {
        "extractedInfo": {
          "userType": "string | null",
          "interests": ["string"],
          "emotionalTone": "positive | neutral | negative"
        },
        "aiDecision": {
          "strategy": "explore | listen | suggest | comfort",
          "nextGoal": "string"
        }
      }
    }
  ],
  "summary": "string"
}
```

---

## 三、對話階段設計

### 3.1 對話階段定義

| 階段 | 輪次範圍 | 主要目標 | AI行為特徵 |
|------|----------|----------|-----------|
| **初識期** | 1-3輪 | 確認使用者身份 | 友善打招呼，開放式問題 |
| **認識期** | 4-8輪 | 了解基本偏好 | 自然探索興趣，不過度提問 |
| **熟悉期** | 9-15輪 | 深化理解 | 記得先前對話，提供初步建議 |
| **朋友期** | 16+輪 | 自然互動 | 主動關心，個人化推薦 |

### 3.2 階段轉換觸發條件

```python
def calculate_relationship_depth(user_data):
    score = 0
    
    # 對話輪次貢獻 (40%)
    score += min(user_data['conversationContext']['totalRounds'] * 2, 40)
    
    # 資訊完整度 (30%)
    profile_completeness = len([v for v in user_data['identity'].values() if v]) / len(user_data['identity'])
    score += profile_completeness * 30
    
    # 偏好明確度 (20%)
    preference_count = len(user_data['preferences']['interests'])
    score += min(preference_count * 4, 20)
    
    # 回訪次數 (10%)
    revisit_count = get_user_revisit_count(user_data['userId'])
    score += min(revisit_count * 2, 10)
    
    return min(score, 100)

def get_conversation_stage(relationship_depth):
    if relationship_depth < 20:
        return "initial"
    elif relationship_depth < 50:
        return "getting_to_know"
    elif relationship_depth < 75:
        return "familiar"
    else:
        return "friend"
```

---

## 四、Prompt 工程架構

### 4.1 系統提示詞模板

```python
SYSTEM_PROMPT_TEMPLATE = """
你是「阿澎」，一個在澎湖土生土長的25歲年輕人。

## 角色設定
- 個性：熱情、真誠、幽默、不做作
- 語氣：台灣口語化，像朋友聊天
- 專長：對澎湖各個角落都很熟悉
- 態度：不急著推銷，真心想了解對方

## 當前對話狀態
- 使用者類型：{user_type}
- 對話階段：{conversation_stage}
- 已知興趣：{known_interests}
- 關係深度：{relationship_depth}/100
- 對話輪次：{conversation_round}

## 當前階段目標
{stage_goal}

## 對話原則
1. 一次最多問1-2個問題
2. 根據對方的回應自然延伸
3. 不要像問卷一樣連續發問
4. 記得並引用之前的對話內容
5. {stage_specific_rule}

## 記憶的重要資訊
{remembered_facts}

請用自然、朋友的語氣回應使用者。
"""

STAGE_SPECIFIC_RULES = {
    "initial": "專注於確認對方與澎湖的關係，不提供建議",
    "getting_to_know": "透過聊天逐步了解興趣，避免直接詢問偏好清單",
    "familiar": "可以開始給予初步建議，但要基於已知的偏好",
    "friend": "像老朋友一樣互動，主動關心，提供深度個人化建議"
}
```

### 4.2 動態Prompt組裝

```javascript
function buildDynamicPrompt(userId, userMessage) {
  const userData = getUserData(userId);
  const conversationHistory = getConversationHistory(userId, last=5);
  const stage = userData.conversationContext.currentStage;
  
  // 組裝系統提示詞
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{user_type}', userData.profile.userType)
    .replace('{conversation_stage}', stage)
    .replace('{known_interests}', userData.preferences.interests.join(', '))
    .replace('{relationship_depth}', userData.profile.relationshipDepth)
    .replace('{conversation_round}', userData.conversationContext.totalRounds)
    .replace('{stage_goal}', getStageGoal(stage))
    .replace('{stage_specific_rule}', STAGE_SPECIFIC_RULES[stage])
    .replace('{remembered_facts}', formatRememberedFacts(userData));
  
  // 組裝完整對話
  return {
    model: selectModel(stage),
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.8,
    max_tokens: 500
  };
}
```

---

## 五、資訊提取策略

### 5.1 非結構化資訊提取

AI回應後，額外進行一次資訊提取請求：

```python
EXTRACTION_PROMPT = """
分析以下使用者訊息，提取關鍵資訊：

使用者訊息：{user_message}

請以JSON格式回傳：
{
  "userType": {
    "type": "resident | visitor | potential_visitor | curious | unknown",
    "confidence": 0-1,
    "evidence": "string"
  },
  "interests": [
    {
      "interest": "string",
      "confidence": 0-1
    }
  ],
  "travelPlan": {
    "isPlanning": boolean,
    "timeframe": "string | null",
    "duration": "string | null"
  },
  "emotionalTone": "positive | neutral | negative | excited | worried",
  "needsFollowUp": boolean,
  "suggestedNextTopic": "string"
}

只根據明確提到的資訊判斷，不要過度推測。
"""
```

### 5.2 資訊累積更新規則

```python
def update_user_profile(user_id, extracted_info):
    user_data = get_user_data(user_id)
    
    # 更新使用者類型（使用高信心度覆蓋）
    if extracted_info['userType']['confidence'] > 0.7:
        user_data['profile']['userType'] = extracted_info['userType']['type']
    
    # 累積興趣標籤（去重）
    for interest_item in extracted_info['interests']:
        if interest_item['confidence'] > 0.6:
            if interest_item['interest'] not in user_data['preferences']['interests']:
                user_data['preferences']['interests'].append(interest_item['interest'])
    
    # 更新旅行計畫
    if extracted_info['travelPlan']['isPlanning']:
        user_data['identity']['planningTrip'] = extracted_info['travelPlan']
    
    # 記錄重要事實
    if extracted_info.get('importantFact'):
        user_data['conversationContext']['rememberedFacts'].append({
            'fact': extracted_info['importantFact'],
            'confidence': extracted_info.get('confidence', 0.8),
            'mentionedAt': datetime.now()
        })
    
    save_user_data(user_id, user_data)
```

---

## 六、關鍵技術決策

### 6.1 API選擇策略

| 情境 | 使用API | 理由 | 成本考量 |
|------|---------|------|---------|
| 初識期對話 | Gemini 2.0 Flash | 快速、自然、便宜 | $0.075/1M tokens |
| 深度對話 | GPT-4 | 推理能力強 | $5/1M tokens |
| 資訊提取 | Gemini Pro | 結構化輸出好 | $1.25/1M tokens |
| 圖片分析 | Gemini Vision | 原生支援 | $2.5/1M tokens |

### 6.2 記憶機制設計

**短期記憶：** 當前對話的最近5-10輪  
**中期記憶：** 使用者檔案中的結構化資訊  
**長期記憶：** 摘要化的重要對話片段

```python
def build_context_memory(user_id, conversation_id):
    # 短期：最近對話
    recent_messages = get_recent_messages(conversation_id, limit=10)
    
    # 中期：使用者檔案
    user_profile = get_user_data(user_id)
    
    # 長期：歷史摘要
    historical_summary = get_conversation_summaries(user_id, exclude_current=True)
    
    return {
        'recent': recent_messages,
        'profile': user_profile,
        'history': historical_summary
    }
```

---

## 七、對話品質控制

### 7.1 對話品質指標

```python
def evaluate_conversation_quality(conversation_data):
    metrics = {
        'naturalness': 0,      # 對話自然度
        'information_gain': 0, # 資訊獲取量
        'user_engagement': 0,  # 使用者參與度
        'relationship_progress': 0  # 關係進展
    }
    
    # 自然度：檢查是否過度提問
    questions_per_message = count_questions(conversation_data) / len(conversation_data)
    metrics['naturalness'] = 1 - min(questions_per_message / 2, 1)
    
    # 資訊獲取：檢查新增的資訊量
    info_before = get_user_info_completeness(before_conversation)
    info_after = get_user_info_completeness(after_conversation)
    metrics['information_gain'] = info_after - info_before
    
    # 參與度：使用者訊息長度和頻率
    avg_user_message_length = get_avg_message_length(conversation_data, role='user')
    metrics['user_engagement'] = min(avg_user_message_length / 50, 1)
    
    # 關係進展
    metrics['relationship_progress'] = calculate_relationship_depth_change()
    
    return metrics
```

### 7.2 異常處理規則

```python
FALLBACK_RESPONSES = {
    'user_frustrated': "抱歉抱歉！我是不是問太多了？我們隨意聊就好～",
    'unclear_input': "欸不好意思，我沒聽懂你的意思，可以再說一次嗎？",
    'api_error': "哎呀，我剛剛恍神了一下😅 你剛說什麼？",
    'inappropriate_content': "嗯...這個話題我們換個聊好嗎？"
}
```

---

## 八、隱私與資料安全

### 8.1 資料使用原則

1. **透明化：** 首次對話告知會記錄偏好
2. **最小化：** 只記錄必要的對話資訊
3. **匿名化：** 不記錄真實姓名、身份證字號等
4. **可刪除：** 使用者可以清除所有對話記錄

### 8.2 敏感資訊過濾

```python
SENSITIVE_PATTERNS = [
    r'\d{10}',  # 電話號碼
    r'\d{4}-\d{4}-\d{4}-\d{4}',  # 信用卡號
    r'[A-Z]\d{9}',  # 身份證字號
    r'[\w\.-]+@[\w\.-]+\.\w+',  # Email
]

def sanitize_message(message):
    for pattern in SENSITIVE_PATTERNS:
        message = re.sub(pattern, '[已隱藏]', message)
    return message
```

---

## 九、系統擴展性設計

### 9.1 模組化架構

```
penghu-ai-companion/
├── core/
│   ├── conversation_manager.py   # 對話管理
│   ├── memory_system.py          # 記憶系統
│   ├── user_profile.py           # 使用者檔案
│   └── information_extractor.py  # 資訊提取
├── ai/
│   ├── prompt_builder.py         # Prompt構建
│   ├── api_client.py             # API客戶端
│   └── response_parser.py        # 回應解析
├── data/
│   ├── models.py                 # 資料模型
│   ├── database.py               # 資料庫操作
│   └── cache.py                  # 快取管理
└── utils/
    ├── logger.py                 # 日誌系統
    ├── security.py               # 安全工具
    └── analytics.py              # 分析工具
```

### 9.2 未來擴展方向

- **多模態支援：** 圖片、語音輸入
- **主動推送：** 依據計畫時間主動關心
- **社群功能：** 匿名配對相似興趣使用者
- **在地整合：** 連接澎湖店家、活動資訊

---

## 十、成功指標 (KPI)

### 10.1 核心指標

| 指標 | 目標值 | 測量方式 |
|------|--------|---------|
| 平均對話輪次 | > 5輪 | 每次對話的訊息數 |
| 使用者回訪率 | > 40% | 7天內再次登入比例 |
| 資訊完整度 | > 60% | 使用者檔案欄位填充率 |
| 對話自然度 | > 4.0/5.0 | 使用者滿意度評分 |
| 關係深度提升 | +15 pts/session | 每次對話的深度增長 |

### 10.2 進階指標

- **轉化率：** 潛在遊客 → 確定來訪的比例
- **推薦採納率：** AI建議被採納的比例
- **長期留存：** 30天內活躍使用者比例

---

## 十一、開發里程碑

### Phase 1: MVP (4-6週)
- [ ] 基礎對話介面
- [ ] 單一API整合 (Gemini)
- [ ] 簡易使用者檔案系統
- [ ] 基礎記憶功能

### Phase 2: 增強版 (6-8週)
- [ ] 多API智能切換
- [ ] 完整資訊提取系統
- [ ] 進階記憶機制
- [ ] 對話品質監控

### Phase 3: 完整版 (8-12週)
- [ ] 個人化推薦系統
- [ ] 主動關心功能
- [ ] 社群功能雛形
- [ ] 數據分析儀表板

---

## 附錄：參考資源

- OpenAI API Documentation: https://platform.openai.com/docs
- Google Gemini API: https://ai.google.dev/docs
- Prompt Engineering Guide: https://www.promptingguide.ai
- Conversation Design: https://developers.google.com/assistant/conversation-design

---

**文件版本：** v1.0  
**最後更新：** 2024-12-22  
**維護者：** 澎湖AI夥伴開發團隊