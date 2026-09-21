import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import pg from "pg";
import { parseCanonicalMarkdown } from "../lib/access-markdown.js";
import { stableMigrationDocumentId } from "../lib/migration-identity.js";
import { PostgresProvenanceRepository } from "../lib/provenance-repository.js";

const EXPECTED = Object.freeze({
  "bcrp-icon-style-guide-and-prompting-in-a-pinch": { visibility: "administrator", browsePath: ["development"] },
  "creative-vision-and-experience-guide": { visibility: "developer", browsePath: ["development"] },
  "bcrp-evidence": { visibility: "developer", browsePath: ["development"], description: "Development roadmap for the planned Broken Compass evidence and forensic ecosystem." },
  "random-joe": { visibility: "public", browsePath: ["getting-started"] },
  "known-issues": { visibility: "public", browsePath: ["getting-started"] }
});

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

async function snapshotExisting(client) {
  const documents = await client.query(`SELECT d.id,d.slug,d.title,d.description,d.default_visibility,d.browse_path,d.route_path,
    d.current_published_version_id,d.historical_first_published_at,d.imported_at,d.created_at,d.updated_at,
    current.content_hash AS current_content_hash,
    (SELECT COUNT(*)::int FROM document_versions v WHERE v.document_id=d.id) AS version_count
    FROM documents d LEFT JOIN document_versions current ON current.id=d.current_published_version_id ORDER BY d.slug`);
  const assets = await client.query(`SELECT a.id,a.document_id,a.original_filename,a.media_type,a.byte_size,a.width,a.height,a.visibility,a.content
    FROM document_assets a ORDER BY a.document_id,a.id`);
  return {
    documents: documents.rows,
    assets: assets.rows.map(({ content, ...row }) => ({ ...row, contentSha256: sha256(content) }))
  };
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const report = JSON.parse(await readFile(new URL("../migration/dry-run/batch-2-report.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../migration/dry-run/migration-manifest.json", import.meta.url), "utf8"));
const expectedSlugs = Object.keys(EXPECTED).sort();
if (report.documents.length !== 5 || !equal(report.documents.map((item) => item.slug).sort(), expectedSlugs)) {
  throw new Error("Batch 2 report does not contain exactly the five approved slugs");
}

const prepared = [];
for (const item of report.documents) {
  const expected = EXPECTED[item.slug];
  if (!expected || item.visibility !== expected.visibility || !equal(item.browsePath, expected.browsePath)) throw new Error(`Reviewed destination mismatch for ${item.slug}`);
  if (expected.description && item.description !== expected.description) throw new Error(`Approved description mismatch for ${item.slug}`);
  const manifestEntry = manifest.entries.find((entry) => entry.sourcePath === item.sourcePath);
  if (!manifestEntry || manifestEntry.sourceSha256 !== item.sourceSha256 || manifestEntry.proposedDisposition !== "IMPORT") throw new Error(`Manifest mismatch for ${item.slug}`);
  const sourceBytes = await readFile(path.join(process.cwd(), item.sourcePath));
  if (sha256(sourceBytes) !== item.sourceSha256) throw new Error(`Source hash mismatch for ${item.slug}`);
  const canonicalMarkdown = await readFile(path.join(process.cwd(), "migration", "dry-run", "batch-2", `${item.slug}.md`), "utf8");
  if (sha256(canonicalMarkdown) !== item.canonicalSha256) throw new Error(`Canonical hash mismatch for ${item.slug}`);
  const canonical = parseCanonicalMarkdown(canonicalMarkdown);
  if (canonical.frontmatter.title !== item.title || canonical.frontmatter.description !== item.description || canonical.frontmatter.default_visibility !== item.visibility) throw new Error(`Canonical metadata mismatch for ${item.slug}`);
  if (item.slug === "bcrp-evidence" && !matter(canonicalMarkdown).content.startsWith("# bcrp-evidence\n")) throw new Error("BCRP-Evidence source body changed unexpectedly");
  const documentId = stableMigrationDocumentId(item.sourcePath, item.sourceSha256);
  if (item.documentId !== documentId) throw new Error(`Stable document identity mismatch for ${item.slug}`);
  prepared.push({ ...item, documentId, canonicalMarkdown, contentHash: item.canonicalSha256 });
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const client = await pool.connect();
try {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  await client.query("LOCK TABLE documents IN SHARE ROW EXCLUSIVE MODE");
  const before = await snapshotExisting(client);
  const beforeCounts = (await client.query(`SELECT
    (SELECT COUNT(*)::int FROM documents) AS documents,
    (SELECT COUNT(*)::int FROM document_versions) AS versions,
    (SELECT COUNT(*)::int FROM document_import_provenance) AS provenance,
    (SELECT COUNT(*)::int FROM document_drafts) AS drafts`)).rows[0];
  if (beforeCounts.drafts !== 0) throw new Error("Batch 2 preflight found active drafts");
  const collisions = await client.query("SELECT slug FROM documents WHERE slug=ANY($1)", [expectedSlugs]);
  if (collisions.rowCount) throw new Error(`Batch 2 target already exists: ${collisions.rows.map((row) => row.slug).join(", ")}`);

  const importedAt = new Date();
  const provenanceRepository = new PostgresProvenanceRepository(pool, { clock: () => importedAt });
  const imported = [];
  for (const item of prepared) {
    const versionId = randomUUID();
    await client.query(`INSERT INTO documents(id,slug,title,description,default_visibility,browse_path,route_path,historical_first_published_at,imported_at,created_at,updated_at,current_published_version_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,NULL,$8,$8,$8,NULL)`,
    [item.documentId, item.slug, item.title, item.description, item.visibility, item.browsePath, `/docs/${item.slug}`, importedAt]);
    await client.query(`INSERT INTO document_versions(id,document_id,version_number,canonical_markdown,content_hash,published_at,published_by,publication_kind)
      VALUES($1,$2,1,$3,$4,$5,'migration:batch-2','initial_import')`,
    [versionId, item.documentId, item.canonicalMarkdown, item.contentHash, importedAt]);
    await client.query("UPDATE documents SET current_published_version_id=$2 WHERE id=$1", [item.documentId, versionId]);
    const provenance = await provenanceRepository.create(item.slug, { sourcePath: item.sourcePath, sourceSha256: item.sourceSha256, importMethod: item.importMethod }, client);
    imported.push({ documentId: item.documentId, slug: item.slug, versionId, contentHash: item.contentHash, provenanceId: provenance.id, sourceSha256: provenance.source_sha256 });
  }

  const afterCounts = (await client.query(`SELECT
    (SELECT COUNT(*)::int FROM documents) AS documents,
    (SELECT COUNT(*)::int FROM document_versions) AS versions,
    (SELECT COUNT(*)::int FROM document_import_provenance) AS provenance,
    (SELECT COUNT(*)::int FROM document_drafts) AS drafts`)).rows[0];
  if (afterCounts.documents !== beforeCounts.documents + 5 || afterCounts.versions !== beforeCounts.versions + 5 || afterCounts.provenance !== beforeCounts.provenance + 5 || afterCounts.drafts !== 0) throw new Error("Batch 2 count validation failed");
  const after = await snapshotExisting(client);
  const preExistingAfter = { documents: after.documents.filter((row) => !expectedSlugs.includes(row.slug)), assets: after.assets };
  if (!equal(preExistingAfter, before)) throw new Error("A pre-existing document or asset changed during Batch 2");
  const importedRows = await client.query(`SELECT d.slug,d.id,d.description,d.default_visibility,d.browse_path,v.version_number,v.content_hash,v.publication_kind,
    COUNT(p.id)::int AS provenance_count,COUNT(dr.document_id)::int AS draft_count
    FROM documents d JOIN document_versions v ON v.id=d.current_published_version_id
    LEFT JOIN document_import_provenance p ON p.document_id=d.id LEFT JOIN document_drafts dr ON dr.document_id=d.id
    WHERE d.slug=ANY($1) GROUP BY d.id,v.id ORDER BY d.slug`, [expectedSlugs]);
  if (importedRows.rowCount !== 5 || importedRows.rows.some((row) => row.version_number !== 1 || row.publication_kind !== "initial_import" || row.provenance_count !== 1 || row.draft_count !== 0)) throw new Error("Imported row validation failed");

  await client.query("COMMIT");
  console.log(JSON.stringify({ importedAt: importedAt.toISOString(), countsBefore: beforeCounts, countsAfter: afterCounts, imported, importedRows: importedRows.rows }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
