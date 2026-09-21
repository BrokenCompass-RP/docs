import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("reader uses the authorized browse builder and retains a neutral guide label", async () => {
  const page = await readFile(new URL("../app/docs/[slug]/page.js", import.meta.url), "utf8");
  assert.match(page, /buildAuthorizedBrowse\(projection\)/);
  assert.match(page, /Guide · \{projection\} view/);
  assert.doesNotMatch(page, /Player guide/);
  assert.match(page, /<ReaderUtilityFooter/);
  assert.doesNotMatch(page, /<DevIdentitySwitcher|<ViewAsControl/);
});

test("homepage uses only the shared compact projection footer", async () => {
  const page = await readFile(new URL("../app/page.js", import.meta.url), "utf8");
  assert.match(page, /<ReaderUtilityFooter/);
  assert.doesNotMatch(page, /<DevIdentitySwitcher|<ViewAsControl/);
});

test("shared pages use the compact footer and do not render legacy projection panels", async () => {
  const paths = ["../app/page.js", "../app/search/page.js", "../app/browse/[...segments]/page.js"];
  for (const path of paths) {
    const page = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(page, /<ReaderUtilityFooter/);
    assert.doesNotMatch(page, /<DevIdentitySwitcher|<ViewAsControl/);
  }
});

test("homepage and reader both render account controls independently of projection", async () => {
  const home = await readFile(new URL("../app/page.js", import.meta.url), "utf8");
  const reader = await readFile(new URL("../app/docs/[slug]/page.js", import.meta.url), "utf8");
  assert.match(home, /<AuthControls authorization=\{authorization\}/);
  assert.match(reader, /<AuthControls authorization=\{authorization\}/);
  assert.doesNotMatch(home, /<AuthControls[^>]*projection/);
  assert.doesNotMatch(reader, /<AuthControls[^>]*projection/);
});

test("product shell headers keep breadcrumbs and account controls in one aligned row", async () => {
  const paths = [
    "../app/page.js",
    "../app/search/page.js",
    "../app/docs/[slug]/page.js",
    "../app/guides/building-manager/page.js",
    "../app/browse/[...segments]/page.js",
    "../app/manager/reviews/page.js"
  ];
  for (const path of paths) {
    const page = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(page, /className="topbar"/);
    assert.match(page, /className="topbar-breadcrumb"/);
    assert.match(page, /className="topbar-actions"/);
    assert.match(page, /<AuthControls authorization=\{authorization\}/);
  }

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.topbar\s*\{[^}]*align-items:\s*center[^}]*width:\s*100%/s);
  assert.match(css, /\.topbar-actions\s*\{[^}]*align-items:\s*center[^}]*margin-left:\s*auto/s);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.topbar\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.topbar-actions\s*\{[^}]*width:\s*100%/);
});

test("every document reader route renders the authorized knowledge tree for its current slug", async () => {
  const standardReader = await readFile(new URL("../app/docs/[slug]/page.js", import.meta.url), "utf8");
  const buildingManagerReader = await readFile(new URL("../app/guides/building-manager/page.js", import.meta.url), "utf8");
  for (const reader of [standardReader, buildingManagerReader]) {
    assert.match(reader, /buildAuthorizedBrowse\(projection\)/);
    assert.match(reader, /<KnowledgeNavigation browse=\{browse\}/);
    assert.match(reader, /className="reader-layout"/);
  }
  assert.match(standardReader, /currentSlug=\{slug\}/);
  assert.match(buildingManagerReader, /currentSlug="building-manager"/);
  assert.match(buildingManagerReader, /<nav className="topbar" aria-label="Breadcrumb">[\s\S]*<Link href="\/">Broken Compass knowledge<\/Link>[\s\S]*<span>Building Manager<\/span>/);
});

test("tree folders remain independently expandable while selection follows only the current document", async () => {
  const navigation = await readFile(new URL("../components/KnowledgeNavigation.js", import.meta.url), "utf8");
  assert.match(navigation, /<details open=\{isCurrentBranch\}>/);
  assert.match(navigation, /aria-current=\{document\.slug === currentSlug \? "page" : undefined\}/);
  assert.match(navigation, /folder\.children\.map/);
});

test("reader keeps the restored top breadcrumb and authorized taxonomy footer", async () => {
  const reader = await readFile(new URL("../app/docs/[slug]/page.js", import.meta.url), "utf8");
  const footer = await readFile(new URL("../components/ReaderUtilityFooter.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(reader, /<main className="shell" id="page-top">/);
  assert.match(reader, /<nav className="topbar" aria-label="Breadcrumb">[\s\S]*<Link href="\/">Broken Compass knowledge<\/Link>[\s\S]*<span>\{document\.title\}<\/span>/);
  assert.match(footer, /findBrowseDocumentPath\(browse, currentSlug\)/);
  assert.match(footer, /href="#page-top"/);
  assert.match(footer, /hasCapability\(identity, CAPABILITIES\.MANAGE_DOCUMENTS\)/);
  assert.match(footer, /availableViewAs\(identity\)/);
  assert.doesNotMatch(footer, /DEVELOPMENT ONLY|Authorized view/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.reader-utility-footer[^}]*flex-direction:\s*column/);
});

test("reader styles constrain long preformatted content and collapse navigation on narrow screens", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const navigation = await readFile(new URL("../components/KnowledgeNavigation.js", import.meta.url), "utf8");
  assert.match(css, /\.markdown pre[^}]*max-width:\s*100%[^}]*white-space:\s*pre-wrap[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.markdown pre code[^}]*white-space:\s*inherit/s);
  assert.match(css, /\.knowledge-navigation-toggle\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.knowledge-navigation-panel\s*\{[^}]*display:\s*block/);
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*\.knowledge-navigation-toggle\s*\{[^}]*display:\s*block/);
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*\.knowledge-navigation-panel\s*\{[^}]*display:\s*none/);
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*\.knowledge-navigation-panel\.mobile-open\s*\{[^}]*display:\s*block/);
  assert.match(navigation, /aria-expanded=\{mobileOpen\}/);
  assert.match(navigation, /mobileOpen \? "knowledge-navigation-panel mobile-open"/);
});
