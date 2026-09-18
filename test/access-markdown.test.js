import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseCanonicalMarkdown,
  renderProjection
} from "../lib/access-markdown.js";

const source = await readFile(new URL("../content/building-manager.md", import.meta.url), "utf8");
const canonical = parseCanonicalMarkdown(source);

const markers = {
  public: "Property Finder",
  developer: "restart bcrp-propertytools",
  administrator: "Creating an office"
};

const expected = {
  public: ["public"],
  moderator: ["public"],
  developer: ["public", "developer"],
  administrator: ["public", "developer", "administrator"]
};

for (const [identity, grants] of Object.entries(expected)) {
  test(`${identity} receives exactly its cumulative projection`, () => {
    const html = renderProjection(canonical, identity);
    for (const [visibility, marker] of Object.entries(markers)) {
      assert.equal(
        html.includes(marker),
        grants.includes(visibility),
        `${visibility} marker had the wrong visibility for ${identity}`
      );
    }
    assert.doesNotMatch(html, /:::access|default_visibility/);
  });
}

test("restricted text is absent from the public response body", () => {
  const html = renderProjection(canonical, "public");
  assert.doesNotMatch(html, /bcrp\.propertytools/);
  assert.doesNotMatch(html, /Optimistic concurrency/);
  assert.doesNotMatch(html, /Audit History/);
  assert.doesNotMatch(html, /\/buildingmanager/);
});

test("administrator text is absent from the developer response body", () => {
  const html = renderProjection(canonical, "developer");
  assert.doesNotMatch(html, /Create Building/);
  assert.doesNotMatch(html, /ACE authorization check/);
  assert.doesNotMatch(html, /Archive Office/);
});

test("unknown, malformed, nested, and unclosed directives fail closed", () => {
  const frontmatter = "---\ntitle: Test\ndefault_visibility: public\n---\n";
  assert.throws(() => parseCanonicalMarkdown(`${frontmatter}:::access visibility="guest"\nsecret\n:::`), /Unknown visibility/);
  assert.throws(() => parseCanonicalMarkdown(`${frontmatter}:::access visibility=\"developer\" extra\nsecret\n:::`), /Malformed/);
  assert.throws(() => parseCanonicalMarkdown(`${frontmatter}:::access visibility="developer"\n:::access visibility="administrator"\nsecret\n:::\n:::`), /Nested/);
  assert.throws(() => parseCanonicalMarkdown(`${frontmatter}:::access visibility="developer"\nsecret`), /Unclosed/);
});

test("unknown identities fail closed", () => {
  assert.throws(() => renderProjection(canonical, "owner"), /Invalid identity/);
});

test("named grants still provide cumulative moderator visibility", () => {
  const fixture = parseCanonicalMarkdown(`---
title: Explicit authorization test fixture
default_visibility: public
---
Public marker
:::access visibility="moderator"
Moderator marker
:::
:::access visibility="developer"
Developer marker
:::
:::access visibility="administrator"
Administrator marker
:::`);
  assert.doesNotMatch(renderProjection(fixture, "public"), /Moderator marker/);
  assert.match(renderProjection(fixture, "moderator"), /Moderator marker/);
  assert.match(renderProjection(fixture, "developer"), /Moderator marker/);
  assert.match(renderProjection(fixture, "administrator"), /Moderator marker/);
});
