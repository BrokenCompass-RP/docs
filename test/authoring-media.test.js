import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseCanonicalMarkdown, renderProjection } from "../lib/access-markdown.js";
import { FileAssetRepository } from "../lib/asset-repository.js";
import { FileDocumentRepository, slugifyTitle } from "../lib/document-repository.js";
import { assetMarkdown, validateImageUpload } from "../lib/image-validation.js";
import { FileVersionRepository } from "../lib/version-repository.js";

const png = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]);

test("document creation assigns stable UUIDs, collision-safe slugs, and durable browse placement", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-documents-")); t.after(() => rm(root, { recursive: true, force: true }));
  const repository = new FileDocumentRepository(path.join(root, "catalog.json"));
  const first = await repository.create({ title: "Phone Directory", description: "One", defaultVisibility: "public", browsePath: ["getting-started"] });
  const second = await repository.create({ title: "Phone Directory", description: "Two", defaultVisibility: "developer", browsePath: ["development"] });
  assert.match(first.id, /^[0-9a-f-]{36}$/); assert.notEqual(first.id, second.id);
  assert.equal(first.slug, "phone-directory"); assert.equal(second.slug, "phone-directory-2");
  const moved = await repository.updateMetadata(first.slug, { ...first, browsePath: ["getting-started", "jobs"] });
  assert.equal(moved.id, first.id); assert.equal(moved.slug, first.slug); assert.deepEqual((await repository.get(first.slug)).browsePath, ["getting-started", "jobs"]);
  assert.equal(slugifyTitle("Résumé & Help"), "resume-and-help");
});

test("image upload requires alt text, validates type and bytes, and never uses filenames as paths", async (t) => {
  assert.throws(() => validateImageUpload({ mediaType: "image/png", bytes: png, alt: "" }), /alt text/i);
  assert.throws(() => validateImageUpload({ mediaType: "image/svg+xml", bytes: png, alt: "Diagram" }), /Only PNG/);
  assert.throws(() => validateImageUpload({ mediaType: "image/png", bytes: new Uint8Array([1,2,3]), alt: "Diagram" }), /do not match/);
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-assets-")); t.after(() => rm(root, { recursive: true, force: true }));
  const assets = new FileAssetRepository(root);
  const asset = await assets.create({ documentSlug: "guide", filename: "../../unsafe.png", mediaType: "image/png", bytes: png, alt: "Diagram", visibility: "developer" });
  assert.equal(asset.originalFilename, "unsafe.png"); assert.equal(asset.visibility, "developer");
  assert.deepEqual(new Uint8Array((await assets.get(asset.id)).content), png);
});

test("managed images render responsively through projections without leaking restricted references", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  const source = `---\ntitle: Images\ndefault_visibility: public\n---\n## Public\nPublic.\n\n:::access visibility="administrator"\n## Secret\n${assetMarkdown(id, "Floor plan", "Restricted plan")}\n:::`;
  const document = parseCanonicalMarkdown(source);
  assert.doesNotMatch(renderProjection(document, "developer"), new RegExp(id));
  const html = renderProjection(document, "administrator");
  assert.match(html, new RegExp(`/api/assets/${id}`)); assert.match(html, /alt="Floor plan"/); assert.match(html, /<figcaption>Restricted plan<\/figcaption>/);
});

test("immutable versions retain and recover their historical asset references", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bc-image-history-")); t.after(() => rm(root, { recursive: true, force: true }));
  const versions = new FileVersionRepository(root);
  const a = "123e4567-e89b-12d3-a456-426614174000", b = "123e4567-e89b-12d3-a456-426614174001";
  const source = (id) => `---\ntitle: History\ndefault_visibility: public\n---\n## Image\n![Alt](asset:${id})`;
  await versions.publish("history", source(a)); await versions.publish("history", source(b));
  assert.match((await versions.getVersion("history", "v000001")).canonicalMarkdown, new RegExp(a));
  assert.match((await versions.getCurrent("history")).canonicalMarkdown, new RegExp(b));
  const recovered = await versions.recover("history", "v000001");
  assert.match(recovered.canonicalMarkdown, new RegExp(a)); assert.match((await versions.getVersion("history", "v000002")).canonicalMarkdown, new RegExp(b));
});

test("asset delivery and upload routes are server-authorized and SVG is not accepted", async () => {
  const delivery = await readFile(new URL("../app/api/assets/[id]/route.js", import.meta.url), "utf8");
  const upload = await readFile(new URL("../app/api/manager/documents/[slug]/assets/route.js", import.meta.url), "utf8");
  assert.match(delivery, /getRequestAuthorization/); assert.match(delivery, /projectSections/); assert.match(delivery, /status: 404/);
  assert.match(upload, /getManagerAuthorization/); assert.doesNotMatch(upload, /image\/svg/);
});
