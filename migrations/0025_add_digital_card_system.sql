-- Migration number: 0025_add_digital_card_system.sql
-- 數位卡牌系統資料表

-- 卡牌基本資訊表
CREATE TABLE IF NOT EXISTS digital_cards (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    card_code TEXT NOT NULL UNIQUE, -- 16位卡牌編碼
    card_type TEXT NOT NULL DEFAULT 'user' CHECK (card_type IN ('user', 'merchant', 'special')),
    card_name TEXT NOT NULL,
    card_description TEXT,
    card_image_url TEXT,
    card_rarity TEXT DEFAULT 'common' CHECK (card_rarity IN ('common', 'rare', 'epic', 'legendary')),
    original_price INTEGER NOT NULL, -- 原始價格（分）
    current_owner_id TEXT,
    original_owner_id TEXT,
    activation_required BOOLEAN DEFAULT true,
    activation_conditions TEXT, -- JSON string for activation requirements
    expiration_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_owner_id) REFERENCES users(id),
    FOREIGN KEY (original_owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_digital_cards_code ON digital_cards (card_code);
CREATE INDEX IF NOT EXISTS idx_digital_cards_owner ON digital_cards (current_owner_id);
CREATE INDEX IF NOT EXISTS idx_digital_cards_type ON digital_cards (card_type);

-- 卡牌包資訊表
CREATE TABLE IF NOT EXISTS card_packages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    package_name TEXT NOT NULL,
    package_description TEXT,
    package_type TEXT NOT NULL DEFAULT 'user' CHECK (package_type IN ('user', 'merchant')),
    price INTEGER NOT NULL, -- 價格（分）
    main_cards_count INTEGER DEFAULT 1,
    gift_cards_count INTEGER DEFAULT 5,
    total_value INTEGER NOT NULL, -- 總價值（分）
    is_active BOOLEAN DEFAULT true,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 用戶卡牌持有記錄表
CREATE TABLE IF NOT EXISTS user_cards (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    acquisition_type TEXT NOT NULL DEFAULT 'purchase' CHECK (acquisition_type IN ('purchase', 'gift', 'transfer')),
    acquisition_date TEXT DEFAULT CURRENT_TIMESTAMP,
    is_activated BOOLEAN DEFAULT false,
    activation_date TEXT,
    activation_location_id TEXT,
    activation_photo_url TEXT,
    is_used BOOLEAN DEFAULT false,
    usage_date TEXT,
    usage_location_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES digital_cards(id),
    FOREIGN KEY (activation_location_id) REFERENCES locations(id),
    FOREIGN KEY (usage_location_id) REFERENCES locations(id)
);

CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_card_id ON user_cards (card_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_activated ON user_cards (is_activated);

-- 卡牌交易記錄表
CREATE TABLE IF NOT EXISTS card_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    card_id TEXT NOT NULL,
    from_user_id TEXT,
    to_user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'gift', 'transfer', 'activation', 'usage')),
    transaction_amount INTEGER DEFAULT 0, -- 交易金額（分）
    transaction_fee INTEGER DEFAULT 0, -- 平台手續費（分）
    transaction_status TEXT DEFAULT 'pending' CHECK (transaction_status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method TEXT,
    payment_reference TEXT,
    transaction_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (card_id) REFERENCES digital_cards(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions (card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_from_user ON card_transactions (from_user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_to_user ON card_transactions (to_user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_status ON card_transactions (transaction_status);

-- 卡牌優惠券表
CREATE TABLE IF NOT EXISTS card_coupons (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    card_id TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    coupon_name TEXT NOT NULL,
    coupon_description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_one_get_one')),
    discount_value INTEGER NOT NULL, -- 折扣值（百分比或固定金額）
    min_purchase_amount INTEGER DEFAULT 0, -- 最低消費金額
    max_discount_amount INTEGER, -- 最大折扣金額
    usage_limit INTEGER DEFAULT 1, -- 使用次數限制
    used_count INTEGER DEFAULT 0, -- 已使用次數
    is_active BOOLEAN DEFAULT true,
    valid_from TEXT DEFAULT CURRENT_TIMESTAMP,
    valid_until TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES digital_cards(id),
    FOREIGN KEY (merchant_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_card_coupons_card_id ON card_coupons (card_id);
CREATE INDEX IF NOT EXISTS idx_card_coupons_merchant_id ON card_coupons (merchant_id);
CREATE INDEX IF NOT EXISTS idx_card_coupons_active ON card_coupons (is_active);

-- 卡牌激活記錄表
CREATE TABLE IF NOT EXISTS card_activations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    card_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    activation_method TEXT NOT NULL CHECK (activation_method IN ('photo_upload', 'location_checkin', 'social_share')),
    activation_data TEXT, -- JSON string for activation details
    location_id TEXT,
    photo_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    verified_by TEXT,
    verified_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES digital_cards(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_card_activations_card_id ON card_activations (card_id);
CREATE INDEX IF NOT EXISTS idx_card_activations_user_id ON card_activations (user_id);
CREATE INDEX IF NOT EXISTS idx_card_activations_status ON card_activations (verification_status);

-- 插入預設卡牌包
INSERT OR IGNORE INTO card_packages (id, package_name, package_description, package_type, price, main_cards_count, gift_cards_count, total_value, created_at) VALUES
('user-package-99', '澎湖時光島主卡包', '1張主卡 + 5張贈送卡，總價值450元', 'user', 9900, 1, 5, 45000, datetime('now')),
('merchant-package-299', '店家引流卡包', '10張主卡 + 50張贈送卡，總價值4500元', 'merchant', 29900, 10, 50, 450000, datetime('now'));

-- 插入預設卡牌類型
INSERT OR IGNORE INTO digital_cards (id, card_code, card_type, card_name, card_description, card_rarity, original_price, activation_required, activation_conditions, created_at) VALUES
('card-main-user', 'MAIN000000000001', 'user', '澎湖時光島主卡', '專屬優惠權益，無限使用', 'legendary', 20000, true, '{"photo_upload": true, "location_verification": true}', datetime('now')),
('card-gift-user', 'GIFT000000000001', 'user', '澎湖回憶分享卡', '一次性優惠券，需要激活', 'common', 5000, true, '{"photo_upload": true, "social_share": true}', datetime('now')),
('card-main-merchant', 'MERC000000000001', 'merchant', '店家專屬卡', '店家專用優惠券分發卡', 'epic', 20000, false, '{}', datetime('now')),
('card-gift-merchant', 'MERG000000000001', 'merchant', '店家贈送卡', '店家分發給客戶的優惠卡', 'common', 5000, true, '{"photo_upload": true}', datetime('now'));
