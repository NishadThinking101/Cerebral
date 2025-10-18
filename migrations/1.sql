
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  storage_used_bytes INTEGER DEFAULT 0,
  storage_limit_bytes INTEGER DEFAULT 536870912000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bpm INTEGER DEFAULT 120,
  key_signature TEXT DEFAULT 'C',
  time_signature TEXT DEFAULT '4/4',
  project_data TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audio_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  duration_seconds REAL,
  file_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collaborations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'collaborator',
  permissions TEXT DEFAULT 'read',
  invited_by TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  category TEXT NOT NULL,
  tags TEXT,
  audio_preview_key TEXT,
  download_key TEXT,
  cover_image_url TEXT,
  bpm INTEGER,
  key_signature TEXT,
  is_active BOOLEAN DEFAULT 1,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_audio_files_project_id ON audio_files(project_id);
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_collaborations_project_id ON collaborations(project_id);
CREATE INDEX idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX idx_marketplace_items_user_id ON marketplace_items(user_id);
CREATE INDEX idx_marketplace_items_category ON marketplace_items(category);
