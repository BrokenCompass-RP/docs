import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { parseCanonicalMarkdown } from "../lib/access-markdown.js";
import { constructBrowse, findBrowseFolder } from "../lib/browse-model.js";
import { getDocumentDefinition } from "../lib/content-registry.js";
import { hasCapability, CAPABILITIES } from "../lib/capability-policy.js";
import { resolveProjectionIdentity } from "../lib/view-as-policy.js";

const folders = [
  { name: "Getting Started", segments: ["getting-started"] },
  { name: "Jobs", segments: ["getting-started", "jobs"] },
  { name: "Staff", segments: ["staff"] },
  { name: "Development", segments: ["development"] }
];

const definitions = [
  { slug: "welcome", url: "/docs/welcome", browsePath: ["getting-started"] },
  { slug: "jobs", url: "/docs/jobs", browsePath: ["getting-started", "jobs"] },
  { slug: "mixed", url: "/docs/mixed", browsePath: ["staff"] },
  { slug: "dev", url: "/docs/dev", browsePath: ["development"] },
  { slug: "admin", url: "/docs/admin", browsePath: ["development"] }
];

const sources = {
  welcome: `---\ntitle: Welcome\ndescription: Start here.\ndefault_visibility: public\n---\n## Welcome\nPublic introduction.`,
  jobs: `---\ntitle: Finding a Job\ndescription: Available work.\ndefault_visibility: public\n---\n## Jobs\nPublic job information.`,
  mixed: `---\ntitle: Staff Handbook\ndescription: Mixed staff guidance.\ndefault_visibility: moderator\n---\n## Moderator guidance\nModerator text.\n:::access visibility="developer"\n## Developer guidance\nDeveloper text.\n:::`,
  dev: `---\ntitle: Architecture\ndescription: Developer systems.\ndefault_visibility: developer\n---\n## Architecture\nDeveloper only.`,
  admin: `---\ntitle: Administration\ndescription: Administrator systems.\ndefault_visibility: administrator\n---\n## Administration\nAdministrator only.`
};

const loadDocument = async (slug) => ({ ...parseCanonicalMarkdown(sources[slug]), slug });
const build = async (identity) => {
  const authorized = [];
  for (const definition of definitions) {
    const document = await loadDocument(definition.slug);
    const { projectSections } = await import("../lib/access-markdown.js");
    if (projectSections(document, identity).length === 0) continue;
    authorized.push({
      slug: definition.slug,
      title: document.frontmatter.title,
      description: document.frontmatter.description,
      url: definition.url,
      browsePath: definition.browsePath
    });
  }
  return constructBrowse(identity, folders, authorized);
};
const serialize = (value) => JSON.stringify(value);

test("top-level and nested folders are discovered only from authorized documents", async () => {
  const browse = await build("public");
  assert.deepEqual(browse.folders.map((folder) => folder.name), ["Getting Started"]);
  const started = findBrowseFolder(browse, ["getting-started"]);
  assert.equal(started.documentCount, 2);
  assert.deepEqual(started.documents.map((document) => document.title), ["Welcome"]);
  assert.deepEqual(started.children.map((folder) => folder.name), ["Jobs"]);
  assert.equal(findBrowseFolder(browse, ["getting-started", "jobs"]).documents[0].title, "Finding a Job");
});

test("folder routes exist and unknown or unauthorized paths fail lookup", async () => {
  await access(new URL("../app/browse/[...segments]/page.js", import.meta.url));
  const browse = await build("public");
  assert.equal(findBrowseFolder(browse, ["getting-started"]).url, "/browse/getting-started");
  assert.equal(findBrowseFolder(browse, ["getting-started", "jobs"]).url, "/browse/getting-started/jobs");
  assert.equal(findBrowseFolder(browse, ["development"]), null);
});

test("mixed folders expose only authorized documents, counts, and previews", async () => {
  const moderator = await build("moderator");
  const staff = findBrowseFolder(moderator, ["staff"]);
  assert.equal(staff.documentCount, 1);
  assert.deepEqual(staff.preview, ["Staff Handbook"]);
  assert.doesNotMatch(serialize(moderator), /Architecture|Administration|Developer systems|Administrator systems/);

  const developer = await build("developer");
  assert.deepEqual(findBrowseFolder(developer, ["development"]).documents.map((document) => document.title), ["Architecture"]);
  assert.doesNotMatch(serialize(developer), /Administration|Administrator systems/);

  const administrator = await build("administrator");
  assert.deepEqual(findBrowseFolder(administrator, ["development"]).documents.map((document) => document.title), ["Administration", "Architecture"]);
});

test("lower View As projection reduces browse without changing capabilities", async () => {
  const actualIdentity = "administrator";
  const projection = resolveProjectionIdentity(actualIdentity, "public");
  const browse = await build(projection);
  assert.equal(findBrowseFolder(browse, ["development"]), null);
  assert.equal(hasCapability(actualIdentity, CAPABILITIES.ADMINISTER), true);
  assert.equal(resolveProjectionIdentity("developer", "administrator"), "developer");
});

test("browse placement does not alter stable document identity", async () => {
  const before = getDocumentDefinition("mechanic-job");
  assert.equal(before.id, "2c21fa3e-2b55-48a2-953e-117e504f0ad2");
  assert.equal(before.url, "/docs/mechanic-job");
  assert.deepEqual(before.browsePath, ["getting-started", "jobs"]);
  const migration = await readFile(new URL("../db/migrations/001_initial.sql", import.meta.url), "utf8");
  assert.match(migration, /document_id uuid NOT NULL REFERENCES documents/);
  assert.doesNotMatch(migration, /browsePath|browse_path/);
});
