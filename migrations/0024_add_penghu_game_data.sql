-- Migration number: 0024_add_penghu_game_data.sql
-- 添加澎湖遊戲相關的基礎數據

-- 插入澎湖特色地點數據
INSERT OR IGNORE INTO locations (name, description, latitude, longitude, category, created_at) VALUES
('澎湖天后宮', '台灣最古老的媽祖廟，建於1604年，是澎湖的信仰中心', 23.5651, 119.5651, '文化古蹟', datetime('now')),
('雙心石滬', '七美島的浪漫地標，兩顆心形石滬象徵永恆的愛情', 23.2014, 119.4289, '自然景觀', datetime('now')),
('西嶼燈塔', '台灣最古老的燈塔，建於1778年，守護著澎湖海域', 23.6014, 119.5014, '歷史建築', datetime('now')),
('吉貝沙尾', '吉貝島的白色沙灘，是澎湖最美的海灘之一', 23.7014, 119.6014, '自然景觀', datetime('now')),
('通樑古榕', '300年歷史的大榕樹，樹根盤根錯節，是澎湖的奇觀', 23.6514, 119.5514, '自然景觀', datetime('now')),
('澎湖水族館', '展示澎湖海洋生態的水族館，是親子遊的好去處', 23.5514, 119.5514, '觀光景點', datetime('now')),
('風櫃洞', '玄武岩海蝕洞，海浪拍打時會發出如風櫃般的聲音', 23.5014, 119.5014, '自然景觀', datetime('now')),
('跨海大橋', '連接白沙島和西嶼的跨海大橋，是澎湖的地標', 23.6014, 119.5514, '地標建築', datetime('now'));

-- 插入遊戲任務數據
INSERT OR IGNORE INTO game_tasks (title, description, task_type, points_reward, requirements, created_at) VALUES
('初來乍到', '創建你的第一個記憶膠囊', 'memory_capsule', 10, '{"memory_count": 1}', datetime('now')),
('澎湖探索者', '訪問3個不同的澎湖地點', 'location_visit', 30, '{"visit_count": 3}', datetime('now')),
('文化守護者', '在文化古蹟地點創建記憶膠囊', 'cultural_memory', 25, '{"cultural_memory_count": 1}', datetime('now')),
('美食達人', '在餐廳或小吃店創建記憶膠囊', 'food_memory', 20, '{"food_memory_count": 1}', datetime('now')),
('攝影師', '上傳照片到記憶膠囊', 'photo_upload', 15, '{"photo_count": 1}', datetime('now')),
('社交達人', '回覆其他玩家的記憶膠囊', 'reply_memory', 20, '{"reply_count": 1}', datetime('now')),
('在地嚮導', '作為在地人回覆游客的記憶膠囊', 'local_guide', 35, '{"local_reply_count": 1}', datetime('now')),
('店家推薦', '作為店家回覆游客的記憶膠囊', 'merchant_reply', 30, '{"merchant_reply_count": 1}', datetime('now'));

-- 插入遊戲勳章數據
INSERT OR IGNORE INTO game_badges (name, description, icon, requirements, created_at) VALUES
('新手島主', '完成第一個記憶膠囊', '🏝️', '{"memory_count": 1}', datetime('now')),
('澎湖探索者', '訪問5個澎湖地點', '🗺️', '{"visit_count": 5}', datetime('now')),
('文化守護者', '在文化古蹟創建記憶膠囊', '🏛️', '{"cultural_memory_count": 1}', datetime('now')),
('美食達人', '在餐廳創建記憶膠囊', '🍽️', '{"food_memory_count": 1}', datetime('now')),
('攝影師', '上傳10張照片', '📸', '{"photo_count": 10}', datetime('now')),
('社交達人', '回覆10個記憶膠囊', '💬', '{"reply_count": 10}', datetime('now')),
('在地嚮導', '作為在地人回覆20個記憶膠囊', '👨‍🌾', '{"local_reply_count": 20}', datetime('now')),
('店家推薦', '作為店家回覆15個記憶膠囊', '🏪', '{"merchant_reply_count": 15}', datetime('now')),
('時光島主', '達到最高等級', '👑', '{"level": 10}', datetime('now'));

-- 插入澎湖特色文化數據
INSERT OR IGNORE INTO cultural_data (title, content, category, location_id, created_at) VALUES
('媽祖信仰', '澎湖天后宮是台灣最古老的媽祖廟，每年農曆三月二十三日媽祖誕辰，都會舉行盛大的慶典活動。', '宗教信仰', 1, datetime('now')),
('石滬文化', '雙心石滬是澎湖傳統的捕魚方式，利用潮汐變化來捕魚，展現了澎湖人的智慧。', '傳統技藝', 2, datetime('now')),
('燈塔歷史', '西嶼燈塔建於1778年，是台灣最古老的燈塔，見證了澎湖的航海歷史。', '歷史文化', 3, datetime('now')),
('沙灘文化', '吉貝沙尾的白色沙灘是澎湖最美的海灘，是遊客必訪的景點。', '自然文化', 4, datetime('now')),
('古榕傳說', '通樑古榕有300年歷史，當地人相信這棵樹有靈性，能保佑平安。', '民間傳說', 5, datetime('now')),
('海洋生態', '澎湖水族館展示了澎湖豐富的海洋生態，是了解澎湖海洋文化的好地方。', '生態文化', 6, datetime('now')),
('玄武岩地質', '風櫃洞是玄武岩海蝕洞，展現了澎湖獨特的地質景觀。', '地質文化', 7, datetime('now')),
('跨海工程', '跨海大橋是澎湖的重要地標，連接了不同的島嶼，象徵著澎湖的團結。', '現代文化', 8, datetime('now'));
