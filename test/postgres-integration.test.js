import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { parseCanonicalMarkdown, renderProjection } from "../lib/access-markdown.js";
import { getDocumentDefinition, loadSeedSource } from "../lib/content-registry.js";
import { PostgresDraftRepository, PostgresReviewRepository, PostgresVersionRepository } from "../lib/postgres-repositories.js";
import { PostgresDocumentRepository } from "../lib/document-repository.js";
import { PostgresAssetRepository } from "../lib/asset-repository.js";
import { createPublicationService } from "../lib/publication-service.js";
import { createReviewService } from "../lib/review-service.js";
import { searchParsedDocuments } from "../lib/search-engine.js";

const databaseUrl = process.env.TEST_DATABASE_URL;

test("PostgreSQL durable lifecycle", { skip: !databaseUrl }, async () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const migration = await readFile(new URL("../db/migrations/001_initial.sql", import.meta.url), "utf8");
    await pool.query(migration);
    await pool.query(await readFile(new URL("../db/migrations/003_authoring_media.sql", import.meta.url), "utf8"));
    await pool.query("TRUNCATE documents CASCADE");

    const seed = await loadSeedSource("building-manager");
    const versions = new PostgresVersionRepository(pool);
    const drafts = new PostgresDraftRepository(pool);
    const reviews = new PostgresReviewRepository(pool);
    const publication = createPublicationService({ drafts, versions });
    const review = createReviewService({ repository: reviews });
    const documents = new PostgresDocumentRepository(pool);
    const assets = new PostgresAssetRepository(pool);

    const initial = await versions.ensureInitialized("building-manager", seed);
    assert.equal(initial.documentId, getDocumentDefinition("building-manager").id);
    assert.equal(initial.versionId, "v000001");
    assert.equal(initial.firstPublished, null);
    assert.equal(initial.publicationKind, "initial_import");
    assert.equal((await versions.ensureInitialized("building-manager", seed)).versionId, "v000001");

    const created = await documents.create({ title: "Integration authoring", description: "Draft only", defaultVisibility: "public", browsePath: ["getting-started"] });
    const stableId = created.id;
    const image = await assets.create({ documentSlug: created.slug, filename: "test.png", mediaType: "image/png", bytes: new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), alt: "Test", visibility: "public" });
    const authored = `---\ntitle: Integration authoring\ndescription: Published\ndefault_visibility: public\n---\n## Image\n![Test](asset:${image.id})`;
    await drafts.save(created.slug, authored, { authorIdentity: "actor-test" });
    assert.equal((await documents.get(created.slug)).published, false);
    const authoredV1 = await publication.publishDraft(created.slug, "developer", "actor-test");
    assert.equal(authoredV1.versionId, "v000001"); assert.equal((await documents.get(created.slug)).published, true);
    const moved = await documents.updateMetadata(created.slug, { title: created.title, description: created.description, defaultVisibility: created.defaultVisibility, browsePath: ["community"] });
    assert.equal(moved.id, stableId); assert.deepEqual(moved.browsePath, ["community"]); assert.equal((await versions.listVersions(created.slug)).length, 1);

    const draft = seed.replace("## Developer notes", "## Developer notes\n\npostgres-developer-marker-418");
    await drafts.save("building-manager", draft, { authorIdentity: "developer", browsePath: ["community"] });
    assert.equal(await drafts.read("building-manager"), draft);
    assert.deepEqual((await documents.get("building-manager")).browsePath, ["systems-features"]);
    assert.doesNotMatch((await versions.getCurrent("building-manager")).canonicalMarkdown, /postgres-developer-marker-418/);

    const published = await publication.publishDraft("building-manager", "developer");
    assert.equal(published.versionId, "v000002");
    assert.equal(await drafts.read("building-manager"), null);
    assert.match((await versions.getCurrent("building-manager")).canonicalMarkdown, /postgres-developer-marker-418/);
    assert.deepEqual((await documents.get("building-manager")).browsePath, ["community"]);
    assert.equal((await versions.getVersion("building-manager", "v000001")).canonicalMarkdown, seed);

    await drafts.save("building-manager", seed.replace("## Current status", "## Current status\n\nrollback-marker"));
    const failingVersions = new PostgresVersionRepository(pool, { beforePointerUpdate: () => { throw new Error("simulated transaction failure"); } });
    const failingPublication = createPublicationService({ drafts, versions: failingVersions });
    await assert.rejects(() => failingPublication.publishDraft("building-manager", "developer"), /simulated transaction failure/);
    assert.equal((await versions.getCurrent("building-manager")).versionId, "v000002");
    assert.match(await drafts.read("building-manager"), /rollback-marker/);
    assert.equal((await versions.listVersions("building-manager")).length, 2);
    await drafts.discard("building-manager");

    const flag = await review.createFlag({ documentId: "building-manager", sectionId: "property-finder", sectionHeading: "Property Finder", reason: "outdated", initialComment: "postgres-review-marker-729", versionAtReport: "v000002" }, "public");
    assert.equal(flag.reporterIdentity, null);
    await assert.rejects(() => review.list("building-manager", "public"), /not authorized/);
    await assert.rejects(() => review.list("building-manager", "moderator"), /not authorized/);
    await review.addComment("building-manager", flag.flagId, "postgres-comment-marker-623", "administrator");

    const recovered = await publication.recoverVersion("building-manager", "v000001", "developer");
    assert.equal(recovered.versionId, "v000003");
    assert.equal((await review.list("building-manager", "developer"))[0].status, "open");
    const resolved = await review.resolve("building-manager", flag.flagId, "administrator", recovered.versionId);
    assert.equal(resolved.status, "resolved");
    assert.equal(resolved.resolution.resolvedBy, "administrator");

    const parsed = { ...parseCanonicalMarkdown((await versions.getCurrent("building-manager")).canonicalMarkdown), slug: "building-manager", url: "/guides/building-manager" };
    for (const identity of ["public", "moderator", "developer", "administrator"]) {
      assert.doesNotMatch(renderProjection(parsed, identity), /postgres-review-marker|postgres-comment-marker/);
      assert.equal(searchParsedDocuments([parsed], "postgres-review-marker-729", identity).length, 0);
      assert.equal(searchParsedDocuments([parsed], "postgres-comment-marker-623", identity).length, 0);
    }
  } finally {
    await pool.query("TRUNCATE documents CASCADE").catch(() => {});
    await pool.end();
  }
});
