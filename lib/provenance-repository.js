import { randomUUID } from "node:crypto";

const SHA256 = /^[0-9a-f]{64}$/;

export function validateImportProvenance(input) {
  if (typeof input.sourcePath !== "string" || !input.sourcePath.trim()) throw new Error("Source path is required");
  if (!SHA256.test(input.sourceSha256 ?? "")) throw new Error("Source SHA-256 must be 64 lowercase hexadecimal characters");
  if (typeof input.importMethod !== "string" || !input.importMethod.trim()) throw new Error("Import method is required");
  return {
    sourcePath: input.sourcePath.trim(),
    sourceSha256: input.sourceSha256,
    importMethod: input.importMethod.trim()
  };
}

export class PostgresProvenanceRepository {
  constructor(pool, options = {}) { this.pool = pool; this.clock = options.clock ?? (() => new Date()); }

  async create(documentSlug, input, client = this.pool) {
    const value = validateImportProvenance(input);
    const result = await client.query(`INSERT INTO document_import_provenance(id,document_id,source_path,source_sha256,imported_at,import_method)
      SELECT $1,id,$3,$4,$5,$6 FROM documents WHERE slug=$2
      ON CONFLICT(document_id,source_path,source_sha256) DO NOTHING RETURNING *`,
    [randomUUID(), documentSlug, value.sourcePath, value.sourceSha256, this.clock(), value.importMethod]);
    if (result.rows[0]) return result.rows[0];
    const existing = await client.query(`SELECT p.* FROM document_import_provenance p JOIN documents d ON d.id=p.document_id
      WHERE d.slug=$1 AND p.source_path=$2 AND p.source_sha256=$3`, [documentSlug, value.sourcePath, value.sourceSha256]);
    if (!existing.rows[0]) throw new Error(`Unknown document: ${documentSlug}`);
    return existing.rows[0];
  }

  async list(documentSlug) {
    const result = await this.pool.query(`SELECT p.source_path,p.source_sha256,p.imported_at,p.import_method
      FROM document_import_provenance p JOIN documents d ON d.id=p.document_id
      WHERE d.slug=$1 ORDER BY p.imported_at,p.id`, [documentSlug]);
    return result.rows;
  }
}
