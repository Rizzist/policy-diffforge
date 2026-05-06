CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appwrite_user_id STRING NOT NULL UNIQUE,
  email STRING,
  name STRING,
  plan_status STRING NOT NULL DEFAULT 'free',
  stripe_customer_id STRING UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_plan_status_check CHECK (plan_status IN ('free', 'paid'))
);

CREATE TABLE IF NOT EXISTS stripe_customers (
  stripe_customer_id STRING PRIMARY KEY,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  email STRING,
  name STRING,
  deleted BOOL NOT NULL DEFAULT false,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  stripe_subscription_id STRING PRIMARY KEY,
  stripe_customer_id STRING NOT NULL REFERENCES stripe_customers (stripe_customer_id) ON DELETE CASCADE,
  status STRING NOT NULL,
  price_id STRING,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOL NOT NULL DEFAULT false,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  stripe_event_id STRING PRIMARY KEY,
  event_type STRING NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status STRING NOT NULL,
  error_message STRING,
  CONSTRAINT stripe_webhook_events_processing_status_check CHECK (
    processing_status IN ('processed', 'ignored', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS stripe_customers_user_id_idx ON stripe_customers (user_id);
CREATE INDEX IF NOT EXISTS stripe_subscriptions_customer_status_idx
  ON stripe_subscriptions (stripe_customer_id, status);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_type_processed_idx
  ON stripe_webhook_events (event_type, processed_at);
