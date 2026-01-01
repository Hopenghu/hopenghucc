# AI 問題學習系統 - 實作完成報告

## 📋 實作概述

已成功實作 AI 問題學習系統，讓 AI 不僅會回答問題，也能學會問更好的問題。

## ✅ 已完成的功能

### 1. 資料庫遷移檔案
**檔案**: `migrations/0028_add_ai_question_learning_system.sql`

**新增資料表**:
- `ai_question_learning` - 記錄所有問題（用戶和AI問的）的學習資料
- `ai_question_templates` - 儲存有效的問題模板
- `ai_question_improvements` - 追蹤問題改進過程

### 2. QuestionAnalysisService 服務類別
**檔案**: `src/services/QuestionAnalysisService.js`

**核心功能**:
- ✅ 分析用戶問題的品質（清晰度、具體性、完整性、結構性）
- ✅ 分析AI問的問題的有效性
- ✅ 提取問題模板（從成功問題中學習）
- ✅ 改進問題品質（使用學習到的模板）
- ✅ 評估答案品質

**問題分析指標**:
- 清晰度分數（0-1）
- 具體性分數（0-1）
- 完整性分數（0-1）
- 結構性分數（0-1）
- 總體品質分數（0-1）

### 3. 整合到 AIService
**檔案**: `src/services/AIService.js`

**整合功能**:
- ✅ 在用戶問問題時自動分析問題品質
- ✅ 在AI問問題時使用學習到的模板改進問題
- ✅ 評估答案品質並更新學習記錄
- ✅ 記錄AI問的問題以便學習

**工作流程**:
1. 用戶問問題 → 分析問題品質 → 記錄學習
2. AI生成問題 → 使用最佳模板改進 → 記錄AI問題
3. AI回答問題 → 評估答案品質 → 更新問題學習記錄
4. 定期提取模板 → 更新模板庫

### 4. API 端點更新
**檔案**: `src/api/ai-admin.js`

**新增管理端點**:
- `GET /api/ai/admin/question-learning` - 查看問題學習記錄
- `GET /api/ai/admin/question-templates` - 查看問題模板
- `POST /api/ai/admin/question-templates/extract` - 觸發模板提取
- `GET /api/ai/admin/question-improvements` - 查看問題改進記錄

## 🔄 系統運作流程

### 問題學習流程

```
用戶問問題
  ↓
分析問題品質（清晰度、具體性、完整性、結構性）
  ↓
記錄到 ai_question_learning 表
  ↓
AI回答問題
  ↓
評估答案品質
  ↓
更新問題學習記錄（標記是否成功獲得答案）
```

### 問題改進流程

```
AI需要問問題
  ↓
生成原始問題
  ↓
查詢最佳問題模板（根據類別和上下文）
  ↓
應用模板改進問題
  ↓
記錄AI問題（用於學習）
  ↓
向用戶提問
  ↓
用戶回答
  ↓
評估問題有效性
  ↓
更新模板成功率
```

### 模板提取流程

```
定期執行（或手動觸發）
  ↓
查詢成功率高於閾值的問題
  ↓
分析問題模式
  ↓
提取問題模板
  ↓
儲存到 ai_question_templates 表
  ↓
更新模板統計（成功率、使用次數）
```

## 📊 資料表結構

### ai_question_learning
記錄所有問題的學習資料：
- `original_question` - 原始問題
- `question_type` - 問題類型（user_query, ai_question）
- `question_category` - 問題類別（location, price, time, memory, identity）
- `question_quality_score` - 品質分數
- `led_to_successful_answer` - 是否成功獲得答案
- `answer_quality_score` - 答案品質分數
- `clarity_score`, `specificity_score`, `completeness_score` - 各項指標

### ai_question_templates
儲存有效的問題模板：
- `template_text` - 模板文字（可包含變數）
- `template_type` - 模板類型
- `context_type` - 上下文類型
- `variables` - 模板變數（JSON格式）
- `success_rate` - 成功率
- `usage_count` - 使用次數
- `average_question_quality` - 平均問題品質

### ai_question_improvements
追蹤問題改進過程：
- `original_question_id` - 原始問題ID
- `improved_question` - 改進後的問題
- `improvement_type` - 改進類型
- `before_score` / `after_score` - 改進前後分數

## 🎯 使用方式

### 1. 執行資料庫遷移

```bash
# 本地測試
npm run migrate

# 生產環境
npm run migrate:remote
```

### 2. 系統自動運作

系統會自動：
- 分析所有用戶問題
- 分析所有AI問題
- 使用最佳模板改進問題
- 記錄學習資料

### 3. 手動觸發模板提取

```bash
# 透過管理後台API
POST /api/ai/admin/question-templates/extract
{
  "minSuccessRate": 0.7,
  "minQualityScore": 0.7
}
```

### 4. 查看學習記錄

```bash
# 查看問題學習記錄
GET /api/ai/admin/question-learning?page=1&pageSize=20

# 查看問題模板
GET /api/ai/admin/question-templates?templateType=location

# 查看問題改進記錄
GET /api/ai/admin/question-improvements?page=1&pageSize=20
```

## 🔍 問題分類

系統會自動分類問題：

- **location** - 地點相關（哪裡、位置、在哪）
- **price** - 價格相關（多少錢、費用、消費）
- **time** - 時間相關（多久、幾點、營業時間）
- **distance** - 距離相關（多遠、怎麼去、路線）
- **memory** - 回憶相關（體驗、感受、分享）
- **identity** - 身份相關（是、居民、旅客）
- **general** - 一般問題

## 📈 預期效果

1. **問題品質提升**
   - AI會學習哪些問題有效
   - 自動改進問題的清晰度、具體性
   - 根據上下文選擇最佳問題模板

2. **答案品質提升**
   - 更好的問題 → 更好的答案
   - 系統會追蹤問題與答案的關聯
   - 持續優化問題模板

3. **系統自我學習**
   - 從每次對話中學習
   - 自動提取有效問題模式
   - 持續改進問問題的能力

## 🚀 下一步改進

### 短期（1-2週）
- [ ] 整合地點識別服務到實體提取
- [ ] 改進模板變數識別（使用NLP）
- [ ] 添加問題相似度檢測（避免重複模板）

### 中期（1個月）
- [ ] 使用向量嵌入進行問題相似度匹配
- [ ] 實現更智能的模板應用邏輯
- [ ] 添加問題改進建議功能

### 長期（3個月）
- [ ] 使用機器學習模型預測問題有效性
- [ ] 實現個性化問題生成（根據用戶歷史）
- [ ] 建立問題品質預測模型

## 📝 注意事項

1. **資料庫遷移**: 必須先執行遷移才能使用新功能
2. **性能考量**: 問題分析是異步進行，不會影響主要功能
3. **模板提取**: 建議定期執行（例如每週一次）以更新模板庫
4. **學習資料**: 系統會持續累積學習資料，建議定期備份

## 🎉 完成狀態

✅ 所有核心功能已實作完成
✅ 資料庫遷移檔案已建立
✅ 服務類別已建立並整合
✅ API端點已更新
✅ 無 linter 錯誤

系統現在可以：
- 學習用戶問的問題
- 學習AI問的問題
- 使用學習到的模板改進問題
- 持續優化問問題的能力

---

*實作完成日期: 2025-01-XX*
*版本: 1.0.0*

