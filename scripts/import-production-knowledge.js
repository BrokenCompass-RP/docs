import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

const filename = process.argv[2];
const expectedHash = process.argv[3];
if (!filename || !/^[a-f0-9]{64}$/.test(expectedHash ?? "") || !process.env.DATABASE_URL) throw new Error("Snapshot, expected SHA-256, and DATABASE_URL are required");
const bytes = await readFile(filename);
if (createHash("sha256").update(bytes).digest("hex") !== expectedHash) throw new Error("Snapshot SHA-256 mismatch");
const snapshot = JSON.parse(bytes.toString("utf8"));
if (snapshot.format !== "bcrp-knowledge-v1") throw new Error("Unsupported knowledge snapshot format");
const tables = ["documents", "document_versions", "document_import_provenance", "document_assets", "review_flags", "review_comments", "review_resolutions"];
if (snapshot.counts.documents !== 18 || snapshot.counts.document_versions !== 22 || snapshot.counts.document_import_provenance !== 12 || snapshot.counts.document_assets !== 5 || tables.some((table) => snapshot.data[table]?.length !== snapshot.counts[table])) throw new Error("Snapshot counts do not match approved Batch 2 state");
for (const version of snapshot.data.document_versions) {
  if (createHash("sha256").update(version.canonical_markdown).digest("hex") !== version.content_hash) throw new Error("Snapshot version hash mismatch");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
async function insert(table, row) {
  const columns = Object.keys(row);
  if (columns.some((column) => !/^[a-z0-9_]+$/.test(column))) throw new Error("Unexpected snapshot field");
  const values = columns.map((column) => table === "document_assets" && column === "content" ? Buffer.from(row[column], "base64") : row[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  await client.query(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders.join(",")})`, values);
}
try {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  for (const table of [...tables, "document_drafts", "actors", "actor_external_identities", "authorization_sessions"]) {
    const count = Number((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
    if (count !== 0) throw new Error(`Production database is not empty: ${table}`);
  }
  for (const document of snapshot.data.documents) await insert("documents", { ...document, current_published_version_id: null });
  for (const version of [...snapshot.data.document_versions].sort((a, b) => a.version_number - b.version_number)) await insert("document_versions", version);
  for (const document of snapshot.data.documents) {
    await client.query("UPDATE documents SET current_published_version_id=$2 WHERE id=$1", [document.id, document.current_published_version_id]);
  }
  for (const table of tables.slice(2)) {
    for (const row of snapshot.data[table]) await insert(table, row);
  }
  for (const table of tables) {
    const count = Number((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
    if (count !== snapshot.counts[table]) throw new Error(`Imported count mismatch: ${table}`);
  }
  const drafts = Number((await client.query("SELECT count(*)::int AS count FROM document_drafts")).rows[0].count);
  if (drafts !== 0) throw new Error("Imported database has active drafts");
  await client.query("COMMIT");
  console.log(JSON.stringify({ imported: snapshot.counts, drafts }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
