-- Migration number: 0026_add_ai_system.sql
-- AI 對話系統資料表

-- AI 對話記錄表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT, -- 可為 NULL，未登入用戶也可以使用
    session_id TEXT, -- 未登入用戶的會話 ID
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
    message_content TEXT NOT NULL,
    context_data TEXT, -- JSON string for additional context
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations (created_at);

-- AI 學習資料表（記錄常見問題和答案）
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source_type TEXT DEFAULT 'user' CHECK (source_type IN ('user', 'admin', 'system')),
    source_user_id TEXT,
    location_id TEXT, -- 如果問題與特定地點相關
    usage_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_user_id) REFERENCES users(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_question ON ai_knowledge_base (question);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_location_id ON ai_knowledge_base (location_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_usage_count ON ai_knowledge_base (usage_count DESC);

-- AI 反饋記錄表
CREATE TABLE IF NOT EXISTS ai_feedback (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    conversation_id TEXT,
    user_id TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'suggestion')),
    feedback_content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation_id ON ai_feedback (conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback (user_id);
