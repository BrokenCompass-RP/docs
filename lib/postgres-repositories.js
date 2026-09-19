import { createHash, randomUUID } from "node:crypto";
import { parseCanonicalMarkdown } from "./access-markdown.js";
import { getDocumentDefinition } from "./content-registry.js";

const hash = (source) => createHash("sha256").update(source).digest("hex");
const versionLabel = (number) => `v${String(number).padStart(6, "0")}`;
const iso = (value) => value instanceof Date ? value.toISOString() : value;

function mapVersion(row) {
  if (!row) return null;
  return {
    documentId: row.document_id,
    documentSlug: row.slug,
    internalVersionId: row.id,
    versionId: versionLabel(row.version_number),
    versionNumber: row.version_number,
    firstPublished: row.historical_first_published_at ? iso(row.historical_first_published_at) : null,
    firstPublishedKnown: Boolean(row.historical_first_published_at),
    importedAt: iso(row.imported_at),
    publishedAt: iso(row.published_at),
    publishedBy: row.published_by,
    publicationKind: row.publication_kind,
    recoveredFromVersion: row.recovered_from_number ? versionLabel(row.recovered_from_number) : undefined,
    contentHash: row.content_hash,
    canonicalMarkdown: row.canonical_markdown
  };
}

const VERSION_SELECT = `
  SELECT v.*, d.slug, d.historical_first_published_at, d.imported_at,
         recovered.version_number AS recovered_from_number
  FROM document_versions v
  JOIN documents d ON d.id = v.document_id
  LEFT JOIN document_versions recovered ON recovered.id = v.recovered_from_version_id`;

async function queryVersion(client, suffix, parameters) {
  const result = await client.query(`${VERSION_SELECT} ${suffix}`, parameters);
  return mapVersion(result.rows[0]);
}

export class PostgresDraftRepository {
  constructor(pool) { this.pool = pool; }

  async read(slug) {
    const result = await this.pool.query(`SELECT dr.canonical_markdown FROM document_drafts dr JOIN documents d ON d.id=dr.document_id WHERE d.slug=$1`, [slug]);
    return result.rows[0]?.canonical_markdown ?? null;
  }

  async save(slug, source, options = {}) {
    const result = await this.pool.query(`SELECT id, current_published_version_id FROM documents WHERE slug=$1`, [slug]);
    if (!result.rows[0]) throw new Error(`Unknown document: ${slug}`);
    const now = new Date();
    await this.pool.query(`INSERT INTO document_drafts(document_id, canonical_markdown, author_identity, base_published_version_id, created_at, updated_at)
      VALUES($1,$2,$3,$4,$5,$5)
      ON CONFLICT(document_id) DO UPDATE SET canonical_markdown=EXCLUDED.canonical_markdown, author_identity=EXCLUDED.author_identity, updated_at=EXCLUDED.updated_at`,
      [result.rows[0].id, source, options.authorIdentity ?? null, result.rows[0].current_published_version_id, now]);
  }

  async discard(slug) {
    await this.pool.query(`DELETE FROM document_drafts USING documents WHERE document_drafts.document_id=documents.id AND documents.slug=$1`, [slug]);
  }
}

export class PostgresVersionRepository {
  constructor(pool, options = {}) { this.pool = pool; this.clock = options.clock ?? (() => new Date()); this.beforePointerUpdate = options.beforePointerUpdate; }

  async ensureInitialized(slug, canonicalMarkdown) {
    const definition = getDocumentDefinition(slug);
    if (!definition) throw new Error(`Unknown document: ${slug}`);
    const parsed = parseCanonicalMarkdown(canonicalMarkdown);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const now = this.clock();
      await client.query(`INSERT INTO documents(id,slug,title,description,default_visibility,historical_first_published_at,imported_at,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,NULL,$6,$6,$6) ON CONFLICT(slug) DO NOTHING`,
        [definition.id, slug, parsed.frontmatter.title, parsed.frontmatter.description ?? "", parsed.frontmatter.default_visibility, now]);
      const locked = await client.query(`SELECT * FROM documents WHERE slug=$1 FOR UPDATE`, [slug]);
      if (!locked.rows[0].current_published_version_id) {
        const versionId = randomUUID();
        await client.query(`INSERT INTO document_versions(id,document_id,version_number,canonical_markdown,content_hash,published_at,published_by,publication_kind)
          VALUES($1,$2,1,$3,$4,$5,'system-import','initial_import')`, [versionId, locked.rows[0].id, canonicalMarkdown, hash(canonicalMarkdown), now]);
        await client.query(`UPDATE documents SET current_published_version_id=$1,updated_at=$2 WHERE id=$3`, [versionId, now, locked.rows[0].id]);
      }
      await client.query("COMMIT");
      return this.getCurrent(slug);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  async getCurrent(slug) {
    return queryVersion(this.pool, `WHERE d.slug=$1 AND v.id=d.current_published_version_id`, [slug]);
  }

  async getVersion(slug, versionId) {
    const match = /^v(\d{6})$/.exec(versionId ?? "");
    if (!match) return null;
    return queryVersion(this.pool, `WHERE d.slug=$1 AND v.version_number=$2`, [slug, Number(match[1])]);
  }

  async listVersions(slug) {
    const result = await this.pool.query(`${VERSION_SELECT} WHERE d.slug=$1 ORDER BY v.version_number DESC`, [slug]);
    return result.rows.map(mapVersion);
  }

  async publishDraftTransaction(slug, publishedBy, validate) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const documentResult = await client.query(`SELECT * FROM documents WHERE slug=$1 FOR UPDATE`, [slug]);
      const document = documentResult.rows[0];
      if (!document) throw new Error(`Unknown document: ${slug}`);
      const draftResult = await client.query(`SELECT * FROM document_drafts WHERE document_id=$1 FOR UPDATE`, [document.id]);
      const draft = draftResult.rows[0];
      if (!draft) throw new Error("There is no saved draft to publish");
      validate(draft.canonical_markdown);
      const numberResult = await client.query(`SELECT COALESCE(MAX(version_number),0)+1 AS next FROM document_versions WHERE document_id=$1`, [document.id]);
      const versionNumber = Number(numberResult.rows[0].next);
      const id = randomUUID();
      const now = this.clock();
      await client.query(`INSERT INTO document_versions(id,document_id,version_number,canonical_markdown,content_hash,published_at,published_by,publication_kind)
        VALUES($1,$2,$3,$4,$5,$6,$7,'publish')`, [id, document.id, versionNumber, draft.canonical_markdown, hash(draft.canonical_markdown), now, publishedBy]);
      if (this.beforePointerUpdate) await this.beforePointerUpdate({ slug, versionNumber });
      await client.query(`UPDATE documents SET current_published_version_id=$1,updated_at=$2 WHERE id=$3`, [id, now, document.id]);
      await client.query(`DELETE FROM document_drafts WHERE document_id=$1`, [document.id]);
      await client.query("COMMIT");
      return this.getVersion(slug, versionLabel(versionNumber));
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  async recover(slug, versionId, options = {}) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const documentResult = await client.query(`SELECT * FROM documents WHERE slug=$1 FOR UPDATE`, [slug]);
      const document = documentResult.rows[0];
      if (!document) throw new Error(`Unknown document: ${slug}`);
      const match = /^v(\d{6})$/.exec(versionId ?? "");
      const historical = match && (await client.query(`SELECT * FROM document_versions WHERE document_id=$1 AND version_number=$2`, [document.id, Number(match[1])])).rows[0];
      if (!historical) throw new Error(`Unknown version: ${versionId}`);
      parseCanonicalMarkdown(historical.canonical_markdown);
      const numberResult = await client.query(`SELECT MAX(version_number)+1 AS next FROM document_versions WHERE document_id=$1`, [document.id]);
      const versionNumber = Number(numberResult.rows[0].next);
      const id = randomUUID();
      const now = this.clock();
      await client.query(`INSERT INTO document_versions(id,document_id,version_number,canonical_markdown,content_hash,published_at,published_by,publication_kind,recovered_from_version_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,'recovery',$8)`, [id, document.id, versionNumber, historical.canonical_markdown, hash(historical.canonical_markdown), now, options.publishedBy ?? null, historical.id]);
      await client.query(`UPDATE documents SET current_published_version_id=$1,updated_at=$2 WHERE id=$3`, [id, now, document.id]);
      await client.query("COMMIT");
      return this.getVersion(slug, versionLabel(versionNumber));
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
}

function mapFlag(row, comments = [], resolution = null) {
  return {
    flagId: row.id, documentId: row.document_id, sectionId: row.section_id,
    sectionHeading: row.section_heading, reason: row.reason, initialComment: row.initial_comment,
    reporterIdentity: row.reporter_identity, createdAt: iso(row.created_at),
    versionAtReport: versionLabel(row.report_version_number),
    status: resolution ? "resolved" : "open", comments, resolution
  };
}

export class PostgresReviewRepository {
  constructor(pool, options = {}) { this.pool = pool; this.clock = options.clock ?? (() => new Date()); }

  async createFlag(input) {
    const id = randomUUID();
    const result = await this.pool.query(`INSERT INTO review_flags(id,document_id,section_id,section_heading,reason,initial_comment,reporter_identity,created_at,version_at_report_id)
      SELECT $1,d.id,$3,$4,$5,$6,$7,$8,v.id FROM documents d JOIN document_versions v ON v.document_id=d.id AND v.version_number=$9 WHERE d.slug=$2 RETURNING *`,
      [id, input.documentId, input.sectionId ?? null, input.sectionHeading ?? null, input.reason, input.initialComment, input.reporterIdentity ?? null, this.clock(), Number(input.versionAtReport.slice(1))]);
    if (!result.rows[0]) throw new Error("Document version not found");
    return this.getFlag(input.documentId, id);
  }

  async getFlag(slug, flagId) {
    const result = await this.pool.query(`SELECT f.*,rv.version_number AS report_version_number FROM review_flags f JOIN documents d ON d.id=f.document_id JOIN document_versions rv ON rv.id=f.version_at_report_id WHERE d.slug=$1 AND f.id=$2`, [slug, flagId]);
    if (!result.rows[0]) return null;
    const comments = await this.pool.query(`SELECT id AS comment_id,author_identity,body,created_at FROM review_comments WHERE flag_id=$1 ORDER BY created_at,id`, [flagId]);
    const resolutionResult = await this.pool.query(`SELECT r.*,v.version_number AS resolution_version_number FROM review_resolutions r JOIN document_versions v ON v.id=r.version_at_resolution_id WHERE r.flag_id=$1`, [flagId]);
    const resolution = resolutionResult.rows[0] ? { resolvedAt: iso(resolutionResult.rows[0].resolved_at), resolvedBy: resolutionResult.rows[0].resolved_by, versionAtResolution: versionLabel(resolutionResult.rows[0].resolution_version_number) } : null;
    return mapFlag(result.rows[0], comments.rows.map((row) => ({ commentId: row.comment_id, authorIdentity: row.author_identity, body: row.body, createdAt: iso(row.created_at) })), resolution);
  }

  async listForDocument(slug) {
    const result = await this.pool.query(`SELECT f.id FROM review_flags f JOIN documents d ON d.id=f.document_id WHERE d.slug=$1 ORDER BY f.created_at DESC`, [slug]);
    return Promise.all(result.rows.map((row) => this.getFlag(slug, row.id)));
  }

  async addComment(slug, flagId, authorIdentity, body) {
    if (!(await this.getFlag(slug, flagId))) throw new Error("Flag not found");
    const id = randomUUID();
    const createdAt = this.clock();
    await this.pool.query(`INSERT INTO review_comments(id,flag_id,author_identity,body,created_at) VALUES($1,$2,$3,$4,$5)`, [id, flagId, authorIdentity, body, createdAt]);
    return { commentId: id, authorIdentity, body, createdAt: createdAt.toISOString() };
  }

  async resolve(slug, flagId, resolvedBy, versionAtResolution) {
    const flag = await this.getFlag(slug, flagId);
    if (!flag) throw new Error("Flag not found");
    if (flag.status === "resolved") throw new Error("Flag is already resolved");
    const result = await this.pool.query(`INSERT INTO review_resolutions(flag_id,resolved_by,resolved_at,version_at_resolution_id)
      SELECT $1,$2,$3,v.id FROM documents d JOIN document_versions v ON v.document_id=d.id AND v.version_number=$4 WHERE d.slug=$5`,
      [flagId, resolvedBy, this.clock(), Number(versionAtResolution.slice(1)), slug]);
    if (!result.rowCount) throw new Error("Resolution version not found");
    return this.getFlag(slug, flagId);
  }
}
