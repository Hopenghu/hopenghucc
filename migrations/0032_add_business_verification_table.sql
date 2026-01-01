-- Migration: 0032_add_business_verification_table.sql
-- 建立商家驗證系統表
-- 創建時間: 2025-01-20

-- 商家驗證表
CREATE TABLE IF NOT EXISTS business_verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  location_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  google_place_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
  verification_method TEXT CHECK(verification_method IN ('manual_review', 'google_api', 'dns', 'phone', 'email')),
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  verified_by TEXT, -- admin user_id
  notes TEXT, -- 管理員備註
  rejection_reason TEXT, -- 拒絕原因
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(location_id, user_id) -- 每個用戶對每個地點只能有一個驗證申請
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_business_verifications_location_id ON business_verifications(location_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_user_id ON business_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_status ON business_verifications(status);
CREATE INDEX IF NOT EXISTS idx_business_verifications_google_place_id ON business_verifications(google_place_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_requested_at ON business_verifications(requested_at);

