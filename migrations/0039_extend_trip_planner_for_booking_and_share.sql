-- Migration: Extend Trip Planner for Booking and Share
-- Description: 擴展行程規劃功能，支援預訂狀態追蹤和行程分享
-- Date: 2025-01-23

-- 擴展 trip_plan_items 表：添加預訂相關欄位
ALTER TABLE trip_plan_items ADD COLUMN booking_status TEXT DEFAULT 'planned';
ALTER TABLE trip_plan_items ADD COLUMN booking_url TEXT;
ALTER TABLE trip_plan_items ADD COLUMN booking_phone TEXT;
ALTER TABLE trip_plan_items ADD COLUMN booking_notes TEXT;

-- 擴展 trip_plans 表：添加分享相關欄位
ALTER TABLE trip_plans ADD COLUMN share_token TEXT UNIQUE;
ALTER TABLE trip_plans ADD COLUMN is_public INTEGER DEFAULT 0;

-- 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_trip_plan_items_booking_status ON trip_plan_items(booking_status);
CREATE INDEX IF NOT EXISTS idx_trip_plans_share_token ON trip_plans(share_token);
CREATE INDEX IF NOT EXISTS idx_trip_plans_is_public ON trip_plans(is_public);

-- 注意：
-- booking_status 可能的值：'planned', 'booked', 'completed', 'cancelled'
-- is_public: 0 = 私密, 1 = 公開分享

