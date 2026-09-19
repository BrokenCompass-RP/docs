import "server-only";
import { getPostgresPool } from "./postgres.js";
import { PostgresAuthRepository } from "./postgres-auth-repository.js";

let repository;
export function getAuthRepository() {
  repository ??= new PostgresAuthRepository(getPostgresPool());
  return repository;
}
