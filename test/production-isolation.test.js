import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("development simulator cookie is read only inside a development guard", async () => {
  const source = await readFile(new URL("../lib/request-authorization.js", import.meta.url), "utf8");
  const developmentGuard = source.indexOf('process.env.NODE_ENV === "development"');
  const simulatorRead = source.indexOf("DEV_IDENTITY_COOKIE");
  assert.ok(developmentGuard >= 0);
  assert.ok(source.indexOf("cookieStore.get(DEV_IDENTITY_COOKIE)") > developmentGuard);
  assert.ok(simulatorRead >= 0);
  assert.match(source, /identity: "public"/);
});

test("development identity endpoint returns 404 outside development", async () => {
  const source = await readFile(new URL("../app/api/dev-identity/route.js", import.meta.url), "utf8");
  assert.match(source, /process\.env\.NODE_ENV !== "development"/);
  assert.match(source, /status: 404/);
});

test("manager access depends on authenticated named capability", async () => {
  const accessSource = await readFile(new URL("../lib/manager-access.js", import.meta.url), "utf8");
  assert.match(accessSource, /getRequestAuthorization/);
  assert.match(accessSource, /CAPABILITIES\.MANAGE_DOCUMENTS/);
  assert.match(accessSource, /\? authorization : null/);
});

test("publish and version routes are all behind the guarded manager identity", async () => {
  for (const relative of [
    "../app/api/manager/documents/[slug]/publish/route.js",
    "../app/api/manager/documents/[slug]/versions/route.js"
  ]) {
    const source = await readFile(new URL(relative, import.meta.url), "utf8");
    assert.match(source, /getManagerAuthorization|getManagerIdentity/);
    assert.match(source, /status: 404/);
  }
});

test("view-as resolution is applied server-side before document rendering", async () => {
  const source = await readFile(new URL("../app/guides/building-manager/page.js", import.meta.url), "utf8");
  assert.match(source, /resolveProjectionIdentity/);
  assert.match(source, /loadProjectedDocument\("building-manager", projection\)/);
});
