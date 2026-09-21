import { readFile } from "node:fs/promises";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const report = JSON.parse(await readFile(new URL("../migration/dry-run/batch-2-report.json", import.meta.url), "utf8"));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const slugs = report.documents.map((item) => item.slug);
  const totals = (await pool.query(`SELECT
    (SELECT COUNT(*)::int FROM documents) AS documents,
    (SELECT COUNT(*)::int FROM document_versions) AS versions,
    (SELECT COUNT(*)::int FROM document_import_provenance) AS provenance,
    (SELECT COUNT(*)::int FROM document_drafts) AS drafts`)).rows[0];
  const rows = (await pool.query(`SELECT d.slug,d.id,d.description,d.default_visibility,d.browse_path,
    v.version_number,v.content_hash,v.publication_kind,p.source_path,p.source_sha256,p.import_method
    FROM documents d JOIN document_versions v ON v.id=d.current_published_version_id
    JOIN document_import_provenance p ON p.document_id=d.id WHERE d.slug=ANY($1) ORDER BY d.slug`, [slugs])).rows;
  const failures = [];
  for (const item of report.documents) {
    const row = rows.find((candidate) => candidate.slug === item.slug);
    if (!row || row.id !== item.documentId || row.description !== item.description || row.default_visibility !== item.visibility || JSON.stringify(row.browse_path) !== JSON.stringify(item.browsePath) || row.version_number !== 1 || row.content_hash !== item.canonicalSha256 || row.publication_kind !== "initial_import" || row.source_path !== item.sourcePath || row.source_sha256 !== item.sourceSha256 || row.import_method !== item.importMethod) failures.push(item.slug);
  }
  const phone = (await pool.query(`SELECT d.id,d.current_published_version_id,v.content_hash,COUNT(a.id)::int AS asset_count,
    array_agg(a.id ORDER BY a.id) FILTER (WHERE a.id IS NOT NULL) AS asset_ids
    FROM documents d JOIN document_versions v ON v.id=d.current_published_version_id
    LEFT JOIN document_assets a ON a.document_id=d.id WHERE d.slug='phone-directory' GROUP BY d.id,v.content_hash`)).rows[0];
  if (rows.length !== 5 || failures.length || totals.drafts !== 0 || phone?.asset_count !== 5) throw new Error(`Batch 2 post-import validation failed: ${failures.join(", ")}`);
  console.log(JSON.stringify({ totals, batch2Validated: rows.length, failures, phoneDirectory: { id: phone.id, currentVersionId: phone.current_published_version_id, contentHash: phone.content_hash, assetCount: phone.asset_count, assetIds: phone.asset_ids } }, null, 2));
} finally {
  await pool.end();
}
