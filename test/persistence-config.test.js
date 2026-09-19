import test from "node:test";
import assert from "node:assert/strict";
import { resolvePersistenceConfig } from "../lib/persistence-config.js";

test("development may explicitly select filesystem persistence", () => {
  assert.equal(resolvePersistenceConfig({ NODE_ENV: "development", PERSISTENCE_BACKEND: "filesystem" }).backend, "filesystem");
});

test("production cannot use or silently fall back to filesystem persistence", () => {
  assert.throws(() => resolvePersistenceConfig({ NODE_ENV: "production" }), /postgres is required/);
  assert.throws(() => resolvePersistenceConfig({ NODE_ENV: "production", PERSISTENCE_BACKEND: "filesystem" }), /disabled/);
});

test("PostgreSQL selection requires environment-provided credentials", () => {
  assert.throws(() => resolvePersistenceConfig({ NODE_ENV: "development", PERSISTENCE_BACKEND: "postgres" }), /DATABASE_URL/);
  const config = resolvePersistenceConfig({ NODE_ENV: "production", PERSISTENCE_BACKEND: "postgres", DATABASE_URL: "postgresql://placeholder" });
  assert.equal(config.backend, "postgres");
  assert.equal(config.databaseUrl, "postgresql://placeholder");
});
