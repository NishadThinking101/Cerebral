
-- Remove the index
DROP INDEX IF EXISTS idx_users_storage;

-- Note: We don't reverse the storage limit updates as they should remain for data consistency
