import { NextResponse } from "next/server";
import { getAuthRepository } from "../../../../../lib/auth-store.js";
import { createDiscordClient } from "../../../../../lib/discord-client.js";
import { loadDiscordConfig, resolveDiscordAuthorization, SESSION_LIFETIME_SECONDS } from "../../../../../lib/discord-authorization.js";
import { AUTH_SESSION_COOKIE } from "../../../../../lib/request-authorization.js";

export async function GET(request) {
  const failure = () => NextResponse.redirect(new URL("/?auth_error=discord_login_failed", request.url));
  try {
    const attemptCookie = request.cookies.get("bcrp_oauth_attempt")?.value;
    if (!attemptCookie) return failure();
    const attempt = JSON.parse(Buffer.from(attemptCookie, "base64url").toString("utf8"));
    const url = new URL(request.url);
    if (!url.searchParams.get("code") || url.searchParams.get("state") !== attempt.state) return failure();
    const config = loadDiscordConfig();
    const client = createDiscordClient();
    const token = await client.exchangeCode(config, url.searchParams.get("code"), attempt.verifier);
    const discord = await client.getIdentity(token.access_token, config.guildId);
    const identity = resolveDiscordAuthorization(discord, config.roles);
    const session = await getAuthRepository().establishDiscordSession({
      discordUserId: discord.user.id, username: discord.user.username,
      displayName: discord.member?.nick ?? discord.user.global_name ?? discord.user.username,
      avatarHash: discord.user.avatar, guildId: config.guildId, guildMember: discord.guildMember,
      roleIds: discord.roleIds, identity, lifetimeSeconds: SESSION_LIFETIME_SECONDS
    });
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("bcrp_oauth_attempt");
    response.cookies.set(AUTH_SESSION_COOKIE, session.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_LIFETIME_SECONDS });
    return response;
  } catch {
    return failure();
  }
}
