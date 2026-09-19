import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateImageUpload } from "./image-validation.js";

const safeName = (value) => path.basename(String(value || "image")).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "image";

function mapAsset(row, includeContent = false) {
  if (!row) return null;
  return { id: row.id, documentId: row.document_id, documentSlug: row.slug ?? row.document_slug, originalFilename: row.original_filename, mediaType: row.media_type, byteSize: row.byte_size, width: row.width, height: row.height, visibility: row.visibility, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at, ...(includeContent ? { content: row.content } : {}) };
}

export class PostgresAssetRepository {
  constructor(pool, options = {}) { this.pool = pool; this.clock = options.clock ?? (() => new Date()); }
  async create(input) {
    validateImageUpload(input);
    const id = randomUUID();
    const result = await this.pool.query(`WITH inserted AS (INSERT INTO document_assets(id,document_id,original_filename,media_type,byte_size,width,height,visibility,content,created_by,created_at)
      SELECT $1,id,$3,$4,$5,$6,$7,$8,$9,$10,$11 FROM documents WHERE slug=$2 RETURNING *) SELECT inserted.*, $2::text AS slug FROM inserted`,
    [id, input.documentSlug, safeName(input.filename), input.mediaType, input.bytes.length, input.width ?? null, input.height ?? null, input.visibility, Buffer.from(input.bytes), input.createdBy ?? null, this.clock()]);
    if (!result.rows[0]) throw new Error("Document not found");
    return mapAsset(result.rows[0]);
  }
  async get(id) { const result = await this.pool.query("SELECT a.*,d.slug FROM document_assets a JOIN documents d ON d.id=a.document_id WHERE a.id=$1", [id]); return mapAsset(result.rows[0], true); }
  async countForDocument(slug) { const result = await this.pool.query("SELECT count(*)::int AS count FROM document_assets a JOIN documents d ON d.id=a.document_id WHERE d.slug=$1", [slug]); return result.rows[0]?.count ?? 0; }
}

export class FileAssetRepository {
  constructor(root) { this.root = root; }
  async create(input) {
    validateImageUpload(input); const id = randomUUID(); const directory = path.join(this.root, id); await mkdir(directory, { recursive: true });
    const metadata = { id, documentId: input.documentSlug, documentSlug: input.documentSlug, originalFilename: safeName(input.filename), mediaType: input.mediaType, byteSize: input.bytes.length, width: input.width ?? null, height: input.height ?? null, visibility: input.visibility, createdAt: new Date().toISOString() };
    await writeFile(path.join(directory, "metadata.json"), JSON.stringify(metadata)); await writeFile(path.join(directory, "content.bin"), input.bytes); return metadata;
  }
  async get(id) {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    try { const metadata = JSON.parse(await readFile(path.join(this.root, id, "metadata.json"), "utf8")); return { ...metadata, content: await readFile(path.join(this.root, id, "content.bin")) }; }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  }
}
