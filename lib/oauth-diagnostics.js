const CLASSIFICATIONS = new Set([
  "discord_oauth_state_pkce_validation_failed",
  "discord_oauth_token_exchange_failed",
  "discord_oauth_token_request_construction_failed",
  "discord_oauth_token_fetch_failed",
  "discord_oauth_token_http_failed",
  "discord_oauth_token_body_read_failed",
  "discord_oauth_token_response_validation_failed",
  "discord_identity_lookup_failed",
  "discord_guild_member_lookup_failed",
  "discord_role_mapping_failed",
  "discord_actor_persistence_failed",
  "discord_external_identity_persistence_failed",
  "discord_authorization_session_persistence_failed",
  "discord_session_cookie_redirect_failed",
  "discord_oauth_callback_failed"
]);

export class OAuthStageError extends Error {
  constructor(classification, details = {}, options = {}) {
    super(classification, options);
    this.name = "OAuthStageError";
    this.classification = CLASSIFICATIONS.has(classification) ? classification : "discord_oauth_callback_failed";
    this.httpStatus = Number.isInteger(details.httpStatus) ? details.httpStatus : undefined;
    this.discordCode = typeof details.discordCode === "number" || typeof details.discordCode === "string"
      ? String(details.discordCode).replace(/[^0-9]/g, "").slice(0, 20) || undefined
      : undefined;
    this.contentType = typeof details.contentType === "string"
      ? details.contentType.toLowerCase().match(/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+/)?.[0]
      : undefined;
    this.bodyPresent = typeof details.bodyPresent === "boolean" ? details.bodyPresent : undefined;
    this.requiredFieldsPresent = typeof details.requiredFieldsPresent === "boolean" ? details.requiredFieldsPresent : undefined;
    this.networkErrorName = ["AbortError", "TypeError"].includes(details.networkErrorName)
      ? details.networkErrorName
      : undefined;
  }
}

export function safeOAuthDiagnostic(error) {
  return Object.freeze({
    classification: error instanceof OAuthStageError ? error.classification : "discord_oauth_callback_failed",
    ...(error instanceof OAuthStageError && error.httpStatus ? { httpStatus: error.httpStatus } : {}),
    ...(error instanceof OAuthStageError && error.discordCode ? { discordCode: error.discordCode } : {}),
    ...(error instanceof OAuthStageError && error.contentType ? { contentType: error.contentType } : {}),
    ...(error instanceof OAuthStageError && error.bodyPresent !== undefined ? { bodyPresent: error.bodyPresent } : {}),
    ...(error instanceof OAuthStageError && error.requiredFieldsPresent !== undefined ? { requiredFieldsPresent: error.requiredFieldsPresent } : {}),
    ...(error instanceof OAuthStageError && error.networkErrorName ? { networkErrorName: error.networkErrorName } : {})
  });
}

export async function withOAuthStage(classification, operation) {
  try { return await operation(); }
  catch (error) {
    if (error instanceof OAuthStageError) throw error;
    throw new OAuthStageError(classification, {}, { cause: error });
  }
}

export function recordDevelopmentOAuthDiagnostic(error) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[discord-oauth] ${JSON.stringify(safeOAuthDiagnostic(error))}`);
  }
}
