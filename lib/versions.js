import "server-only";
import path from "node:path";
import { FileVersionRepository } from "./version-repository.js";
import { resolvePersistenceConfig } from "./persistence-config.js";
import { getPostgresPool } from "./postgres.js";
import { PostgresVersionRepository } from "./postgres-repositories.js";

const config = resolvePersistenceConfig();
export const versionRepository = config.backend === "postgres"
  ? new PostgresVersionRepository(getPostgresPool())
  : new FileVersionRepository(path.join(process.cwd(), ".published"));
