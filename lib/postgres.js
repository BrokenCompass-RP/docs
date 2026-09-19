import "server-only";
import pg from "pg";
import { resolvePersistenceConfig } from "./persistence-config.js";

let pool;

export function getPostgresPool() {
  const config = resolvePersistenceConfig();
  if (config.backend !== "postgres") throw new Error("PostgreSQL persistence is not configured");
  pool ??= new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
  return pool;
}
