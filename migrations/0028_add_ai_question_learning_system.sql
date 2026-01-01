-- Migration number: 0028_add_ai_question_learning_system.sql
-- AI 問題學習系統資料表

-- AI 問題學習表（學習用戶問的問題和AI問的問題）
CREATE TABLE IF NOT EXISTS ai_question_learning (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    original_question TEXT NOT NULL, -- 原始問題（用戶或AI問的）
    question_type TEXT NOT NULL CHECK (question_type IN ('user_query', 'ai_question', 'effective_question')), -- 問題類型
    question_category TEXT, -- 'location', 'price', 'time', 'distance', 'memory', 'identity', 'general'
    extracted_intent TEXT, -- 提取的意圖（JSON格式）
    extracted_entities TEXT, -- 提取的實體（地點、時間等，JSON格式）
    question_quality_score REAL DEFAULT 0, -- 問題品質分數（0-1）
    led_to_successful_answer BOOLEAN DEFAULT false, -- 是否成功獲得答案
    answer_quality_score REAL, -- 答案品質分數（0-1）
    user_satisfaction INTEGER, -- 用戶滿意度（1-5）
    conversation_id TEXT, -- 關聯的對話ID
    location_id TEXT, -- 如果與地點相關
    context_type TEXT, -- 'local', 'visited_traveler', 'planning_traveler', 'merchant', 'general'
    clarity_score REAL DEFAULT 0, -- 清晰度分數（0-1）
    specificity_score REAL DEFAULT 0, -- 具體性分數（0-1）
    completeness_score REAL DEFAULT 0, -- 完整性分數（0-1）
    effectiveness_score REAL DEFAULT 0, -- 有效性分數（0-1，僅AI問題）
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_question_learning_question_type ON ai_question_learning (question_type);
CREATE INDEX IF NOT EXISTS idx_ai_question_learning_category ON ai_question_learning (question_category);
CREATE INDEX IF NOT EXISTS idx_ai_question_learning_quality_score ON ai_question_learning (question_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_question_learning_success ON ai_question_learning (led_to_successful_answer);
CREATE INDEX IF NOT EXISTS idx_ai_question_learning_conversation_id ON ai_question_learning (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_question_learning_location_id ON ai_question_learning (location_id);
CREATE INDEX IF NOT EXISTS idx_ai_question_learning_context_type ON ai_question_learning (context_type);

-- AI 問題模板表（儲存有效的問題模式）
CREATE TABLE IF NOT EXISTS ai_question_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    template_text TEXT NOT NULL, -- 問題模板（可包含變數，例如：{location_name}）
    template_type TEXT NOT NULL, -- 'identity', 'location', 'price', 'time', 'memory', 'distance', 'general'
    context_type TEXT, -- 'local', 'visited_traveler', 'planning_traveler', 'merchant', 'general'
    variables TEXT, -- 模板變數（JSON格式，例如：["location_name", "time_period"]）
    success_rate REAL DEFAULT 0, -- 成功率（0-1）
    usage_count INTEGER DEFAULT 0, -- 使用次數
    average_response_quality REAL DEFAULT 0, -- 平均回答品質
    average_question_quality REAL DEFAULT 0, -- 平均問題品質
    is_active BOOLEAN DEFAULT true, -- 是否啟用
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_question_templates_template_type ON ai_question_templates (template_type);
CREATE INDEX IF NOT EXISTS idx_ai_question_templates_context_type ON ai_question_templates (context_type);
CREATE INDEX IF NOT EXISTS idx_ai_question_templates_success_rate ON ai_question_templates (success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_ai_question_templates_is_active ON ai_question_templates (is_active);
CREATE INDEX IF NOT EXISTS idx_ai_question_templates_usage_count ON ai_question_templates (usage_count DESC);

-- AI 問題改進記錄表（追蹤問題改進過程）
CREATE TABLE IF NOT EXISTS ai_question_improvements (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    original_question_id TEXT, -- 原始問題ID
    improved_question TEXT NOT NULL, -- 改進後的問題
    improvement_reason TEXT, -- 改進原因
    improvement_type TEXT, -- 'clarity', 'specificity', 'context', 'structure', 'completeness'
    before_score REAL, -- 改進前分數
    after_score REAL, -- 改進後分數
    was_effective BOOLEAN, -- 改進是否有效
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_question_id) REFERENCES ai_question_learning(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_question_improvements_original_question_id ON ai_question_improvements (original_question_id);
CREATE INDEX IF NOT EXISTS idx_ai_question_improvements_improvement_type ON ai_question_improvements (improvement_type);
CREATE INDEX IF NOT EXISTS idx_ai_question_improvements_was_effective ON ai_question_improvements (was_effective);

