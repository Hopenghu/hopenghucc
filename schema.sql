-- 刪除現有的表
DROP TABLE IF EXISTS place_photos;
DROP TABLE IF EXISTS place_tags;
DROP TABLE IF EXISTS user_places;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- 創建用戶表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 創建會話表
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 創建地點表
CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  rating REAL,
  rating_count INTEGER,
  description TEXT,
  category TEXT CHECK (category IN ('restaurant', 'hotel', 'attraction')),
  creator_id TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(google_id)
);

-- 創建用戶地點關聯表
CREATE TABLE IF NOT EXISTS user_places (
  user_id TEXT NOT NULL,
  place_id INTEGER NOT NULL,
  is_creator BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, place_id),
  FOREIGN KEY (user_id) REFERENCES users(google_id),
  FOREIGN KEY (place_id) REFERENCES places(id)
);

-- 創建地點標籤表
CREATE TABLE IF NOT EXISTS place_tags (
  place_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (place_id, tag),
  FOREIGN KEY (place_id) REFERENCES places(id)
);

-- 創建地點照片表
CREATE TABLE IF NOT EXISTS place_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (place_id) REFERENCES places(id)
);

-- 創建活動表
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 活動參與表
CREATE TABLE IF NOT EXISTS event_participants (
  event_id INTEGER,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 設置管理員帳號
INSERT OR REPLACE INTO users (google_id, name, email, role) 
VALUES ('admin', 'Admin', 'hopenghu@gmail.com', 'admin'); 