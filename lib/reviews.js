import "server-only";
import path from "node:path";
import { FileReviewRepository } from "./review-repository.js";
import { resolvePersistenceConfig } from "./persistence-config.js";
import { getPostgresPool } from "./postgres.js";
import { PostgresReviewRepository } from "./postgres-repositories.js";

const config = resolvePersistenceConfig();
export const reviewRepository = config.backend === "postgres"
  ? new PostgresReviewRepository(getPostgresPool())
  : new FileReviewRepository(path.join(process.cwd(), ".reviews"));
