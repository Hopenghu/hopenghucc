-- Migration number: 0035
-- 添加對話階段系統和關係深度追蹤
-- 整合 penghu_ai_core_model.md 的核心概念

-- 1. 擴展 ai_conversation_states 表，添加對話階段和關係深度字段
ALTER TABLE ai_conversation_states ADD COLUMN conversation_stage TEXT DEFAULT 'initial' CHECK (conversation_stage IN ('initial', 'getting_to_know', 'familiar', 'friend'));
ALTER TABLE ai_conversation_states ADD COLUMN total_rounds INTEGER DEFAULT 0;
ALTER TABLE ai_conversation_states ADD COLUMN relationship_depth REAL DEFAULT 0.0;

CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_stage ON ai_conversation_states (conversation_stage);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_relationship_depth ON ai_conversation_states (relationship_depth);

-- 2. 擴展 ai_conversations 表，添加元數據字段（用於存儲提取的信息和 AI 決策）
ALTER TABLE ai_conversations ADD COLUMN metadata TEXT; -- JSON 格式，存儲 extractedInfo 和 aiDecision

CREATE INDEX IF NOT EXISTS idx_ai_conversations_metadata ON ai_conversations (metadata);

-- 3. 創建用戶關係檔案表（存儲用戶的長期關係信息）
CREATE TABLE IF NOT EXISTS user_relationship_profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    session_id TEXT,
    relationship_depth REAL DEFAULT 0.0,
    conversation_stage TEXT DEFAULT 'initial' CHECK (conversation_stage IN ('initial', 'getting_to_know', 'familiar', 'friend')),
    total_rounds INTEGER DEFAULT 0,
    profile_completeness REAL DEFAULT 0.0, -- 0-1，資訊完整度
    preference_count INTEGER DEFAULT 0, -- 偏好數量
    revisit_count INTEGER DEFAULT 0, -- 回訪次數
    last_interaction_at TEXT,
    first_interaction_at TEXT,
    remembered_facts TEXT, -- JSON 格式，存儲重要事實
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_relationship_profiles_user_id ON user_relationship_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationship_profiles_session_id ON user_relationship_profiles (session_id);
CREATE INDEX IF NOT EXISTS idx_user_relationship_profiles_stage ON user_relationship_profiles (conversation_stage);

-- 4. 創建對話摘要表（用於長期記憶）
CREATE TABLE IF NOT EXISTS conversation_summaries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    session_id TEXT,
    summary_text TEXT NOT NULL,
    key_topics TEXT, -- JSON 格式，關鍵話題
    important_facts TEXT, -- JSON 格式，重要事實
    conversation_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON conversation_summaries (user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_session_id ON conversation_summaries (session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_date ON conversation_summaries (conversation_date);
