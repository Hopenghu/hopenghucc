-- Migration: Add Ecosystem Tracking Tables
-- 為 EcosystemService 創建數據表
-- 符合「服務生命，讓世界更好更平衡」的理念

-- 用戶福祉追蹤表
CREATE TABLE IF NOT EXISTS user_wellbeing_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  satisfaction_score REAL, -- 滿意度分數 (0-100)
  engagement_score REAL, -- 參與度分數 (0-100)
  experience_score REAL, -- 體驗分數 (0-100)
  tracked_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT, -- JSON 格式的額外數據
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 資源使用追蹤表
CREATE TABLE IF NOT EXISTS resource_usage_tracking (
  id TEXT PRIMARY KEY,
  api_calls INTEGER DEFAULT 0, -- API 調用次數
  ai_calls INTEGER DEFAULT 0, -- AI 調用次數
  storage_mb REAL DEFAULT 0, -- 存儲使用量 (MB)
  bandwidth_mb REAL DEFAULT 0, -- 帶寬使用量 (MB)
  cost_usd REAL DEFAULT 0, -- 成本 (USD)
  tracked_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT, -- JSON 格式的額外數據
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 社區健康追蹤表
CREATE TABLE IF NOT EXISTS community_health_tracking (
  id TEXT PRIMARY KEY,
  active_users INTEGER DEFAULT 0, -- 活躍用戶數
  interactions INTEGER DEFAULT 0, -- 互動次數
  content_diversity REAL DEFAULT 0, -- 內容多樣性分數 (0-100)
  engagement_rate REAL DEFAULT 0, -- 參與率 (0-100)
  tracked_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT, -- JSON 格式的額外數據
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_user_wellbeing_user_id ON user_wellbeing_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wellbeing_tracked_at ON user_wellbeing_tracking(tracked_at);
CREATE INDEX IF NOT EXISTS idx_resource_usage_tracked_at ON resource_usage_tracking(tracked_at);
CREATE INDEX IF NOT EXISTS idx_community_health_tracked_at ON community_health_tracking(tracked_at);

-- 添加註釋說明
-- 這些表用於追蹤網站的生態健康狀況
-- 符合「服務生命，讓世界更好更平衡」的理念

