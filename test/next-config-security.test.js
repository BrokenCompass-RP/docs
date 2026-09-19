import test from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../next.config.js";

test("development request logging excludes Discord OAuth callback URLs", () => {
  const patterns = nextConfig.logging?.incomingRequests?.ignore ?? [];
  assert.equal(patterns.some((pattern) => pattern.test("/api/auth/discord/callback")), true);
  assert.equal(patterns.some((pattern) => pattern.test("/api/auth/discord/callback?code=sensitive&state=sensitive")), true);
  assert.equal(patterns.some((pattern) => pattern.test("/api/auth/discord/login")), false);
});
