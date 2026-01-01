-- Migration: Add Itinerary Tables
-- Description: 建立行程相關的資料表結構
-- Date: 2025-01-23

-- 行程主表
CREATE TABLE IF NOT EXISTS itineraries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 行程天數表
CREATE TABLE IF NOT EXISTS itinerary_days (
  id TEXT PRIMARY KEY,
  itinerary_id TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  date TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

-- 行程項目表
CREATE TABLE IF NOT EXISTS itinerary_items (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL,
  place_id TEXT,
  place_name TEXT NOT NULL,
  start_time TEXT,
  duration INTEGER,
  order_index INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_updated_at ON itineraries(updated_at);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary_id ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_day_number ON itinerary_days(day_number);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_id ON itinerary_items(day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_place_id ON itinerary_items(place_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_order_index ON itinerary_items(order_index);

