export function resolvePersistenceConfig(environment = process.env) {
  const production = environment.NODE_ENV === "production";
  const backend = environment.PERSISTENCE_BACKEND || (production ? null : "filesystem");
  if (backend !== "filesystem" && backend !== "postgres") {
    throw new Error(production
      ? "PERSISTENCE_BACKEND=postgres is required in production"
      : "PERSISTENCE_BACKEND must be filesystem or postgres");
  }
  if (production && backend !== "postgres") {
    throw new Error("Filesystem persistence is disabled in production");
  }
  if (backend === "postgres" && !environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for PostgreSQL persistence");
  }
  return Object.freeze({ backend, databaseUrl: backend === "postgres" ? environment.DATABASE_URL : null });
}
