
DROP INDEX idx_user_sessions_expires;
DROP INDEX idx_user_sessions_user_id;
DROP INDEX idx_user_sessions_token;
DROP TABLE user_sessions;

ALTER TABLE users DROP COLUMN verification_token;
ALTER TABLE users DROP COLUMN email_verified;
ALTER TABLE users DROP COLUMN auth_provider;
ALTER TABLE users DROP COLUMN password_hash;
