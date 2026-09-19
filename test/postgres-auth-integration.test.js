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
    let now = new Date("2026-09-19T00:00:00Z");
    const repository = new PostgresAuthRepository(pool, { clock: () => now });
    const first = await repository.establishDiscordSession({ discordUserId: "discord-1", username: "name", displayName: "Display", guildId: "guild", guildMember: true, roleIds: ["dev-role"], identity: "developer", lifetimeSeconds: 86400 });
    assert.equal((await repository.findSession(first.token)).identity, "developer");
    assert.equal(await repository.findSession("forged-token"), null);
    const second = await repository.establishDiscordSession({ discordUserId: "discord-1", username: "renamed", displayName: "Renamed", guildId: "guild", guildMember: true, roleIds: [], identity: "public", lifetimeSeconds: 86400 });
    assert.equal(second.actorId, first.actorId);
    assert.equal((await repository.findSession(second.token)).identity, "public");
    now = new Date("2026-09-20T00:00:01Z");
    assert.equal(await repository.findSession(first.token), null);
    await repository.revokeSession(second.token);
    assert.equal(await repository.findSession(second.token), null);
  } finally {
    await pool.query("TRUNCATE actors CASCADE").catch(() => {});
    await pool.end();
  }
});
