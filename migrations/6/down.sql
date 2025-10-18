
DROP INDEX idx_session_chat_session;
DROP TABLE session_chat;

DROP INDEX idx_session_votes_session;
DROP INDEX idx_session_votes_submission;
DROP TABLE session_votes;

DROP INDEX idx_session_submissions_type;
DROP INDEX idx_session_submissions_session;
DROP TABLE session_submissions;

DROP INDEX idx_session_participants_user;
DROP INDEX idx_session_participants_session;
DROP TABLE session_participants;

DROP INDEX idx_live_sessions_host;
DROP INDEX idx_live_sessions_active;
DROP INDEX idx_live_sessions_type;
DROP TABLE live_sessions;
