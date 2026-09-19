import { readFile, readdir } from "node:fs/promises";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const directory = new URL("../db/migrations/", import.meta.url);
  const migrations = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const migration of migrations) {
    await pool.query(await readFile(new URL(migration, directory), "utf8"));
    console.log(`Applied PostgreSQL migration ${migration}`);
  }
} finally {
  await pool.end();
}
