import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BROWSE_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyTitle(title) {
  const slug = String(title ?? "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "document";
}

export function validateBrowsePath(value) {
  if (!Array.isArray(value) || value.length === 0 || value.some((part) => !BROWSE_SEGMENT.test(part))) {
    throw new Error("Choose a valid browse location");
  }
  return [...value];
}

function mapDocument(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    defaultVisibility: row.default_visibility,
    browsePath: [...(row.browse_path ?? [])],
    url: row.route_path ?? `/docs/${row.slug}`,
    published: Boolean(row.current_published_version_id)
  };
}

export class PostgresDocumentRepository {
  constructor(pool, options = {}) { this.pool = pool; this.clock = options.clock ?? (() => new Date()); }

  async list() {
    const result = await this.pool.query("SELECT * FROM documents ORDER BY title, slug");
    return result.rows.map(mapDocument);
  }

  async get(slug) {
    const result = await this.pool.query("SELECT * FROM documents WHERE slug=$1", [slug]);
    return mapDocument(result.rows[0]);
  }

  async create(input) {
    const browsePath = validateBrowsePath(input.browsePath);
    const base = slugifyTitle(input.slug ?? input.title);
    if (!SLUG.test(base)) throw new Error("Invalid document slug");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      let slug = base;
      for (let suffix = 2; await client.query("SELECT 1 FROM documents WHERE slug=$1", [slug]).then((r) => r.rowCount > 0); suffix += 1) slug = `${base}-${suffix}`;
      const now = this.clock();
      const result = await client.query(`INSERT INTO documents(id,slug,title,description,default_visibility,browse_path,route_path,historical_first_published_at,imported_at,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,NULL,$8,$8,$8) RETURNING *`,
      [randomUUID(), slug, input.title, input.description ?? "", input.defaultVisibility, browsePath, `/docs/${slug}`, now]);
      await client.query("COMMIT");
      return mapDocument(result.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  async updateMetadata(slug, input) {
    const browsePath = validateBrowsePath(input.browsePath);
    const result = await this.pool.query(`UPDATE documents SET title=$2,description=$3,default_visibility=$4,browse_path=$5,updated_at=$6 WHERE slug=$1 RETURNING *`,
      [slug, input.title, input.description ?? "", input.defaultVisibility, browsePath, this.clock()]);
    if (!result.rows[0]) throw new Error(`Unknown document: ${slug}`);
    return mapDocument(result.rows[0]);
  }
}

export class FileDocumentRepository {
  constructor(filename, seeds = []) { this.filename = filename; this.seeds = seeds; }
  async readAll() {
    try { return JSON.parse(await readFile(this.filename, "utf8")); }
    catch (error) { if (error.code === "ENOENT") return this.seeds.map((item) => ({ ...item, title: item.title ?? item.slug, description: item.description ?? "", defaultVisibility: item.defaultVisibility ?? "public", published: true })); throw error; }
  }
  async writeAll(items) {
    await mkdir(path.dirname(this.filename), { recursive: true });
    const temporary = `${this.filename}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(items, null, 2));
    await rename(temporary, this.filename);
  }
  async list() { return this.readAll(); }
  async get(slug) { return (await this.readAll()).find((item) => item.slug === slug) ?? null; }
  async create(input) {
    const items = await this.readAll(); const base = slugifyTitle(input.slug ?? input.title); let slug = base; let suffix = 2;
    while (items.some((item) => item.slug === slug)) slug = `${base}-${suffix++}`;
    const item = { id: randomUUID(), slug, title: input.title, description: input.description ?? "", defaultVisibility: input.defaultVisibility, browsePath: validateBrowsePath(input.browsePath), url: `/docs/${slug}`, published: false };
    items.push(item); await this.writeAll(items); return item;
  }
  async updateMetadata(slug, input) {
    const items = await this.readAll(); const index = items.findIndex((item) => item.slug === slug); if (index < 0) throw new Error(`Unknown document: ${slug}`);
    items[index] = { ...items[index], title: input.title, description: input.description ?? "", defaultVisibility: input.defaultVisibility, browsePath: validateBrowsePath(input.browsePath) };
    await this.writeAll(items); return items[index];
  }
}
