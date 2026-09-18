import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCanonicalMarkdown, renderProjection } from "../lib/access-markdown.js";
import { serializeEditableDocument, toEditableDocument } from "../lib/authoring-markdown.js";

const buildingSource = await readFile(new URL("../content/building-manager.md", import.meta.url), "utf8");

test("manager round-trips canonical Markdown through the authoritative parser", () => {
  const editable = toEditableDocument(buildingSource);
  const generated = serializeEditableDocument(editable);
  const parsed = parseCanonicalMarkdown(generated);
  assert.equal(parsed.frontmatter.title, editable.title);
  assert.equal(parsed.frontmatter.default_visibility, "public");
  assert.match(generated, /:::access visibility="developer"/);
  assert.match(generated, /:::access visibility="administrator"/);
});

test("applying Developer and Administrator visibility produces bounded Markdown", () => {
  const generated = serializeEditableDocument({
    title: "Authoring fixture",
    description: "Synthetic authoring test.",
    defaultVisibility: "public",
    sections: [
      { visibility: "public", markdown: "## Public\n\nPublic text." },
      { visibility: "developer", markdown: "## Developer\n\nDeveloper text." },
      { visibility: "administrator", markdown: "## Administrator\n\nAdministrator text." }
    ]
  });
  assert.match(generated, /:::access visibility="developer"\n## Developer[\s\S]*?\n:::/);
  assert.match(generated, /:::access visibility="administrator"\n## Administrator[\s\S]*?\n:::/);
  assert.doesNotMatch(generated, /:::access visibility="public"/);
  assert.doesNotThrow(() => parseCanonicalMarkdown(generated));
});

test("normal manager sections cannot create nested or manual directives", () => {
  assert.throws(() => serializeEditableDocument({
    title: "Unsafe fixture",
    description: "Synthetic authoring test.",
    defaultVisibility: "public",
    sections: [{ visibility: "developer", markdown: ":::access visibility=\"administrator\"\nSecret\n:::" }]
  }), /reserved access-directive syntax/);
});

test("projection preview uses existing cumulative authorization semantics", () => {
  const source = serializeEditableDocument({
    title: "Preview fixture",
    description: "Synthetic preview test.",
    defaultVisibility: "public",
    sections: [
      { visibility: "public", markdown: "## Public\n\nPUBLIC-MARKER" },
      { visibility: "moderator", markdown: "## Moderator\n\nMODERATOR-MARKER" },
      { visibility: "developer", markdown: "## Developer\n\nDEVELOPER-MARKER" },
      { visibility: "administrator", markdown: "## Administrator\n\nADMIN-MARKER" }
    ]
  });
  const canonical = parseCanonicalMarkdown(source);
  const expectations = {
    public: ["PUBLIC-MARKER"],
    moderator: ["PUBLIC-MARKER", "MODERATOR-MARKER"],
    developer: ["PUBLIC-MARKER", "MODERATOR-MARKER", "DEVELOPER-MARKER"],
    administrator: ["PUBLIC-MARKER", "MODERATOR-MARKER", "DEVELOPER-MARKER", "ADMIN-MARKER"]
  };
  for (const [identity, visible] of Object.entries(expectations)) {
    const html = renderProjection(canonical, identity);
    for (const marker of ["PUBLIC-MARKER", "MODERATOR-MARKER", "DEVELOPER-MARKER", "ADMIN-MARKER"]) {
      assert.equal(html.includes(marker), visible.includes(marker));
    }
  }
});
