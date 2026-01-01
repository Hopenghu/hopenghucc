
CREATE TABLE IF NOT EXISTS knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  title TEXT,
  content TEXT,
  source TEXT,
  status TEXT,
  embedding TEXT
);

CREATE TABLE IF NOT EXISTS contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_type TEXT,
  related_knowledge_id INTEGER,
  content TEXT,
  intent TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT,
  answer TEXT,
  model_used TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
