import "server-only";
import path from "node:path";
import { FileDraftRepository } from "./draft-repository.js";
import { resolvePersistenceConfig } from "./persistence-config.js";
import { getPostgresPool } from "./postgres.js";
import { PostgresDraftRepository } from "./postgres-repositories.js";

const config = resolvePersistenceConfig();
export const draftRepository = config.backend === "postgres"
  ? new PostgresDraftRepository(getPostgresPool())
  : new FileDraftRepository(path.join(process.cwd(), ".drafts"));
