import { createHash, randomBytes, randomUUID } from "node:crypto";
import { OAuthStageError } from "./oauth-diagnostics.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export class PostgresAuthRepository {
  constructor(pool, options = {}) { this.pool = pool; this.clock = options.clock ?? (() => new Date()); }

  async establishDiscordSession(input) {
    let client;
    try { client = await this.pool.connect(); }
    catch (error) { throw new OAuthStageError("discord_actor_persistence_failed", {}, { cause: error }); }
    let stage = "discord_actor_persistence_failed";
    try {
      await client.query("BEGIN");
      const existing = await client.query(`SELECT actor_id FROM actor_external_identities WHERE provider='discord' AND provider_user_id=$1 FOR UPDATE`, [input.discordUserId]);
      const actorId = existing.rows[0]?.actor_id ?? randomUUID();
      const now = this.clock();
      if (!existing.rows[0]) await client.query(`INSERT INTO actors(id,created_at,updated_at) VALUES($1,$2,$2)`, [actorId, now]);
      stage = "discord_external_identity_persistence_failed";
      await client.query(`INSERT INTO actor_external_identities(provider,provider_user_id,actor_id,username,display_name,avatar_hash,updated_at)
        VALUES('discord',$1,$2,$3,$4,$5,$6)
        ON CONFLICT(provider,provider_user_id) DO UPDATE SET username=EXCLUDED.username,display_name=EXCLUDED.display_name,avatar_hash=EXCLUDED.avatar_hash,updated_at=EXCLUDED.updated_at`,
        [input.discordUserId, actorId, input.username ?? null, input.displayName ?? null, input.avatarHash ?? null, now]);
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(now.getTime() + input.lifetimeSeconds * 1000);
      stage = "discord_authorization_session_persistence_failed";
      await client.query(`INSERT INTO authorization_sessions(token_hash,actor_id,authorization_identity,discord_guild_id,guild_member,discord_role_ids,established_at,revalidated_at,expires_at)
        VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$7,$8)`, [hashToken(token), actorId, input.identity, input.guildId, input.guildMember, JSON.stringify(input.roleIds), now, expiresAt]);
      await client.query("COMMIT");
      return { token, actorId, identity: input.identity, expiresAt: expiresAt.toISOString() };
    } catch (error) { await client.query("ROLLBACK"); throw error instanceof OAuthStageError ? error : new OAuthStageError(stage, {}, { cause: error }); }
    finally { client.release(); }
  }

  async findSession(token) {
    if (!token) return null;
    const result = await this.pool.query(`SELECT s.*,e.username,e.display_name FROM authorization_sessions s JOIN actor_external_identities e ON e.actor_id=s.actor_id AND e.provider='discord' WHERE s.token_hash=$1`, [hashToken(token)]);
    const row = result.rows[0];
    if (!row) return null;
    if (new Date(row.expires_at) <= this.clock()) {
      await this.pool.query(`DELETE FROM authorization_sessions WHERE token_hash=$1`, [hashToken(token)]);
      return null;
    }
    return { actorId: row.actor_id, identity: row.authorization_identity, guildMember: row.guild_member, roleIds: row.discord_role_ids, expiresAt: new Date(row.expires_at).toISOString(), username: row.username, displayName: row.display_name };
  }

  async revokeSession(token) {
    if (token) await this.pool.query(`DELETE FROM authorization_sessions WHERE token_hash=$1`, [hashToken(token)]);
  }
}
