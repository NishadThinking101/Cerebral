
-- Extend marketplace_items table for beat store capabilities
ALTER TABLE marketplace_items ADD COLUMN has_lease_option BOOLEAN DEFAULT 0;
ALTER TABLE marketplace_items ADD COLUMN lease_price_cents INTEGER DEFAULT 0;
ALTER TABLE marketplace_items ADD COLUMN lease_terms TEXT;
ALTER TABLE marketplace_items ADD COLUMN has_exclusive_option BOOLEAN DEFAULT 0;
ALTER TABLE marketplace_items ADD COLUMN exclusive_price_cents INTEGER DEFAULT 0;
ALTER TABLE marketplace_items ADD COLUMN audio_full_key TEXT;
ALTER TABLE marketplace_items ADD COLUMN stems_key TEXT;
ALTER TABLE marketplace_items ADD COLUMN license_terms TEXT;

-- Create beat_licenses table to track purchased licenses
CREATE TABLE beat_licenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  marketplace_item_id TEXT NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('basic', 'lease', 'exclusive')),
  payment_id TEXT NOT NULL,
  license_terms TEXT,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create seller_analytics table for sales tracking
CREATE TABLE seller_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  marketplace_item_id TEXT NOT NULL,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('basic', 'lease', 'exclusive')),
  amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  net_earnings_cents INTEGER NOT NULL,
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create beat_reviews table for user feedback
CREATE TABLE beat_reviews (
  id TEXT PRIMARY KEY,
  marketplace_item_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(marketplace_item_id, reviewer_id)
);

-- Create indexes for performance
CREATE INDEX idx_beat_licenses_user_id ON beat_licenses(user_id);
CREATE INDEX idx_beat_licenses_item_id ON beat_licenses(marketplace_item_id);
CREATE INDEX idx_seller_analytics_user_id ON seller_analytics(user_id);
CREATE INDEX idx_beat_reviews_item_id ON beat_reviews(marketplace_item_id);
