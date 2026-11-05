-- Quest + XP game state (shared by both players).
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_xp INTEGER NOT NULL DEFAULT 0,
  quest_week_key TEXT,
  quest_kind TEXT,
  last_quest_kind TEXT
);
INSERT OR IGNORE INTO game_state (id, total_xp) VALUES (1, 0);

-- One row per XP grant; the key makes Done and weekly quest bonuses idempotent.
CREATE TABLE IF NOT EXISTS xp_events (
  key TEXT PRIMARY KEY,
  xp INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
