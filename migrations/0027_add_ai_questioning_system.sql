-- Migration number: 0027_add_ai_questioning_system.sql
-- AI 問問題系統資料表

-- 擴展 users 表：加入使用者類型
ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'traveler' CHECK (user_type IN ('traveler', 'merchant', 'local'));
ALTER TABLE users ADD COLUMN is_merchant BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users (user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_merchant ON users (is_merchant);

-- 擴展 locations 表：加入商家固定資訊
ALTER TABLE locations ADD COLUMN opening_hours TEXT; -- JSON 格式：{"monday": "09:00-18:00", ...}
ALTER TABLE locations ADD COLUMN business_type TEXT; -- 商家類型：restaurant, hotel, attraction, shop, etc.
ALTER TABLE locations ADD COLUMN is_merchant BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_locations_is_merchant ON locations (is_merchant);
CREATE INDEX IF NOT EXISTS idx_locations_business_type ON locations (business_type);

-- 商家產品表（固定資訊：產品、價格、消費時間）
CREATE TABLE IF NOT EXISTS merchant_products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    location_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_description TEXT,
    price INTEGER, -- 價格（分），可為 NULL（免費或價格面議）
    duration_minutes INTEGER, -- 消費所需時間（分鐘），可為 NULL
    category TEXT, -- 產品類別
    is_active BOOLEAN DEFAULT true,
    created_by_user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_products_location_id ON merchant_products (location_id);
CREATE INDEX IF NOT EXISTS idx_merchant_products_created_by_user_id ON merchant_products (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_products_is_active ON merchant_products (is_active);

-- 旅遊回憶表（感覺資訊：回憶、感受、未來計劃）
CREATE TABLE IF NOT EXISTS travel_memories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    memory_content TEXT NOT NULL, -- 回憶內容
    visited_date TEXT, -- 造訪日期（YYYY-MM-DD）
    companions TEXT, -- 同行人員（JSON 陣列）
    want_to_revisit BOOLEAN DEFAULT false, -- 是否想再次造訪
    revisit_reason TEXT, -- 想再次造訪的原因
    rating INTEGER, -- 個人評分（1-5）
    tags TEXT, -- 標籤（JSON 陣列）
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_travel_memories_user_id ON travel_memories (user_id);
CREATE INDEX IF NOT EXISTS idx_travel_memories_location_id ON travel_memories (location_id);
CREATE INDEX IF NOT EXISTS idx_travel_memories_visited_date ON travel_memories (visited_date);
CREATE INDEX IF NOT EXISTS idx_travel_memories_want_to_revisit ON travel_memories (want_to_revisit);

-- 地點距離快取表（固定資訊：距離、時間）
CREATE TABLE IF NOT EXISTS location_distances (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    from_location_id TEXT NOT NULL,
    to_location_id TEXT NOT NULL,
    distance_meters INTEGER NOT NULL, -- 距離（公尺）
    duration_seconds INTEGER NOT NULL, -- 時間（秒）
    distance_text TEXT, -- 人類可讀的距離文字（例如："5.2 公里"）
    duration_text TEXT, -- 人類可讀的時間文字（例如："15 分鐘"）
    travel_mode TEXT DEFAULT 'driving' CHECK (travel_mode IN ('driving', 'walking', 'bicycling', 'transit')),
    cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT, -- 快取過期時間（建議 30 天）
    FOREIGN KEY (from_location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (to_location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE(from_location_id, to_location_id, travel_mode)
);

CREATE INDEX IF NOT EXISTS idx_location_distances_from_location ON location_distances (from_location_id);
CREATE INDEX IF NOT EXISTS idx_location_distances_to_location ON location_distances (to_location_id);
CREATE INDEX IF NOT EXISTS idx_location_distances_expires_at ON location_distances (expires_at);

-- AI 對話狀態表（追蹤問問題的進度）
CREATE TABLE IF NOT EXISTS ai_conversation_states (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL,
    user_id TEXT, -- 可為 NULL（未登入使用者）
    conversation_type TEXT NOT NULL CHECK (conversation_type IN ('merchant_setup', 'traveler_memory', 'distance_query', 'general')),
    current_step TEXT, -- 當前問問題的步驟
    context_data TEXT, -- JSON 格式，儲存對話上下文
    collected_data TEXT, -- JSON 格式，儲存已收集的資訊
    is_complete BOOLEAN DEFAULT false,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_session_id ON ai_conversation_states (session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_user_id ON ai_conversation_states (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_type ON ai_conversation_states (conversation_type);

-- 固定資訊記錄表（記錄所有收集到的固定資訊）
CREATE TABLE IF NOT EXISTS fixed_information (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    information_type TEXT NOT NULL CHECK (information_type IN ('flight', 'product_price', 'distance_time', 'business_hours', 'consumption_time')),
    location_id TEXT, -- 如果與地點相關
    user_id TEXT, -- 提供資訊的使用者
    information_key TEXT NOT NULL, -- 資訊的鍵（例如：產品名稱、航班號碼）
    information_value TEXT NOT NULL, -- 資訊的值（JSON 格式）
    source_conversation_id TEXT, -- 來源對話 ID
    is_verified BOOLEAN DEFAULT false, -- 是否已驗證
    verified_by TEXT, -- 驗證者（管理員或多人確認）
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (source_conversation_id) REFERENCES ai_conversations(id)
);

CREATE INDEX IF NOT EXISTS idx_fixed_information_type ON fixed_information (information_type);
CREATE INDEX IF NOT EXISTS idx_fixed_information_location_id ON fixed_information (location_id);
CREATE INDEX IF NOT EXISTS idx_fixed_information_user_id ON fixed_information (user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_information_is_verified ON fixed_information (is_verified);
