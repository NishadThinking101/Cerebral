
-- Update existing users to have proper storage limits if they don't have them
UPDATE users 
SET storage_limit_bytes = 536870912000 
WHERE storage_limit_bytes IS NULL OR storage_limit_bytes = 0;

-- Update existing users to have storage_used_bytes set to 0 if NULL
UPDATE users 
SET storage_used_bytes = 0 
WHERE storage_used_bytes IS NULL;

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_users_storage ON users(storage_used_bytes, storage_limit_bytes);
