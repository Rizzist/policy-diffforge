CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name STRING NOT NULL,
  terminal_count INT8 NOT NULL DEFAULT 1,
  terminal_layout JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspaces_name_not_empty CHECK (length(name) > 0),
  CONSTRAINT workspaces_terminal_count_range CHECK (terminal_count >= 1 AND terminal_count <= 8),
  CONSTRAINT workspaces_terminal_layout_array CHECK (jsonb_typeof(terminal_layout) = 'array'),
  CONSTRAINT workspaces_user_name_unique UNIQUE (user_id, name)
);

ALTER TABLE IF EXISTS workspaces
  ADD COLUMN IF NOT EXISTS terminal_layout JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE IF EXISTS workspaces
  ALTER COLUMN terminal_count SET DEFAULT 1;

ALTER TABLE IF EXISTS workspaces
  ADD CONSTRAINT IF NOT EXISTS workspaces_terminal_count_max_8 CHECK (terminal_count <= 8);

ALTER TABLE IF EXISTS workspaces
  ADD CONSTRAINT IF NOT EXISTS workspaces_terminal_layout_is_array CHECK (jsonb_typeof(terminal_layout) = 'array');

CREATE INDEX IF NOT EXISTS workspaces_user_created_idx
  ON workspaces (user_id, created_at DESC);
