
-- Drop indexes
DROP INDEX idx_beat_reviews_item_id;
DROP INDEX idx_seller_analytics_user_id;
DROP INDEX idx_beat_licenses_item_id;
DROP INDEX idx_beat_licenses_user_id;

-- Drop tables
DROP TABLE beat_reviews;
DROP TABLE seller_analytics;
DROP TABLE beat_licenses;

-- Remove columns from marketplace_items
ALTER TABLE marketplace_items DROP COLUMN license_terms;
ALTER TABLE marketplace_items DROP COLUMN stems_key;
ALTER TABLE marketplace_items DROP COLUMN audio_full_key;
ALTER TABLE marketplace_items DROP COLUMN exclusive_price_cents;
ALTER TABLE marketplace_items DROP COLUMN has_exclusive_option;
ALTER TABLE marketplace_items DROP COLUMN lease_terms;
ALTER TABLE marketplace_items DROP COLUMN lease_price_cents;
ALTER TABLE marketplace_items DROP COLUMN has_lease_option;
