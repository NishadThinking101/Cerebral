
CREATE TABLE suites (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT 1,
  is_public BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suite_participants (
  id TEXT PRIMARY KEY,
  suite_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'participant',
  is_muted BOOLEAN DEFAULT 0,
  is_speaking BOOLEAN DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suite_bans (
  id TEXT PRIMARY KEY,
  suite_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  banned_by TEXT NOT NULL,
  reason TEXT,
  banned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suite_reports (
  id TEXT PRIMARY KEY,
  suite_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reported_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suite_participants_suite_id ON suite_participants(suite_id);
CREATE INDEX idx_suite_participants_user_id ON suite_participants(user_id);
CREATE INDEX idx_suite_bans_suite_id ON suite_bans(suite_id);
CREATE INDEX idx_suite_bans_user_id ON suite_bans(user_id);
