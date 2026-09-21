import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { createDocumentSections, parseCanonicalMarkdown } from "../lib/access-markdown.js";

const manifest = JSON.parse(await readFile(new URL("../migration/dry-run/migration-manifest.json", import.meta.url), "utf8"));
const report = JSON.parse(await readFile(new URL("../migration/dry-run/batch-1-report.json", import.meta.url), "utf8"));
const protectedSlugs = new Set(["architecture-guide", "building-manager", "community-rules", "getting-around", "mechanic-job", "phone-directory"]);

test("migration manifest accounts for every prepared source with required provenance", () => {
  assert.equal(manifest.entries.length, 68);
  assert.equal(new Set(manifest.entries.map((entry) => entry.sourcePath)).size, 68);
  for (const entry of manifest.entries) {
    assert.match(entry.sourceSha256, /^[0-9a-f]{64}$/);
    assert.ok(["IMPORT", "RECONCILE", "HISTORICAL", "HOLD", "EXCLUDE"].includes(entry.proposedDisposition));
    assert.ok(entry.proposedTitle);
    assert.ok(entry.proposedSlug);
    assert.match(entry.proposedDocumentId, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(entry.extractionMethod);
  }
});

test("Batch 1 is canonical, collision-free, and preserves native source body text", async () => {
  assert.equal(report.documents.length, 7);
  for (const document of report.documents) {
    assert.equal(protectedSlugs.has(document.slug), false);
    assert.match(document.documentId, /^[0-9a-f-]{36}$/);
    assert.deepEqual(document.browsePath, ["development"]);
    assert.equal(document.visibility, "developer");
    assert.deepEqual(document.omitted, []);
    const sourceBytes = await readFile(path.join(process.cwd(), document.sourcePath));
    assert.equal(createHash("sha256").update(sourceBytes).digest("hex"), document.sourceSha256);
    const canonicalSource = await readFile(path.join(process.cwd(), "migration", "dry-run", "batch-1", `${document.slug}.md`), "utf8");
    const canonical = parseCanonicalMarkdown(canonicalSource);
    assert.equal(canonical.frontmatter.title, document.title);
    assert.equal(canonical.frontmatter.default_visibility, "developer");
    assert.equal(createDocumentSections(canonical).length, document.sectionCount);
    assert.equal(matter(canonicalSource).content.trim(), matter(sourceBytes.toString("utf8").replace(/\r\n/g, "\n")).content.trim());
  }
});
