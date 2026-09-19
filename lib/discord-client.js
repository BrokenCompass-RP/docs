export function createDiscordClient(fetchImplementation = fetch) {
  return {
    authorizationUrl(config, state, challenge) {
      const url = new URL("https://discord.com/oauth2/authorize");
      url.search = new URLSearchParams({ response_type: "code", client_id: config.clientId, scope: "identify guilds.members.read", redirect_uri: config.redirectUri, state, code_challenge: challenge, code_challenge_method: "S256" });
      return url.toString();
    },
    async exchangeCode(config, code, verifier) {
      const response = await fetchImplementation("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, code_verifier: verifier }) });
      if (!response.ok) throw new Error("Discord token exchange failed");
      return response.json();
    },
    async getIdentity(accessToken, guildId) {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const userResponse = await fetchImplementation("https://discord.com/api/v10/users/@me", { headers });
      if (!userResponse.ok) throw new Error("Discord identity resolution failed");
      const user = await userResponse.json();
      const memberResponse = await fetchImplementation(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, { headers });
      if (memberResponse.status === 404) return { user, guildMember: false, roleIds: [] };
      if (!memberResponse.ok) throw new Error("Discord guild membership resolution failed");
      const member = await memberResponse.json();
      return { user, member, guildMember: true, roleIds: member.roles ?? [] };
    }
  };
}
