import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import matter from "gray-matter";
import { createDocumentSections, parseCanonicalMarkdown, projectSections, renderProjection } from "../lib/access-markdown.js";
import { constructBrowse, findBrowseFolder } from "../lib/browse-model.js";
import { searchParsedDocuments } from "../lib/search-engine.js";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const report = JSON.parse(await readFile(new URL("../migration/dry-run/batch-2-report.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../migration/dry-run/migration-manifest.json", import.meta.url), "utf8"));
const documents = [];
for (const item of report.documents) {
  const source = await readFile(new URL(`../migration/dry-run/batch-2/${item.slug}.md`, import.meta.url), "utf8");
  documents.push({ ...parseCanonicalMarkdown(source), slug: item.slug, url: `/docs/${item.slug}`, source, item });
}

test("Batch 2 dry run contains exactly the five human-approved imports", async () => {
  assert.equal(report.status, "dry-run-only");
  assert.equal(report.databaseWrites, false);
  assert.equal(report.publicationsCreated, false);
  assert.deepEqual(documents.map((document) => document.slug).sort(), [
    "bcrp-evidence",
    "bcrp-icon-style-guide-and-prompting-in-a-pinch",
    "creative-vision-and-experience-guide",
    "known-issues",
    "random-joe"
  ]);
  await assert.rejects(access(new URL("../migration/dry-run/batch-2/combat-balance-testing-bcrp.md", import.meta.url)));
  const combat = manifest.entries.find((entry) => entry.sourcePath.endsWith("Combat Balance Testing - BCRP.docx"));
  assert.equal(combat.proposedDisposition, "HOLD");
});

test("canonical hashes, provenance, visibility, headings, and reader rendering validate", async () => {
  for (const document of documents) {
    assert.equal(sha256(document.source), document.item.canonicalSha256);
    assert.equal(document.frontmatter.default_visibility, document.item.visibility);
    assert.equal(document.item.sourceProseEditoriallyRewritten, false);
    assert.equal(document.item.provenance.sourcePath, document.item.sourcePath);
    assert.equal(document.item.provenance.sourceSha256, document.item.sourceSha256);
    assert.equal(document.item.sourceHeadingCount, document.item.canonicalHeadingCount);
    assert.ok(createDocumentSections(document).length > 0);
    assert.match(renderProjection(document, document.item.visibility), /<h|<p|<ul|<table/);
  }
  const creative = documents.find((document) => document.slug === "creative-vision-and-experience-guide");
  assert.match(creative.source, /\| Traditional UI \| Broken Compass \|[\s\S]*\| Announcement \| Bulletin \|/);
  const evidence = documents.find((document) => document.slug === "bcrp-evidence");
  assert.equal(evidence.frontmatter.description, "Development roadmap for the planned Broken Compass evidence and forensic ecosystem.");
  assert.match(evidence.source, /^# Development Roadmap$/m);
  const icon = documents.find((document) => document.slug.startsWith("bcrp-icon"));
  assert.match(icon.source, /^# Prompt Template$[\s\S]*\[SUBJECT\][\s\S]*^# Optional Style Anchor$/m);
});

test("reader, browse, and search authorization exclude inaccessible Batch 2 metadata", () => {
  const projected = (identity) => documents.filter((document) => projectSections(document, identity).length > 0);
  assert.deepEqual(projected("public").map((document) => document.slug).sort(), ["known-issues", "random-joe"]);
  assert.deepEqual(projected("developer").map((document) => document.slug).sort(), ["bcrp-evidence", "creative-vision-and-experience-guide", "known-issues", "random-joe"]);
  assert.equal(projected("administrator").length, 5);
  const icon = documents.find((document) => document.slug.startsWith("bcrp-icon"));
  assert.equal(renderProjection(icon, "developer"), "");
  assert.equal(renderProjection(icon, "public"), "");

  const definitions = report.documents.map((item) => ({ slug: item.slug, title: item.title, description: item.description, url: `/docs/${item.slug}`, browsePath: item.browsePath }));
  const browseFor = (identity) => constructBrowse(identity, [
    { name: "Getting Started", segments: ["getting-started"] },
    { name: "Development", segments: ["development"] }
  ], definitions.filter((definition) => projected(identity).some((document) => document.slug === definition.slug)));
  assert.equal(findBrowseFolder(browseFor("public"), ["development"]), null);
  assert.doesNotMatch(JSON.stringify(browseFor("developer")), /Icon Style Guide/);
  assert.match(JSON.stringify(browseFor("administrator")), /Icon Style Guide/);

  assert.equal(searchParsedDocuments(documents, "watercolor marker", "public").length, 0);
  assert.equal(searchParsedDocuments(documents, "watercolor marker", "developer").length, 0);
  assert.equal(searchParsedDocuments(documents, "watercolor marker", "administrator")[0].slug, "bcrp-icon-style-guide-and-prompting-in-a-pinch");
  assert.equal(searchParsedDocuments(documents, "Random Joe", "public")[0].slug, "random-joe");
  assert.equal(searchParsedDocuments(documents, "Known Issues", "public")[0].slug, "known-issues");
});
