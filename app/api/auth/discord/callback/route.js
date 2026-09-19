import { NextResponse } from "next/server";
import { getAuthRepository } from "../../../../../lib/auth-store.js";
import { createDiscordClient } from "../../../../../lib/discord-client.js";
import { loadDiscordConfig, resolveDiscordAuthorization, SESSION_LIFETIME_SECONDS } from "../../../../../lib/discord-authorization.js";
import { AUTH_SESSION_COOKIE } from "../../../../../lib/request-authorization.js";
import { OAuthStageError, recordDevelopmentOAuthDiagnostic, withOAuthStage } from "../../../../../lib/oauth-diagnostics.js";

export async function GET(request) {
  const failure = () => NextResponse.redirect(new URL("/?auth_error=discord_login_failed", request.url));
  try {
    const attemptCookie = request.cookies.get("bcrp_oauth_attempt")?.value;
    if (!attemptCookie) throw new OAuthStageError("discord_oauth_state_pkce_validation_failed");
    let attempt;
    try { attempt = JSON.parse(Buffer.from(attemptCookie, "base64url").toString("utf8")); }
    catch (error) { throw new OAuthStageError("discord_oauth_state_pkce_validation_failed", {}, { cause: error }); }
    const url = new URL(request.url);
    if (!url.searchParams.get("code") || url.searchParams.get("state") !== attempt.state || !attempt.verifier) throw new OAuthStageError("discord_oauth_state_pkce_validation_failed");
    const config = await withOAuthStage("discord_oauth_token_exchange_failed", async () => loadDiscordConfig());
    const client = createDiscordClient();
    const token = await client.exchangeCode(config, url.searchParams.get("code"), attempt.verifier);
    const discord = await client.getIdentity(token.access_token, config.guildId);
    let identity;
    try { identity = resolveDiscordAuthorization(discord, config.roles); }
    catch (error) { throw new OAuthStageError("discord_role_mapping_failed", {}, { cause: error }); }
    const session = await getAuthRepository().establishDiscordSession({
      discordUserId: discord.user.id, username: discord.user.username,
      displayName: discord.member?.nick ?? discord.user.global_name ?? discord.user.username,
      avatarHash: discord.user.avatar, guildId: config.guildId, guildMember: discord.guildMember,
      roleIds: discord.roleIds, identity, lifetimeSeconds: SESSION_LIFETIME_SECONDS
    });
    try {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("bcrp_oauth_attempt");
      response.cookies.set(AUTH_SESSION_COOKIE, session.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_LIFETIME_SECONDS });
      return response;
    } catch (error) { throw new OAuthStageError("discord_session_cookie_redirect_failed", {}, { cause: error }); }
  } catch (error) {
    recordDevelopmentOAuthDiagnostic(error);
    return failure();
  }
}
