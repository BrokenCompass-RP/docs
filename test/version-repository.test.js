import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FileVersionRepository } from "../lib/version-repository.js";

test("publishing creates immutable versions with stable first-published metadata", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-versions-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const times = [new Date("2026-01-01T00:00:00Z"), new Date("2026-02-01T00:00:00Z")];
  const repository = new FileVersionRepository(root, { clock: () => times.shift() });
  const first = await repository.publish("guide", "first", { publishedBy: "developer" });
  const second = await repository.publish("guide", "second", { publishedBy: "administrator" });
  assert.equal(first.versionId, "v000001");
  assert.equal(second.firstPublished, first.publishedAt);
  assert.equal((await repository.getCurrent("guide")).canonicalMarkdown, "second");
  assert.deepEqual((await repository.listVersions("guide")).map((item) => item.versionId), ["v000002", "v000001"]);
});

test("a failed pointer update leaves the prior version current", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-atomic-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baseline = new FileVersionRepository(root);
  await baseline.publish("guide", "safe");
  const failing = new FileVersionRepository(root, { beforePointerUpdate: () => { throw new Error("simulated failure"); } });
  await assert.rejects(() => failing.publish("guide", "unsafe"), /simulated failure/);
  assert.equal((await baseline.getCurrent("guide")).canonicalMarkdown, "safe");
});

test("recovery appends a new publication instead of mutating history", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-recover-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repository = new FileVersionRepository(root);
  const first = await repository.publish("guide", "first");
  await repository.publish("guide", "second");
  const recovered = await repository.recover("guide", first.versionId, { publishedBy: "developer" });
  assert.equal(recovered.versionId, "v000003");
  assert.equal(recovered.recoveredFromVersion, "v000001");
  assert.equal((await repository.getVersion("guide", "v000002")).canonicalMarkdown, "second");
  assert.equal((await repository.getCurrent("guide")).canonicalMarkdown, "first");
});
