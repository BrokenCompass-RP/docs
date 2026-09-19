import { OAuthStageError, withOAuthStage } from "./oauth-diagnostics.js";

async function discordFailure(response, classification) {
  let discordCode;
  try { discordCode = (await response.clone().json())?.code; } catch {}
  return new OAuthStageError(classification, { httpStatus: response.status, discordCode });
}

export function createDiscordClient(fetchImplementation = fetch) {
  return {
    authorizationUrl(config, state, challenge) {
      const url = new URL("https://discord.com/oauth2/authorize");
      url.search = new URLSearchParams({ response_type: "code", client_id: config.clientId, scope: "identify guilds.members.read", redirect_uri: config.redirectUri, state, code_challenge: challenge, code_challenge_method: "S256" });
      return url.toString();
    },
    async exchangeCode(config, code, verifier) {
      const fields = {
        grant_type: "authorization_code",
        code,
        client_id: config?.clientId,
        client_secret: config?.clientSecret,
        redirect_uri: config?.redirectUri,
        code_verifier: verifier
      };
      const requiredFieldsPresent = Object.values(fields).every((value) => typeof value === "string" && value.length > 0);
      let body;
      try {
        if (!requiredFieldsPresent) throw new TypeError("Missing required token request field");
        body = new URLSearchParams(fields);
      } catch (cause) {
        throw new OAuthStageError("discord_oauth_token_request_construction_failed", { requiredFieldsPresent }, { cause });
      }

      let response;
      try {
        response = await fetchImplementation("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
      } catch (cause) {
        throw new OAuthStageError("discord_oauth_token_fetch_failed", {
          requiredFieldsPresent,
          networkErrorName: cause?.name
        }, { cause });
      }

      const contentType = response.headers?.get?.("content-type") ?? undefined;
      let responseBody;
      try {
        responseBody = await response.text();
      } catch (cause) {
        throw new OAuthStageError("discord_oauth_token_body_read_failed", {
          httpStatus: response.status,
          contentType
        }, { cause });
      }

      const bodyPresent = responseBody.length > 0;
      let payload;
      try {
        payload = JSON.parse(responseBody);
      } catch (cause) {
        throw new OAuthStageError("discord_oauth_token_response_validation_failed", {
          httpStatus: response.status,
          contentType,
          bodyPresent
        }, { cause });
      }

      if (!response.ok) {
        throw new OAuthStageError("discord_oauth_token_http_failed", {
          httpStatus: response.status,
          contentType,
          bodyPresent,
          discordCode: payload?.code
        });
      }
      if (!payload || typeof payload.access_token !== "string" || payload.access_token.length === 0 || payload.token_type !== "Bearer") {
        throw new OAuthStageError("discord_oauth_token_response_validation_failed", {
          httpStatus: response.status,
          contentType,
          bodyPresent
        });
      }
      return payload;
    },
    async getIdentity(accessToken, guildId) {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const user = await withOAuthStage("discord_identity_lookup_failed", async () => {
        const response = await fetchImplementation("https://discord.com/api/v10/users/@me", { headers });
        if (!response.ok) throw await discordFailure(response, "discord_identity_lookup_failed");
        return response.json();
      });
      const member = await withOAuthStage("discord_guild_member_lookup_failed", async () => {
        const response = await fetchImplementation(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, { headers });
        if (response.status === 404) return null;
        if (!response.ok) throw await discordFailure(response, "discord_guild_member_lookup_failed");
        return response.json();
      });
      if (!member) return { user, guildMember: false, roleIds: [] };
      return { user, member, guildMember: true, roleIds: member.roles ?? [] };
    }
  };
}
