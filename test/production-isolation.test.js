import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("production identity resolution is hard-coded public before cookie access", async () => {
  const source = await readFile(new URL("../lib/dev-identity.js", import.meta.url), "utf8");
  const productionGuard = source.indexOf('process.env.NODE_ENV !== "development"');
  const cookieRead = source.indexOf("await cookies()");
  assert.ok(productionGuard >= 0);
  assert.ok(cookieRead > productionGuard);
  assert.match(source, /return "public"/);
});

test("development identity endpoint returns 404 outside development", async () => {
  const source = await readFile(new URL("../app/api/dev-identity/route.js", import.meta.url), "utf8");
  assert.match(source, /process\.env\.NODE_ENV !== "development"/);
  assert.match(source, /status: 404/);
});

test("manager access has an immutable production guard and named capability check", async () => {
  const accessSource = await readFile(new URL("../lib/manager-access.js", import.meta.url), "utf8");
  assert.match(accessSource, /process\.env\.NODE_ENV !== "development"/);
  assert.match(accessSource, /CAPABILITIES\.MANAGE_DOCUMENTS/);
  assert.match(accessSource, /return null/);
});

test("publish and version routes are all behind the guarded manager identity", async () => {
  for (const relative of [
    "../app/api/manager/documents/[slug]/publish/route.js",
    "../app/api/manager/documents/[slug]/versions/route.js"
  ]) {
    const source = await readFile(new URL(relative, import.meta.url), "utf8");
    assert.match(source, /getManagerIdentity/);
    assert.match(source, /status: 404/);
  }
});

test("view-as resolution is applied server-side before document rendering", async () => {
  const source = await readFile(new URL("../app/guides/building-manager/page.js", import.meta.url), "utf8");
  assert.match(source, /resolveProjectionIdentity/);
  assert.match(source, /loadProjectedDocument\("building-manager", projection\)/);
});
