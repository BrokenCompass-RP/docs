import test from "node:test";
import assert from "node:assert/strict";
import { loadDiscordConfig, resolveDiscordAuthorization, SESSION_LIFETIME_SECONDS } from "../lib/discord-authorization.js";
import { createDiscordClient } from "../lib/discord-client.js";

const roles = { moderator: new Set(["role-mod"]), developer: new Set(["role-dev"]), administrator: new Set(["role-admin"]) };

test("Discord role IDs map to named authorization without display names", () => {
  assert.equal(resolveDiscordAuthorization({ guildMember: false, roleIds: ["role-admin"] }, roles), "public");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: [] }, roles), "public");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: ["unknown"] }, roles), "public");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: ["role-mod"] }, roles), "moderator");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: ["role-dev"] }, roles), "developer");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: ["role-admin"] }, roles), "administrator");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: ["role-dev"], roleNames: ["renamed"] }, roles), "developer");
});

test("removed and added roles apply on revalidation", () => {
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: [] }, roles), "public");
  assert.equal(resolveDiscordAuthorization({ guildMember: true, roleIds: ["role-dev"] }, roles), "developer");
  assert.equal(SESSION_LIFETIME_SECONDS, 86400);
});

test("Discord configuration requires secrets and immutable IDs from environment", () => {
  assert.throws(() => loadDiscordConfig({}), /Missing Discord configuration/);
  const config = loadDiscordConfig({ DISCORD_CLIENT_ID: "client", DISCORD_CLIENT_SECRET: "secret", DISCORD_REDIRECT_URI: "https://example/callback", DISCORD_GUILD_ID: "guild", DISCORD_DEVELOPER_ROLE_IDS: "one,two" });
  assert.deepEqual([...config.roles.developer], ["one", "two"]);
});

test("wrong guild and Discord API failures fail closed", async () => {
  const notMemberFetch = async (url) => url.endsWith("/users/@me") ? { ok: true, json: async () => ({ id: "user" }) } : { ok: false, status: 404 };
  assert.equal((await createDiscordClient(notMemberFetch).getIdentity("token", "guild")).guildMember, false);
  const failedFetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(() => createDiscordClient(failedFetch).getIdentity("token", "guild"), /failed/);
});
