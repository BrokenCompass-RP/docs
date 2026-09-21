import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BROWSE_TAXONOMY } from "../lib/browse-taxonomy.js";
import { ancestorFolderKeys, constructManagerTree } from "../lib/manager-tree.js";
import { CAPABILITIES, hasCapability } from "../lib/capability-policy.js";

const documents = [
  { slug: "around", title: "Getting Around", browsePath: ["getting-started"] },
  { slug: "mechanic", title: "Mechanic Job", browsePath: ["getting-started", "jobs"] },
  { slug: "architecture", title: "Architecture Guide", browsePath: ["development"] }
];

test("manager tree preserves canonical nesting and empty authoring destinations", () => {
  const tree = constructManagerTree(BROWSE_TAXONOMY, documents);
  const gettingStarted = tree.find((folder) => folder.key === "getting-started");
  assert.deepEqual(gettingStarted.documents.map((document) => document.slug), ["around"]);
  assert.deepEqual(gettingStarted.children[0].segments, ["getting-started", "jobs"]);
  assert.equal(gettingStarted.children[0].documents[0].slug, "mechanic");
  assert.ok(tree.some((folder) => folder.key === "city-services" && !folder.hasMatches));
  assert.ok(tree.some((folder) => folder.key === "staff" && !folder.hasMatches));
});

test("manager filtering reveals matches in their taxonomy context", () => {
  const tree = constructManagerTree(BROWSE_TAXONOMY, documents, "mechanic");
  assert.deepEqual(tree.map((folder) => folder.key), ["getting-started"]);
  assert.deepEqual(tree[0].children.map((folder) => folder.key), ["getting-started/jobs"]);
  assert.deepEqual(tree[0].children[0].documents.map((document) => document.slug), ["mechanic"]);
});

test("selected-document ancestors can be expanded without broadening capability", () => {
  assert.deepEqual(ancestorFolderKeys(["getting-started", "jobs"]), ["getting-started", "getting-started/jobs"]);
  assert.equal(hasCapability("public", CAPABILITIES.MANAGE_DOCUMENTS), false);
  assert.equal(hasCapability("moderator", CAPABILITIES.MANAGE_DOCUMENTS), false);
  assert.equal(hasCapability("developer", CAPABILITIES.MANAGE_DOCUMENTS), true);
  assert.equal(hasCapability("administrator", CAPABILITIES.MANAGE_DOCUMENTS), true);
});

test("new-document mode exclusively replaces the editor and authenticated admin navigation remains capability-gated", async () => {
  const manager = await readFile(new URL("../components/DocumentManager.js", import.meta.url), "utf8");
  const auth = await readFile(new URL("../components/AuthControls.js", import.meta.url), "utf8");
  const accountNavigation = await readFile(new URL("../lib/account-navigation.js", import.meta.url), "utf8");
  assert.match(manager, /showNewDocument \? <form[\s\S]*?<\/form> : <>/);
  assert.match(manager, /!showNewDocument && item\.slug === selectedSlug/);
  assert.match(manager, /window\.location\.assign\(`\/manager\?document=\$\{payload\.document\.slug\}`\)/);
  assert.match(auth, /accountNavigationState\(authorization\)/);
  assert.doesNotMatch(auth, /projection/);
  assert.match(accountNavigation, /authorization\.source === "discord"/);
  assert.match(accountNavigation, /hasCapability\(authorization\.identity, CAPABILITIES\.MANAGE_DOCUMENTS\)/);
  assert.doesNotMatch(accountNavigation, /projection/);
});

test("document manager links to the aggregate review dashboard and keeps the shared footer", async () => {
  const manager = await readFile(new URL("../components/DocumentManager.js", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/manager/page.js", import.meta.url), "utf8");
  assert.match(manager, /href="\/manager\/reviews">Review flags/);
  assert.match(manager, /<ReaderUtilityFooter[^>]*pageLabel="Document Manager"/);
  assert.match(manager, /preserveQuery=\{\{ document: selectedSlug \}\}/);
  assert.match(page, /resolveProjectionIdentity\(identity/);
  assert.match(page, /projection=\{projection\}/);
  assert.match(page, /authorization=\{authorization\}/);
  assert.match(manager, /className="manager-header-inner"[\s\S]*className="topbar-breadcrumb"[\s\S]*className="topbar-actions"/);
  assert.match(manager, /<AuthControls authorization=\{authorization\}/);
});

test("manager header aligns to the existing workspace content edges and stacks at narrow width", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.manager-header-inner\s*\{[^}]*width:\s*calc\(100% - 250px\)[^}]*margin-left:\s*250px[^}]*padding:\s*0 clamp\(24px, 4vw, 52px\)/s);
  assert.match(css, /\.manager-workspace\s*\{[^}]*padding:\s*clamp\(24px, 4vw, 52px\)/s);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.manager-header-inner\s*\{[^}]*width:\s*100%[^}]*margin-left:\s*0[^}]*padding:\s*14px/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.manager-workspace\s*\{[^}]*padding:\s*22px 14px/);
});

test("aggregate review dashboard authorizes first and loads flags only for projected browse documents", async () => {
  const page = await readFile(new URL("../app/manager/reviews/page.js", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../components/ReviewDashboard.js", import.meta.url), "utf8");
  assert.match(page, /hasCapability\(authorization\.identity, CAPABILITIES\.MANAGE_REVIEWS\)/);
  assert.match(page, /const browse = await buildAuthorizedBrowse\(projection\);/);
  assert.match(page, /const documents = browseDocuments\(browse\.folders\);/);
  assert.ok(page.indexOf("buildAuthorizedBrowse(projection)") < page.indexOf("reviewService.list(document.slug"));
  assert.match(page, /<ReviewDashboard initialReviews=\{reviews\}/);
  assert.match(dashboard, /useState\("open"\)/);
  assert.match(dashboard, />Open<\/button>/);
  assert.match(dashboard, />Resolved<\/button>/);
  assert.match(dashboard, /comments\`, \{ method: "POST"/);
  assert.match(dashboard, /resolve\`, \{ method: "POST"/);
});
