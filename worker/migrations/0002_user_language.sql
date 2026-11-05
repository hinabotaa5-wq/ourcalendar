-- Per-recipient UI language for localized push notifications.
-- Note: no users table existed before, so this migration creates it.
CREATE TABLE IF NOT EXISTS users (
  role TEXT PRIMARY KEY CHECK (role IN ('hinata','simone')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','ja','pl'))
);
INSERT OR IGNORE INTO users (role, language) VALUES ('hinata', 'en'), ('simone', 'en');
