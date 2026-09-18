import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseCanonicalMarkdown, projectSections, renderProjection } from "../lib/access-markdown.js";
import { FileReviewRepository } from "../lib/review-repository.js";
import { createReviewService } from "../lib/review-service.js";
import { searchParsedDocuments } from "../lib/search-engine.js";
import { FileVersionRepository } from "../lib/version-repository.js";

const source = `---\ntitle: Review guide\ndefault_visibility: public\n---\n\n## Property Finder\n\nPublic knowledge.\n\n:::access visibility="developer"\n## Developer notes\n\nRestricted knowledge.\n:::`;

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-reviews-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  let tick = 0;
  const repository = new FileReviewRepository(path.join(root, "reviews"), {
    id: () => String(++tick), clock: () => new Date(`2026-09-18T00:00:0${tick}Z`)
  });
  return { root, repository, service: createReviewService({ repository }) };
}

test("public and moderator can create document and H2 flags without review access", async (t) => {
  const { service } = await fixture(t);
  const documentFlag = await service.createFlag({ documentId: "guide", reason: "unclear", initialComment: "Explain this.", versionAtReport: "v000001" }, "public");
  assert.equal(documentFlag.sectionId, null);
  assert.equal(documentFlag.reporterIdentity, null);
  const sectionFlag = await service.createFlag({ documentId: "guide", sectionId: "property-finder", sectionHeading: "Property Finder", reason: "outdated", initialComment: "This changed.", versionAtReport: "v000001" }, "moderator");
  assert.equal(sectionFlag.sectionHeading, "Property Finder");
  assert.equal(sectionFlag.reporterIdentity, "moderator");
  await assert.rejects(() => service.list("guide", "public"), /not authorized/);
  await assert.rejects(() => service.list("guide", "moderator"), /not authorized/);
});

test("reason and explanatory comment are required", async (t) => {
  const { service } = await fixture(t);
  await assert.rejects(() => service.createFlag({ documentId: "guide", reason: "", initialComment: "note" }, "public"), /Reason/);
  await assert.rejects(() => service.createFlag({ documentId: "guide", reason: "outdated", initialComment: "" }, "public"), /Comment/);
});

test("developers and administrators append comments and explicitly resolve", async (t) => {
  for (const identity of ["developer", "administrator"]) {
    const { service } = await fixture(t);
    const flag = await service.createFlag({ documentId: "guide", reason: "incorrect", initialComment: "review-marker", versionAtReport: "v000001" }, "public");
    const comment = await service.addComment("guide", flag.flagId, "comment-marker", identity);
    assert.equal(comment.authorIdentity, identity);
    const resolved = await service.resolve("guide", flag.flagId, identity, "v000002");
    assert.equal(resolved.status, "resolved");
    assert.equal(resolved.resolution.resolvedBy, identity);
    assert.equal(resolved.resolution.versionAtResolution, "v000002");
  }
});

test("publication and recovery do not alter open review state or version history", async (t) => {
  const { root, service } = await fixture(t);
  const versions = new FileVersionRepository(path.join(root, "versions"));
  await versions.publish("guide", source);
  const flag = await service.createFlag({ documentId: "guide", reason: "outdated", initialComment: "flag-review-zebra-731", versionAtReport: "v000001" }, "public");
  await versions.publish("guide", source.replace("Public knowledge.", "Updated public knowledge."));
  assert.equal((await service.list("guide", "developer")).find((item) => item.flagId === flag.flagId).status, "open");
  await versions.recover("guide", "v000001");
  assert.equal((await service.list("guide", "administrator")).find((item) => item.flagId === flag.flagId).status, "open");
  assert.deepEqual((await versions.listVersions("guide")).map((item) => item.versionId), ["v000003", "v000002", "v000001"]);
});

test("review text never enters projections, snapshots, search counts, ranking, or snippets", async (t) => {
  const { service } = await fixture(t);
  const flag = await service.createFlag({ documentId: "guide", reason: "outdated", initialComment: "stale-platypus-947", versionAtReport: "v000001" }, "public");
  await service.addComment("guide", flag.flagId, "private-review-otter-318", "developer");
  const parsed = { ...parseCanonicalMarkdown(source), slug: "guide", url: "/guide" };
  for (const identity of ["public", "moderator", "developer", "administrator"]) {
    assert.doesNotMatch(renderProjection(parsed, identity), /stale-platypus|private-review-otter/);
    assert.equal(searchParsedDocuments([parsed], "stale-platypus-947", identity).length, 0);
    assert.equal(searchParsedDocuments([parsed], "private-review-otter-318", identity).length, 0);
  }
  assert.doesNotMatch(source, /stale-platypus|private-review-otter/);
});

test("section projection exposes only authorized H2 identifiers", () => {
  const parsed = parseCanonicalMarkdown(source);
  assert.deepEqual(projectSections(parsed, "public").map((item) => item.sectionId), ["property-finder"]);
  assert.deepEqual(projectSections(parsed, "developer").map((item) => item.sectionId), ["property-finder", "developer-notes"]);
});

test("review API routes keep manager data behind server-side manager authorization", async () => {
  for (const relative of [
    "../app/api/manager/documents/[slug]/reviews/route.js",
    "../app/api/manager/documents/[slug]/reviews/[flagId]/comments/route.js",
    "../app/api/manager/documents/[slug]/reviews/[flagId]/resolve/route.js"
  ]) {
    const route = await readFile(new URL(relative, import.meta.url), "utf8");
    assert.match(route, /getManagerIdentity/);
    assert.match(route, /status: 404/);
  }
});
