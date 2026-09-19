export const SESSION_LIFETIME_SECONDS = 24 * 60 * 60;

const list = (value) => new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean));

export function loadDiscordConfig(environment = process.env) {
  const required = ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_REDIRECT_URI", "DISCORD_GUILD_ID"];
  const missing = required.filter((name) => !environment[name]);
  if (missing.length) throw new Error(`Missing Discord configuration: ${missing.join(", ")}`);
  return Object.freeze({
    clientId: environment.DISCORD_CLIENT_ID,
    clientSecret: environment.DISCORD_CLIENT_SECRET,
    redirectUri: environment.DISCORD_REDIRECT_URI,
    guildId: environment.DISCORD_GUILD_ID,
    roles: Object.freeze({
      moderator: list(environment.DISCORD_MODERATOR_ROLE_IDS),
      developer: list(environment.DISCORD_DEVELOPER_ROLE_IDS),
      administrator: list(environment.DISCORD_ADMINISTRATOR_ROLE_IDS)
    })
  });
}

export function resolveDiscordAuthorization({ guildMember, roleIds }, roleMapping) {
  if (!guildMember) return "public";
  const assigned = new Set(roleIds ?? []);
  if ([...roleMapping.administrator].some((id) => assigned.has(id))) return "administrator";
  if ([...roleMapping.developer].some((id) => assigned.has(id))) return "developer";
  if ([...roleMapping.moderator].some((id) => assigned.has(id))) return "moderator";
  return "public";
}
