CREATE TABLE IF NOT EXISTS actors (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS actor_external_identities (
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  username text NULL,
  display_name text NULL,
  avatar_hash text NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY(provider, provider_user_id),
  UNIQUE(provider, actor_id)
);

CREATE TABLE IF NOT EXISTS authorization_sessions (
  token_hash text PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  authorization_identity text NOT NULL CHECK (authorization_identity IN ('public','moderator','developer','administrator')),
  discord_guild_id text NOT NULL,
  guild_member boolean NOT NULL,
  discord_role_ids jsonb NOT NULL,
  established_at timestamptz NOT NULL,
  revalidated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS authorization_sessions_actor_idx ON authorization_sessions(actor_id);
CREATE INDEX IF NOT EXISTS authorization_sessions_expiry_idx ON authorization_sessions(expires_at);
