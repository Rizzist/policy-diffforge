CREATE TABLE IF NOT EXISTS desktop_auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code_hash STRING NOT NULL UNIQUE,
  state STRING NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT desktop_auth_codes_code_hash_not_empty CHECK (length(code_hash) > 0),
  CONSTRAINT desktop_auth_codes_state_not_empty CHECK (length(state) > 0),
  CONSTRAINT desktop_auth_codes_expires_after_created CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS desktop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash STRING NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  CONSTRAINT desktop_sessions_token_hash_not_empty CHECK (length(token_hash) > 0),
  CONSTRAINT desktop_sessions_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS desktop_auth_codes_user_created_idx
  ON desktop_auth_codes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS desktop_auth_codes_expires_idx
  ON desktop_auth_codes (expires_at);

CREATE INDEX IF NOT EXISTS desktop_sessions_user_created_idx
  ON desktop_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS desktop_sessions_expires_idx
  ON desktop_sessions (expires_at);
