import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCanonicalMarkdown } from "../lib/access-markdown.js";
import { searchParsedDocuments } from "../lib/search-engine.js";

const definitions = [
  ["building-manager", "/guides/building-manager"],
  ["getting-around", "/docs/getting-around"],
  ["mechanic-job", "/docs/mechanic-job"],
  ["community-rules", "/docs/community-rules"],
  ["architecture-guide", "/docs/architecture-guide"]
];

const documents = await Promise.all(
  definitions.map(async ([slug, url]) => {
    const source = await readFile(new URL(`../content/${slug}.md`, import.meta.url), "utf8");
    return { ...parseCanonicalMarkdown(source), slug, url };
  })
);

test("real Developer-only architecture terminology is absent below Developer", () => {
  assert.equal(searchParsedDocuments(documents, "bcrp-roaming", "public").length, 0);
  assert.equal(searchParsedDocuments(documents, "bcrp-roaming", "moderator").length, 0);
  assert.equal(searchParsedDocuments(documents, "bcrp-roaming", "developer").length, 1);
  assert.equal(searchParsedDocuments(documents, "bcrp-roaming", "administrator").length, 1);
});

test("real Administrator-only Building Manager terminology is absent below Administrator", () => {
  for (const identity of ["public", "moderator", "developer"]) {
    const results = searchParsedDocuments(documents, "buildingmanager", identity);
    assert.equal(results.length, 0);
  }
  const results = searchParsedDocuments(documents, "buildingmanager", "administrator");
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, "building-manager");
});

test("real public taxi content groups into two canonical documents", () => {
  for (const identity of ["public", "moderator", "developer", "administrator"]) {
    const results = searchParsedDocuments(documents, "taxi", identity);
    assert.equal(results.length, 2);
    assert.deepEqual(
      new Set(results.map((result) => result.slug)),
      new Set(["getting-around", "mechanic-job"])
    );
  }
});

test("real public snippets do not leak restricted Building Manager identifiers", () => {
  const results = searchParsedDocuments(documents, "Property Finder", "public");
  assert.equal(results.length, 1);
  const serialized = JSON.stringify(results);
  assert.doesNotMatch(serialized, /bcrp\.propertytools|buildingmanager|Optimistic concurrency|ACE authorization/);
});
