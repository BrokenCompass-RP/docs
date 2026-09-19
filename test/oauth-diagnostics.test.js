import test from "node:test";
import assert from "node:assert/strict";
import { OAuthStageError, safeOAuthDiagnostic, withOAuthStage } from "../lib/oauth-diagnostics.js";

test("OAuth diagnostics expose only allowlisted classification, status, and numeric Discord code", () => {
  const secrets = "authorization-code pkce-verifier access-token client-secret session-token cookie-value database-password";
  const error = new OAuthStageError("discord_oauth_token_exchange_failed", { httpStatus: 401, discordCode: "50025 malicious-text" }, { cause: new Error(secrets) });
  const serialized = JSON.stringify(safeOAuthDiagnostic(error));
  assert.equal(serialized, '{"classification":"discord_oauth_token_exchange_failed","httpStatus":401,"discordCode":"50025"}');
  for (const secret of secrets.split(" ")) assert.doesNotMatch(serialized, new RegExp(secret));
});

test("unknown errors collapse to a generic safe classification", () => {
  assert.deepEqual(safeOAuthDiagnostic(new Error("access-token=secret")), { classification: "discord_oauth_callback_failed" });
});

test("stage wrapper classifies thrown parsing/configuration errors without their messages", async () => {
  await assert.rejects(() => withOAuthStage("discord_identity_lookup_failed", async () => { throw new Error("access-token=secret"); }), (error) => {
    assert.deepEqual(safeOAuthDiagnostic(error), { classification: "discord_identity_lookup_failed" });
    return true;
  });
});

test("token diagnostics retain safe structure and discard sensitive or free-form details", () => {
  const error = new OAuthStageError("discord_oauth_token_fetch_failed", {
    contentType: "application/json; charset=utf-8 SECRET",
    bodyPresent: true,
    requiredFieldsPresent: true,
    networkErrorName: "TypeError",
    accessToken: "access-token",
    cookie: "cookie-value"
  }, { cause: new Error("authorization-code pkce-verifier client-secret session-token") });
  assert.deepEqual(safeOAuthDiagnostic(error), {
    classification: "discord_oauth_token_fetch_failed",
    contentType: "application/json",
    bodyPresent: true,
    requiredFieldsPresent: true,
    networkErrorName: "TypeError"
  });
  assert.doesNotMatch(JSON.stringify(safeOAuthDiagnostic(error)), /access-token|cookie-value|authorization-code|pkce-verifier|client-secret|session-token/);
});
