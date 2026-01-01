-- 建立使用者知識貢獻表
CREATE TABLE IF NOT EXISTS user_knowledge_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT, -- 關聯到 users 表 (可選，如果是匿名用戶則為 NULL)
  session_id TEXT NOT NULL, -- 關聯到 ai_conversations 表
  content TEXT NOT NULL, -- 原始內容
  extracted_data TEXT, -- 結構化數據 (JSON)
  category TEXT DEFAULT 'general', -- 分類 (food, spot, story, general)
  status TEXT DEFAULT 'pending', -- 狀態 (pending, approved, rejected)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON user_knowledge_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_session_id ON user_knowledge_contributions(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON user_knowledge_contributions(status);
