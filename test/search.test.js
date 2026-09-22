import test from "node:test";
import assert from "node:assert/strict";
import { parseCanonicalMarkdown } from "../lib/access-markdown.js";
import { searchParsedDocuments } from "../lib/search-engine.js";

function fixture(slug, source) {
  return { ...parseCanonicalMarkdown(source), slug, url: `/test/${slug}` };
}

const authorizationFixture = fixture("authorization", `---
title: Authorization test fixture
description: Synthetic test content only.
default_visibility: public
---
## Public operations
The shared rankingword appears once for public readers.

:::access visibility="moderator"
## Moderator ledger
The modonlytoken is available to moderators.
:::

:::access visibility="developer"
## Internal rankingword rankingword rankingword
The devonlytoken identifies the protected resource bcrp-secret-resource.
:::

:::access visibility="administrator"
## Administrative controls
The adminonlytoken can archive protected records.
:::`);

test("restricted-only terms affect only authorized result sets and counts", () => {
  for (const identity of ["public", "moderator"]) {
    assert.deepEqual(searchParsedDocuments([authorizationFixture], "devonlytoken", identity), []);
  }
  for (const identity of ["developer", "administrator"]) {
    const results = searchParsedDocuments([authorizationFixture], "devonlytoken", identity);
    assert.equal(results.length, 1);
    assert.match(results[0].snippet, /devonlytoken/);
  }
});

test("a public-default document with no public sections is absent from public search", () => {
  const hidden = fixture("hidden", `---
title: Hidden operations
description: Confidential location
default_visibility: public
---
:::access visibility="developer"
## Internal procedure
The restrictedbodytoken is here.
:::`);
  for (const query of ["Hidden operations", "Confidential location", "restrictedbodytoken"]) {
    assert.deepEqual(searchParsedDocuments([hidden], query, "public"), []);
  }
  for (const query of ["Hidden operations", "restrictedbodytoken"]) {
    assert.equal(searchParsedDocuments([hidden], query, "developer").length, 1);
  }
});

test("administrator-only terms are invisible below Administrator", () => {
  for (const identity of ["public", "moderator", "developer"]) {
    assert.equal(searchParsedDocuments([authorizationFixture], "adminonlytoken", identity).length, 0);
  }
  assert.equal(searchParsedDocuments([authorizationFixture], "adminonlytoken", "administrator").length, 1);
});

test("moderator remains a cumulative supported grant", () => {
  assert.equal(searchParsedDocuments([authorizationFixture], "modonlytoken", "public").length, 0);
  for (const identity of ["moderator", "developer", "administrator"]) {
    assert.equal(searchParsedDocuments([authorizationFixture], "modonlytoken", identity).length, 1);
  }
});

test("restricted ranking signals contribute zero before authorization", () => {
  const publicResult = searchParsedDocuments([authorizationFixture], "rankingword", "public")[0];
  const developerResult = searchParsedDocuments([authorizationFixture], "rankingword", "developer")[0];
  assert.equal(publicResult.score, 101);
  assert.equal(developerResult.score, 203);
  assert.equal(publicResult.heading, "");
  assert.equal(developerResult.heading, "Internal rankingword rankingword rankingword");
});

test("snippets are made only from authorized retrieval units", () => {
  const result = searchParsedDocuments([authorizationFixture], "rankingword", "public")[0];
  assert.match(result.snippet, /shared rankingword/);
  assert.doesNotMatch(result.snippet, /Internal|bcrp-secret-resource|devonlytoken/);
});

test("multiple matching sections group into one canonical result", () => {
  const grouped = fixture("grouped", `---
title: Grouping fixture
description: Synthetic test content only.
default_visibility: public
---
## First compass section
Compass appears here.
## Second compass section
Compass appears here too.`);
  const results = searchParsedDocuments([grouped], "compass", "public");
  assert.equal(results.length, 1);
  assert.equal(results[0].url, "/test/grouped");
});

test("title matches outrank heading matches, which outrank body matches", () => {
  const documents = [
    fixture("title", `---\ntitle: Beacon\ndescription: Test.\ndefault_visibility: public\n---\n## Other\nText.`),
    fixture("heading", `---\ntitle: Other heading\ndescription: Test.\ndefault_visibility: public\n---\n## Beacon\nText.`),
    fixture("body", `---\ntitle: Other body\ndescription: Test.\ndefault_visibility: public\n---\n## Other\nA beacon appears here.`)
  ];
  const results = searchParsedDocuments(documents, "beacon", "public");
  assert.deepEqual(results.map((result) => result.slug), ["title", "heading", "body"]);
  assert.ok(results[0].score > results[1].score);
  assert.ok(results[1].score > results[2].score);
});

test("invalid authorization markup never enters search", () => {
  assert.throws(
    () => fixture("invalid", `---\ntitle: Invalid\ndescription: Test.\ndefault_visibility: public\n---\n:::access visibility="unknown"\nsecret\n:::`),
    /Unknown visibility/
  );
});
