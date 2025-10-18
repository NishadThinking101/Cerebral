
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  marketplace_item_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
