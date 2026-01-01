-- Migration number: 0023 	 2025-01-19
-- 澎湖時光島主遊戲系統 - 三元協同架構

-- 1. 擴展用戶角色系統，支持三元角色（游客、店家、在地人）
ALTER TABLE users ADD COLUMN game_role TEXT DEFAULT 'visitor' CHECK (game_role IN ('visitor', 'merchant', 'local'));
ALTER TABLE users ADD COLUMN game_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN game_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN game_badges TEXT DEFAULT '[]'; -- JSON array of badge IDs
ALTER TABLE users ADD COLUMN last_visit_date TEXT; -- 最後訪問澎湖日期
ALTER TABLE users ADD COLUMN visit_count INTEGER DEFAULT 0; -- 訪問澎湖次數

-- 2. 創建記憶膠囊表
CREATE TABLE IF NOT EXISTS memory_capsules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    photo_url TEXT,
    capsule_type TEXT DEFAULT 'memory' CHECK (capsule_type IN ('memory', 'story', 'review')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- 3. 創建店家回覆表
CREATE TABLE IF NOT EXISTS merchant_replies (
    id TEXT PRIMARY KEY,
    capsule_id TEXT NOT NULL,
    merchant_user_id TEXT NOT NULL,
    reply_content TEXT NOT NULL,
    reply_type TEXT DEFAULT 'greeting' CHECK (reply_type IN ('greeting', 'story', 'invitation', 'discount')),
    special_offer TEXT, -- 特殊優惠或暗號
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (capsule_id) REFERENCES memory_capsules(id),
    FOREIGN KEY (merchant_user_id) REFERENCES users(id)
);

-- 4. 創建勳章系統表
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_type TEXT NOT NULL CHECK (badge_type IN ('visitor', 'merchant', 'local', 'special')),
    requirements TEXT, -- JSON object describing requirements
    points_reward INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. 創建用戶勳章關聯表
CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id),
    UNIQUE(user_id, badge_id)
);

-- 6. 創建遊戲任務表
CREATE TABLE IF NOT EXISTS game_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('memory_upload', 'merchant_reply', 'local_story', 'visit_location')),
    target_role TEXT NOT NULL CHECK (target_role IN ('visitor', 'merchant', 'local', 'all')),
    points_reward INTEGER DEFAULT 0,
    badge_reward TEXT, -- badge_id
    requirements TEXT, -- JSON object
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. 創建用戶任務完成記錄表
CREATE TABLE IF NOT EXISTS user_task_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES game_tasks(id),
    UNIQUE(user_id, task_id)
);

-- 8. 創建演化指標追蹤表
CREATE TABLE IF NOT EXISTS evolution_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('return_visit_rate', 'interaction_rate', 'memory_creation_rate', 'merchant_engagement_rate')),
    metric_value REAL NOT NULL,
    measurement_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_users_game_role ON users (game_role);
CREATE INDEX IF NOT EXISTS idx_users_game_level ON users (game_level);
CREATE INDEX IF NOT EXISTS idx_memory_capsules_user_id ON memory_capsules (user_id);
CREATE INDEX IF NOT EXISTS idx_memory_capsules_location_id ON memory_capsules (location_id);
CREATE INDEX IF NOT EXISTS idx_merchant_replies_capsule_id ON merchant_replies (capsule_id);
CREATE INDEX IF NOT EXISTS idx_merchant_replies_merchant_id ON merchant_replies (merchant_user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_user_id ON user_task_completions (user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_metrics_user_id ON evolution_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_metrics_type ON evolution_metrics (metric_type);

-- 插入初始勳章數據
INSERT INTO badges (id, name, description, badge_type, points_reward, requirements) VALUES
('first_memory', '初來乍到', '上傳第一張澎湖記憶', 'visitor', 10, '{"memory_count": 1}'),
('memory_collector', '記憶收藏家', '上傳10張澎湖記憶', 'visitor', 50, '{"memory_count": 10}'),
('frequent_visitor', '常客', '訪問澎湖3次以上', 'visitor', 100, '{"visit_count": 3}'),
('merchant_welcomer', '友善店家', '回覆10個記憶膠囊', 'merchant', 50, '{"reply_count": 10}'),
('local_storyteller', '在地說書人', '分享5個在地故事', 'local', 75, '{"story_count": 5}'),
('island_master', '時光島主', '達到最高等級', 'special', 500, '{"level": 10}');

-- 插入初始任務數據
INSERT INTO game_tasks (id, title, description, task_type, target_role, points_reward, badge_reward, requirements) VALUES
('upload_first_memory', '上傳第一張記憶', '在澎湖的任何地點上傳你的第一張記憶膠囊', 'memory_upload', 'visitor', 10, 'first_memory', '{"memory_count": 1}'),
('reply_to_visitor', '回覆遊客記憶', '回覆一個遊客的記憶膠囊，分享你的故事', 'merchant_reply', 'merchant', 15, NULL, '{"reply_count": 1}'),
('share_local_story', '分享在地故事', '分享一個關於澎湖的在地故事', 'local_story', 'local', 20, NULL, '{"story_count": 1}'),
('visit_new_location', '探索新地點', '標記一個新的澎湖地點為「來過」', 'visit_location', 'all', 5, NULL, '{"visit_count": 1}');
