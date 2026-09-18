import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseCanonicalMarkdown, renderProjection } from "../lib/access-markdown.js";
import { FileDraftRepository } from "../lib/draft-repository.js";
import { createPublicationService } from "../lib/publication-service.js";
import { searchParsedDocuments } from "../lib/search-engine.js";
import { FileVersionRepository } from "../lib/version-repository.js";

const initial = `---\ntitle: Lifecycle guide\ndefault_visibility: public\n---\n\n## Public\n\nBaseline.`;
const draft = `${initial}\n\n:::access visibility="developer"\n## Developer marker\n\nquartz-lifecycle-token\n:::`;

test("draft, publish, permission-aware search, and recovery use one current pointer", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-lifecycle-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const drafts = new FileDraftRepository(path.join(root, "drafts"));
  const versions = new FileVersionRepository(path.join(root, "published"));
  const service = createPublicationService({ drafts, versions });
  await versions.publish("guide", initial, { publishedBy: "system-seed" });
  await drafts.save("guide", draft);

  let current = await versions.getCurrent("guide");
  assert.doesNotMatch(current.canonicalMarkdown, /quartz-lifecycle-token/);
  assert.equal(searchParsedDocuments([{ ...parseCanonicalMarkdown(current.canonicalMarkdown), slug: "guide", url: "/guide" }], "quartz", "developer").length, 0);

  const published = await service.publishDraft("guide", "developer");
  current = await versions.getCurrent("guide");
  assert.equal(current.versionId, published.versionId);
  const parsed = { ...parseCanonicalMarkdown(current.canonicalMarkdown), slug: "guide", url: "/guide" };
  assert.match(renderProjection(parsed, "developer"), /quartz-lifecycle-token/);
  assert.doesNotMatch(renderProjection(parsed, "public"), /quartz-lifecycle-token/);
  assert.equal(searchParsedDocuments([parsed], "quartz", "developer").length, 1);
  assert.equal(searchParsedDocuments([parsed], "quartz", "public").length, 0);

  const recovered = await service.recoverVersion("guide", "v000001", "developer");
  assert.equal(recovered.versionId, "v000003");
  assert.doesNotMatch((await versions.getCurrent("guide")).canonicalMarkdown, /quartz-lifecycle-token/);
  assert.match((await versions.getVersion("guide", "v000002")).canonicalMarkdown, /quartz-lifecycle-token/);
});
