import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";

const filename = process.argv[2];
if (!filename || !process.env.DATABASE_URL) throw new Error("Output filename and DATABASE_URL are required");
const tables = ["documents", "document_versions", "document_import_provenance", "document_assets", "review_flags", "review_comments", "review_resolutions"];
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const drafts = Number((await client.query("SELECT count(*)::int AS count FROM document_drafts")).rows[0].count);
  if (drafts !== 0) throw new Error("Source has active drafts");
  const data = {};
  for (const table of tables) {
    const result = await client.query(`SELECT * FROM ${table}`);
    data[table] = result.rows.map((row) => table === "document_assets" ? { ...row, content: row.content.toString("base64") } : row);
  }
  const counts = Object.fromEntries(tables.map((table) => [table, data[table].length]));
  if (counts.documents !== 18 || counts.document_versions !== 22 || counts.document_import_provenance !== 12 || counts.document_assets !== 5) throw new Error("Source does not match approved Batch 2 state");
  for (const version of data.document_versions) {
    const actual = createHash("sha256").update(version.canonical_markdown).digest("hex");
    if (actual !== version.content_hash) throw new Error("Source version content hash mismatch");
  }
  const snapshot = { format: "bcrp-knowledge-v1", counts, data };
  const bytes = Buffer.from(JSON.stringify(snapshot));
  await writeFile(filename, bytes, { flag: "wx", mode: 0o600 });
  await client.query("COMMIT");
  console.log(JSON.stringify({ counts, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
