
-- Drop indexes first
DROP INDEX IF EXISTS idx_user_follows_following;
DROP INDEX IF EXISTS idx_user_follows_follower;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_conversations_participants;
DROP INDEX IF EXISTS idx_user_links_user_id;
DROP INDEX IF EXISTS idx_user_media_user_id;
DROP INDEX IF EXISTS idx_user_profiles_user_id;

-- Drop tables
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS user_links;
DROP TABLE IF EXISTS user_media;
DROP TABLE IF EXISTS user_profiles;
