import "server-only";
import path from "node:path";
import { listDocumentDefinitions } from "./content-registry.js";
import { FileDocumentRepository, PostgresDocumentRepository } from "./document-repository.js";
import { resolvePersistenceConfig } from "./persistence-config.js";
import { getPostgresPool } from "./postgres.js";

const seeds = listDocumentDefinitions().map((item) => ({ ...item, title: item.slug, defaultVisibility: "public", published: true }));
const config = resolvePersistenceConfig();
export const documentRepository = config.backend === "postgres"
  ? new PostgresDocumentRepository(getPostgresPool())
  : new FileDocumentRepository(path.join(process.cwd(), ".documents", "catalog.json"), seeds);
