import test from "node:test";
import assert from "node:assert/strict";
import { applicationUrl } from "../lib/application-url.js";

test("production redirects use the configured public origin instead of the private listener", () => {
  const environment = { NODE_ENV: "production", APP_BASE_URL: "https://docs.brokencompassrp.com" };
  assert.equal(applicationUrl("/?auth_error=discord_unavailable", "http://localhost:3000/api/auth/discord/login", environment).href,
    "https://docs.brokencompassrp.com/?auth_error=discord_unavailable");
});

test("production refuses missing or insecure public origins", () => {
  assert.throws(() => applicationUrl("/", "http://localhost:3000/", { NODE_ENV: "production" }), /APP_BASE_URL is required/);
  assert.throws(() => applicationUrl("/", "http://localhost:3000/", { NODE_ENV: "production", APP_BASE_URL: "http://docs.brokencompassrp.com" }), /HTTPS/);
  assert.throws(() => applicationUrl("/", "http://localhost:3000/", { NODE_ENV: "production", APP_BASE_URL: "https://docs.brokencompassrp.com/other" }), /must be an origin/);
});

test("development retains request-origin redirects", () => {
  assert.equal(applicationUrl("/", "http://localhost:3000/api/auth/logout", { NODE_ENV: "development" }).href, "http://localhost:3000/");
});
