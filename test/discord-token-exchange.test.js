import test from "node:test";
import assert from "node:assert/strict";
import { createDiscordClient } from "../lib/discord-client.js";
import { safeOAuthDiagnostic } from "../lib/oauth-diagnostics.js";

const config = { clientId: "client", clientSecret: "secret", redirectUri: "http://localhost:3000/callback" };

function response(body, { status = 200, contentType = "application/json" } = {}) {
  return new Response(body, { status, headers: { "content-type": contentType } });
}

async function diagnostic(operation) {
  try { await operation(); }
  catch (error) { return safeOAuthDiagnostic(error); }
  assert.fail("Expected operation to fail");
}

test("token exchange constructs Discord's form-encoded authorization-code request", async () => {
  let captured;
  const client = createDiscordClient(async (url, init) => {
    captured = { url, init };
    return response(JSON.stringify({ access_token: "token", token_type: "Bearer" }));
  });
  await client.exchangeCode(config, "code", "verifier");
  assert.equal(captured.url, "https://discord.com/api/v10/oauth2/token");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.deepEqual(Object.fromEntries(captured.init.body), {
    grant_type: "authorization_code", code: "code", client_id: "client", client_secret: "secret",
    redirect_uri: "http://localhost:3000/callback", code_verifier: "verifier"
  });
});

test("token exchange distinguishes construction and fetch failures", async () => {
  assert.deepEqual(await diagnostic(() => createDiscordClient().exchangeCode({ ...config, clientSecret: "" }, "code", "verifier")), {
    classification: "discord_oauth_token_request_construction_failed", requiredFieldsPresent: false
  });
  assert.deepEqual(await diagnostic(() => createDiscordClient(async () => { throw new TypeError("secret URL"); }).exchangeCode(config, "code", "verifier")), {
    classification: "discord_oauth_token_fetch_failed", requiredFieldsPresent: true, networkErrorName: "TypeError"
  });
});

test("token exchange distinguishes HTTP, body-read, and response-validation failures", async () => {
  assert.deepEqual(await diagnostic(() => createDiscordClient(async () => response('{"error":"invalid_grant","code":40001}', { status: 400 })).exchangeCode(config, "code", "verifier")), {
    classification: "discord_oauth_token_http_failed", httpStatus: 400, discordCode: "40001", contentType: "application/json", bodyPresent: true
  });
  assert.deepEqual(await diagnostic(() => createDiscordClient(async () => ({ ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }), text: async () => { throw new Error("secret"); } })).exchangeCode(config, "code", "verifier")), {
    classification: "discord_oauth_token_body_read_failed", httpStatus: 200, contentType: "application/json"
  });
  assert.deepEqual(await diagnostic(() => createDiscordClient(async () => response("not-json")).exchangeCode(config, "code", "verifier")), {
    classification: "discord_oauth_token_response_validation_failed", httpStatus: 200, contentType: "application/json", bodyPresent: true
  });
  assert.deepEqual(await diagnostic(() => createDiscordClient(async () => response('{"token_type":"Bearer"}')).exchangeCode(config, "code", "verifier")), {
    classification: "discord_oauth_token_response_validation_failed", httpStatus: 200, contentType: "application/json", bodyPresent: true
  });
});
