-- Migration: 0031_add_scheduler_history_table.sql
-- 建立排程任務歷史表
-- 創建時間: 2025-01-21

-- 排程任務歷史表
CREATE TABLE IF NOT EXISTS scheduler_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_type TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  success INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_scheduler_history_task_type ON scheduler_history(task_type);
CREATE INDEX IF NOT EXISTS idx_scheduler_history_executed_at ON scheduler_history(executed_at);

