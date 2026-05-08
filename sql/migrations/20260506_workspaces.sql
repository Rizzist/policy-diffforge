CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_name_not_empty CHECK (length(name) > 0),
  CONSTRAINT workspaces_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS workspaces_user_created_idx
  ON workspaces (user_id, created_at DESC);
