import "server-only";
import path from "node:path";
import { FileAssetRepository, PostgresAssetRepository } from "./asset-repository.js";
import { resolvePersistenceConfig } from "./persistence-config.js";
import { getPostgresPool } from "./postgres.js";

const config = resolvePersistenceConfig();
export const assetRepository = config.backend === "postgres"
  ? new PostgresAssetRepository(getPostgresPool())
  : new FileAssetRepository(path.join(process.cwd(), ".assets"));
