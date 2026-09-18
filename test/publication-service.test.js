import test from "node:test";
import assert from "node:assert/strict";
import { createPublicationService } from "../lib/publication-service.js";

const valid = `---\ntitle: Test\ndefault_visibility: public\n---\n\n## Public\n\nHello.`;

test("developer and administrator can publish a saved valid draft", async () => {
  for (const identity of ["developer", "administrator"]) {
    let discarded = false;
    const service = createPublicationService({
      drafts: { read: async () => valid, discard: async () => { discarded = true; } },
      versions: { publish: async (_slug, source, options) => ({ source, ...options }) }
    });
    assert.equal((await service.publishDraft("guide", identity)).publishedBy, identity);
    assert.equal(discarded, true);
  }
});

test("public and moderator cannot publish", async () => {
  for (const identity of ["public", "moderator"]) {
    const service = createPublicationService({ drafts: {}, versions: {} });
    await assert.rejects(() => service.publishDraft("guide", identity), /not authorized/);
  }
});

test("invalid draft never reaches the repository and remains recoverable", async () => {
  let published = false;
  let discarded = false;
  const service = createPublicationService({
    drafts: { read: async () => "not frontmatter", discard: async () => { discarded = true; } },
    versions: { publish: async () => { published = true; } }
  });
  await assert.rejects(() => service.publishDraft("guide", "developer"));
  assert.equal(published, false);
  assert.equal(discarded, false);
});
