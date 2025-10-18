
CREATE TABLE live_sessions (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL CHECK (session_type IN ('showcase', 'rivals', 'playlisted')),
  theme TEXT,
  max_participants INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT 1,
  is_public BOOLEAN DEFAULT 1,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_live_sessions_type ON live_sessions(session_type);
CREATE INDEX idx_live_sessions_active ON live_sessions(is_active);
CREATE INDEX idx_live_sessions_host ON live_sessions(host_id);

CREATE TABLE session_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('host', 'contestant', 'viewer')),
  is_muted BOOLEAN DEFAULT 0,
  is_camera_on BOOLEAN DEFAULT 1,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);

CREATE TABLE session_submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  music_title TEXT NOT NULL,
  artist_name TEXT,
  file_key TEXT,
  audio_url TEXT,
  submission_type TEXT DEFAULT 'playlist' CHECK (submission_type IN ('playlist', 'battle', 'showcase')),
  votes_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT 0,
  is_played BOOLEAN DEFAULT 0,
  played_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_submissions_session ON session_submissions(session_id);
CREATE INDEX idx_session_submissions_type ON session_submissions(submission_type);

CREATE TABLE session_votes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote_type TEXT DEFAULT 'like' CHECK (vote_type IN ('like', 'fire', 'crown')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, voter_id)
);

CREATE INDEX idx_session_votes_submission ON session_votes(submission_id);
CREATE INDEX idx_session_votes_session ON session_votes(session_id);

CREATE TABLE session_chat (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'reaction', 'system')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_chat_session ON session_chat(session_id);
