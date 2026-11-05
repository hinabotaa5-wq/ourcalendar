CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('hinata','simone')),
  token_hash TEXT NOT NULL UNIQUE,
  used INTEGER NOT NULL DEFAULT 0,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('hinata','simone')),
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Workout' CHECK (category IN ('Workout','Jogging','General')),
  starts_at_utc TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 45,
  notes TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','done','rested','moved')),
  moved_to_utc TEXT,
  created_by TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at_utc);

CREATE TABLE IF NOT EXISTS weights (
  id TEXT PRIMARY KEY,
  recorded_at_utc TEXT NOT NULL,
  value_kg REAL NOT NULL,
  created_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_weights_recorded ON weights(recorded_at_utc);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('hinata','simone')),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL
);
