import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileDraftRepository } from "../lib/draft-repository.js";
import { parseCanonicalMarkdown, renderProjection } from "../lib/access-markdown.js";
import { serializeEditableDocument, toEditableDocument } from "../lib/authoring-markdown.js";
import { searchParsedDocuments } from "../lib/search-engine.js";

test("draft survives reopen, remains isolated from canonical reader/search, and discards", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "bcrp-drafts-"));
  try {
    const repository = new FileDraftRepository(directory);
    const canonicalPath = new URL("../content/building-manager.md", import.meta.url);
    const before = await readFile(canonicalPath, "utf8");
    const editable = toEditableDocument(before);
    editable.sections.push({ visibility: "developer", markdown: "## Draft-only test\n\nDRAFTONLYTOKEN" });
    const draftSource = serializeEditableDocument(editable);

    await repository.save("building-manager", draftSource);
    const reopenedRepository = new FileDraftRepository(directory);
    assert.equal(await reopenedRepository.read("building-manager"), draftSource);
    assert.equal(await readFile(canonicalPath, "utf8"), before);

    const canonical = { ...parseCanonicalMarkdown(before), slug: "building-manager", url: "/guides/building-manager" };
    assert.doesNotMatch(renderProjection(canonical, "developer"), /DRAFTONLYTOKEN/);
    assert.equal(searchParsedDocuments([canonical], "DRAFTONLYTOKEN", "developer").length, 0);

    await reopenedRepository.discard("building-manager");
    assert.equal(await reopenedRepository.read("building-manager"), null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
