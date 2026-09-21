import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import pg from "pg";
import { parseCanonicalMarkdown, projectSections, renderProjection } from "../lib/access-markdown.js";
import { constructBrowse, findBrowseFolder } from "../lib/browse-model.js";
import { BROWSE_TAXONOMY } from "../lib/browse-taxonomy.js";
import { searchParsedDocuments } from "../lib/search-engine.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const rows = (await pool.query(`SELECT d.slug,d.title,d.description,d.default_visibility,d.browse_path,d.route_path,
    v.canonical_markdown,v.content_hash FROM documents d
    JOIN document_versions v ON v.id=d.current_published_version_id ORDER BY d.slug`)).rows;
  assert.equal(rows.length, 18);
  for (const row of rows) assert.equal(createHash("sha256").update(row.canonical_markdown).digest("hex"), row.content_hash);
  const documents = rows.map((row) => ({ ...parseCanonicalMarkdown(row.canonical_markdown), slug: row.slug, url: row.route_path }));
  const bySlug = (slug) => documents.find((document) => document.slug === slug);
  const publicSlugs = ["random-joe", "known-issues"];
  const developerSlugs = ["creative-vision-and-experience-guide", "bcrp-evidence"];
  const adminSlug = "bcrp-icon-style-guide-and-prompting-in-a-pinch";
  for (const slug of publicSlugs) assert.ok(renderProjection(bySlug(slug), "public"));
  for (const slug of developerSlugs) {
    assert.equal(renderProjection(bySlug(slug), "public"), "");
    assert.ok(renderProjection(bySlug(slug), "developer"));
  }
  assert.equal(renderProjection(bySlug(adminSlug), "public"), "");
  assert.equal(renderProjection(bySlug(adminSlug), "developer"), "");
  assert.ok(renderProjection(bySlug(adminSlug), "administrator"));
  const browseFor = (identity) => constructBrowse(identity, BROWSE_TAXONOMY,
    rows.filter((row) => projectSections(bySlug(row.slug), identity).length > 0)
      .map((row) => ({ slug: row.slug, title: row.title, description: row.description, browsePath: row.browse_path, url: row.route_path })));
  assert.equal(findBrowseFolder(browseFor("public"), ["development"]), null);
  assert.doesNotMatch(JSON.stringify(browseFor("developer")), /Icon Style Guide/);
  assert.match(JSON.stringify(browseFor("administrator")), /Icon Style Guide/);
  assert.equal(searchParsedDocuments(documents, "watercolor marker", "public").length, 0);
  assert.equal(searchParsedDocuments(documents, "watercolor marker", "developer").length, 0);
  assert.equal(searchParsedDocuments(documents, "watercolor marker", "administrator")[0]?.slug, adminSlug);
  assert.equal(searchParsedDocuments(documents, "Random Joe", "public")[0]?.slug, "random-joe");
  assert.equal(searchParsedDocuments(documents, "Known Issues", "public")[0]?.slug, "known-issues");
  assert.equal(bySlug("bcrp-evidence").frontmatter.description, "Development roadmap for the planned Broken Compass evidence and forensic ecosystem.");
  const counts = (await pool.query(`SELECT
    (SELECT count(*)::int FROM document_versions) AS versions,
    (SELECT count(*)::int FROM document_import_provenance) AS provenance,
    (SELECT count(*)::int FROM document_assets) AS assets,
    (SELECT count(*)::int FROM document_drafts) AS drafts,
    (SELECT count(*)::int FROM review_flags) AS flags,
    (SELECT count(*)::int FROM review_comments) AS comments,
    (SELECT count(*)::int FROM review_resolutions) AS resolutions,
    (SELECT count(*)::int FROM actors) AS actors,
    (SELECT count(*)::int FROM authorization_sessions) AS sessions`)).rows[0];
  for (const [name, expected] of Object.entries({ versions: 22, provenance: 12, assets: 5, drafts: 0, flags: 2, comments: 1, resolutions: 1 })) assert.equal(counts[name], expected);
  if (process.env.NODE_ENV === "production") {
    assert.equal(counts.actors, 0);
    assert.equal(counts.sessions, 0);
  }
  console.log(JSON.stringify({ documents: rows.length, ...counts, authorizationProjection: "passed", browse: "passed", search: "passed", canonicalHashes: "passed" }));
} finally {
  await pool.end();
}
