import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateImportProvenance } from "../lib/provenance-repository.js";

test("minimal import provenance requires path, source hash, and method", () => {
  const value = validateImportProvenance({ sourcePath: "content/Guide.docx", sourceSha256: "a".repeat(64), importMethod: "docx-wordprocessingml-text-v1" });
  assert.deepEqual(value, { sourcePath: "content/Guide.docx", sourceSha256: "a".repeat(64), importMethod: "docx-wordprocessingml-text-v1" });
  assert.throws(() => validateImportProvenance({ sourcePath: "", sourceSha256: "bad", importMethod: "" }));
});

test("provenance is document-linked and independent of mutable drafts and Markdown frontmatter", async () => {
  const migration = await readFile(new URL("../db/migrations/004_document_provenance.sql", import.meta.url), "utf8");
  assert.match(migration, /document_id uuid NOT NULL REFERENCES documents\(id\) ON DELETE RESTRICT/);
  assert.match(migration, /source_path text NOT NULL/);
  assert.match(migration, /source_sha256 text NOT NULL/);
  assert.match(migration, /imported_at timestamptz NOT NULL/);
  assert.match(migration, /import_method text NOT NULL/);
  assert.doesNotMatch(migration, /document_drafts/);
});
