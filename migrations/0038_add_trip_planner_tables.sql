-- Migration: Add Trip Planner Tables
-- Description: 建立行程規劃相關的資料表結構
-- Date: 2025-01-23

-- 行程規劃主表
CREATE TABLE IF NOT EXISTS trip_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 行程規劃項目表
CREATE TABLE IF NOT EXISTS trip_plan_items (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  place_id TEXT NOT NULL,  -- Google Place ID
  time TEXT,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trip_plans(id) ON DELETE CASCADE
);

-- 注意：place_id 存儲的是 Google Place ID，不是 locations 表的 id

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_updated_at ON trip_plans(updated_at);
CREATE INDEX IF NOT EXISTS idx_trip_plan_items_trip_id ON trip_plan_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_plan_items_day_index ON trip_plan_items(day_index);
CREATE INDEX IF NOT EXISTS idx_trip_plan_items_order_index ON trip_plan_items(order_index);

