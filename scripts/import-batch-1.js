import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import pg from "pg";
import { parseCanonicalMarkdown } from "../lib/access-markdown.js";
import { PostgresProvenanceRepository } from "../lib/provenance-repository.js";
import { stableMigrationDocumentId } from "../lib/migration-identity.js";

const EXPECTED_SLUGS = Object.freeze([
  "bcrp-csi-evidence-photo-deployment",
  "bcrp-hud-engineering-backlog",
  "bcrp-hud-lua-to-nui-data-contract",
  "bcrp-hud-phase-1-validation-checklist",
  "bcrp-hud-developer-resource-map",
  "bcrp-hud-ui-redundancy-audit",
  "broken-compass-rp-vehicle-lifecycle-and-impound-architecture-review"
]);
const PROTECTED_SLUGS = Object.freeze(["architecture-guide", "building-manager", "community-rules", "getting-around", "mechanic-job", "phone-directory"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const report = JSON.parse(await readFile(new URL("../migration/dry-run/batch-1-report.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../migration/dry-run/migration-manifest.json", import.meta.url), "utf8"));
if (report.documents.length !== 7 || report.documents.map((item) => item.slug).sort().join("|") !== [...EXPECTED_SLUGS].sort().join("|")) {
  throw new Error("Batch 1 report does not contain exactly the approved seven slugs");
}

const prepared = [];
for (const item of report.documents) {
  const manifestEntry = manifest.entries.find((entry) => entry.sourcePath === item.sourcePath);
  if (!manifestEntry || manifestEntry.sourceSha256 !== item.sourceSha256) throw new Error(`Manifest mismatch for ${item.slug}`);
  const sourceBytes = await readFile(path.join(process.cwd(), item.sourcePath));
  if (sha256(sourceBytes) !== item.sourceSha256) throw new Error(`Source hash mismatch for ${item.slug}`);
  const canonicalMarkdown = await readFile(path.join(process.cwd(), "migration", "dry-run", "batch-1", `${item.slug}.md`), "utf8");
  const canonical = parseCanonicalMarkdown(canonicalMarkdown);
  if (canonical.frontmatter.title !== item.title || canonical.frontmatter.default_visibility !== "developer") throw new Error(`Canonical metadata mismatch for ${item.slug}`);
  if (matter(canonicalMarkdown).content.trim() !== matter(sourceBytes.toString("utf8").replace(/\r\n/g, "\n")).content.trim()) throw new Error(`Canonical body mismatch for ${item.slug}`);
  const documentId = stableMigrationDocumentId(item.sourcePath, item.sourceSha256);
  if (item.documentId && item.documentId !== documentId) throw new Error(`Stable document identity mismatch for ${item.slug}`);
  prepared.push({ ...item, documentId, canonicalMarkdown, contentHash: sha256(canonicalMarkdown) });
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const client = await pool.connect();
try {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  await client.query("LOCK TABLE documents IN SHARE ROW EXCLUSIVE MODE");
  const protectedBefore = await client.query(`SELECT d.id,d.slug,d.browse_path,d.current_published_version_id,
    COUNT(DISTINCT v.id)::int AS version_count,
    current.content_hash AS current_content_hash,
    COUNT(DISTINCT a.id)::int AS asset_count,
    COALESCE(array_agg(DISTINCT a.id ORDER BY a.id) FILTER (WHERE a.id IS NOT NULL),ARRAY[]::uuid[]) AS asset_ids
    FROM documents d
    LEFT JOIN document_versions v ON v.document_id=d.id
    LEFT JOIN document_versions current ON current.id=d.current_published_version_id
    LEFT JOIN document_assets a ON a.document_id=d.id
    WHERE d.slug=ANY($1) GROUP BY d.id,current.content_hash ORDER BY d.slug`, [PROTECTED_SLUGS]);
  if (protectedBefore.rowCount !== 6) throw new Error("The six protected documents were not all present");
  const collisions = await client.query("SELECT slug FROM documents WHERE slug=ANY($1)", [EXPECTED_SLUGS]);
  if (collisions.rowCount) throw new Error(`Batch 1 target already exists: ${collisions.rows.map((row) => row.slug).join(", ")}`);

  const importedAt = new Date();
  const provenanceRepository = new PostgresProvenanceRepository(pool, { clock: () => importedAt });
  const imported = [];
  for (const item of prepared) {
    const versionId = randomUUID();
    await client.query(`INSERT INTO documents(id,slug,title,description,default_visibility,browse_path,route_path,historical_first_published_at,imported_at,created_at,updated_at,current_published_version_id)
      VALUES($1,$2,$3,'','developer',ARRAY['development']::text[],$4,NULL,$5,$5,$5,NULL)`,
    [item.documentId, item.slug, item.title, `/docs/${item.slug}`, importedAt]);
    await client.query(`INSERT INTO document_versions(id,document_id,version_number,canonical_markdown,content_hash,published_at,published_by,publication_kind)
      VALUES($1,$2,1,$3,$4,$5,'migration:batch-1','initial_import')`,
    [versionId, item.documentId, item.canonicalMarkdown, item.contentHash, importedAt]);
    await client.query("UPDATE documents SET current_published_version_id=$2 WHERE id=$1", [item.documentId, versionId]);
    const provenance = await provenanceRepository.create(item.slug, {
      sourcePath: item.sourcePath,
      sourceSha256: item.sourceSha256,
      importMethod: item.importMethod
    }, client);
    imported.push({ documentId: item.documentId, slug: item.slug, versionId, versionNumber: 1, contentHash: item.contentHash, provenanceId: provenance.id, sourcePath: provenance.source_path, sourceSha256: provenance.source_sha256 });
  }

  const protectedAfter = await client.query(`SELECT d.id,d.slug,d.browse_path,d.current_published_version_id,
    COUNT(DISTINCT v.id)::int AS version_count,
    current.content_hash AS current_content_hash,
    COUNT(DISTINCT a.id)::int AS asset_count,
    COALESCE(array_agg(DISTINCT a.id ORDER BY a.id) FILTER (WHERE a.id IS NOT NULL),ARRAY[]::uuid[]) AS asset_ids
    FROM documents d
    LEFT JOIN document_versions v ON v.document_id=d.id
    LEFT JOIN document_versions current ON current.id=d.current_published_version_id
    LEFT JOIN document_assets a ON a.document_id=d.id
    WHERE d.slug=ANY($1) GROUP BY d.id,current.content_hash ORDER BY d.slug`, [PROTECTED_SLUGS]);
  if (JSON.stringify(protectedAfter.rows) !== JSON.stringify(protectedBefore.rows)) throw new Error("Protected-document invariant changed during Batch 1");
  const drafts = await client.query("SELECT COUNT(*)::int AS count FROM document_drafts");
  if (drafts.rows[0].count !== 0) throw new Error("Batch 1 validation found active drafts");
  await client.query("COMMIT");
  console.log(JSON.stringify({ importedAt: importedAt.toISOString(), imported, protectedBefore: protectedBefore.rows, protectedAfter: protectedAfter.rows }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
