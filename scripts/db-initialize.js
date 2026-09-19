import pg from "pg";
import { listDocumentDefinitions, loadSeedSource } from "../lib/content-registry.js";
import { PostgresVersionRepository } from "../lib/postgres-repositories.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const versions = new PostgresVersionRepository(pool);
  for (const document of listDocumentDefinitions()) {
    const version = await versions.ensureInitialized(document.slug, await loadSeedSource(document.slug));
    await pool.query("UPDATE documents SET browse_path=$2,route_path=$3 WHERE slug=$1", [document.slug, document.browsePath, document.url]);
    console.log(`${document.slug}: ${document.id} ${version.versionId}`);
  }
} finally {
  await pool.end();
}
