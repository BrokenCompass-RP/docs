import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import { PostgresAuthRepository } from "../lib/postgres-auth-repository.js";

const databaseUrl = process.env.TEST_DATABASE_URL;

test("PostgreSQL stores stable actors and expiring authorization sessions", { skip: !databaseUrl }, async () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const directory = new URL("../db/migrations/", import.meta.url);
    for (const name of (await readdir(directory)).filter((item) => item.endsWith(".sql")).sort()) await pool.query(await readFile(new URL(name, directory), "utf8"));
    await pool.query("TRUNCATE actors CASCADE");
    let now = new Date();
    const repository = new PostgresAuthRepository(pool, { clock: () => now });
    const first = await repository.establishDiscordSession({ discordUserId: "discord-1", username: "name", displayName: "Display", guildId: "guild", guildMember: true, roleIds: ["dev-role"], identity: "developer", lifetimeSeconds: 86400 });
    assert.equal((await repository.findSession(first.token)).identity, "developer");
    assert.equal(await repository.findSession("forged-token"), null);
    await pool.query(`INSERT INTO authorization_sessions(token_hash,actor_id,authorization_identity,discord_guild_id,guild_member,discord_role_ids,established_at,revalidated_at,expires_at)
      VALUES($1,$2,'public','guild',false,'[]'::jsonb,now() - interval '2 days',now() - interval '2 days',now() - interval '1 day')`, ["expired-test-row", first.actorId]);
    const second = await repository.establishDiscordSession({ discordUserId: "discord-1", username: "renamed", displayName: "Renamed", guildId: "guild", guildMember: true, roleIds: [], identity: "public", lifetimeSeconds: 86400 });
    assert.equal(second.actorId, first.actorId);
    assert.equal((await repository.findSession(second.token)).identity, "public");
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM authorization_sessions WHERE token_hash='expired-test-row'")).rows[0].count, 0);
    assert.equal((await repository.findSession(first.token)).identity, "developer");
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM information_schema.columns WHERE table_name='actor_external_identities' AND column_name='avatar_hash'")).rows[0].count, 0);
    assert.equal((await repository.findSession(second.token)).displayName, "Renamed");
    now = new Date(now.getTime() + 86401 * 1000);
    assert.equal(await repository.findSession(first.token), null);
    await repository.revokeSession(second.token);
    assert.equal(await repository.findSession(second.token), null);
  } finally {
    await pool.query("TRUNCATE actors CASCADE").catch(() => {});
    await pool.end();
  }
});
