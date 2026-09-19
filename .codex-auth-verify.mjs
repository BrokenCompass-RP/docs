import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query(`SELECT
    (SELECT count(*)::int FROM actors) AS actors,
    (SELECT count(*)::int FROM actor_external_identities WHERE provider='discord') AS mappings,
    (SELECT count(*)::int FROM authorization_sessions) AS sessions,
    (SELECT count(*)::int FROM authorization_sessions WHERE expires_at > now()) AS active,
    (SELECT count(*)::int FROM authorization_sessions WHERE expires_at <= now()) AS expired,
    (SELECT authorization_identity FROM authorization_sessions WHERE expires_at > now() ORDER BY established_at DESC LIMIT 1) AS identity,
    (SELECT discord_role_ids FROM authorization_sessions WHERE expires_at > now() ORDER BY established_at DESC LIMIT 1) AS role_ids,
    (SELECT guild_member FROM authorization_sessions WHERE expires_at > now() ORDER BY established_at DESC LIMIT 1) AS guild_member,
    (SELECT count(*)::int FROM information_schema.columns WHERE table_schema='public' AND table_name='authorization_sessions' AND column_name ILIKE '%token%' AND column_name <> 'token_hash') AS plaintext_token_columns`);
  console.log(JSON.stringify(result.rows[0]));
} finally { await pool.end(); }
