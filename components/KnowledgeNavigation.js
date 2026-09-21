"use client";

import Link from "next/link";
import { useState } from "react";

function withProjection(url, projection, identity) {
  if (projection === identity) return url;
  return `${url}?viewAs=${encodeURIComponent(projection)}`;
}

function containsDocument(folder, currentSlug) {
  return folder.documents.some((document) => document.slug === currentSlug)
    || folder.children.some((child) => containsDocument(child, currentSlug));
}

function Folder({ folder, currentSlug, projection, identity }) {
  const isCurrentBranch = containsDocument(folder, currentSlug);

  return <li className="knowledge-tree-folder">
    <details open={isCurrentBranch}>
      <summary>{folder.name}</summary>
      <div className="knowledge-tree-branch">
        {folder.documents.map((document) => <Link
          aria-current={document.slug === currentSlug ? "page" : undefined}
          className={document.slug === currentSlug ? "knowledge-tree-document selected" : "knowledge-tree-document"}
          href={withProjection(document.url, projection, identity)}
          key={document.slug}
        >{document.title}</Link>)}
        {folder.children.length > 0 ? <ul>
          {folder.children.map((child) => <Folder
            currentSlug={currentSlug}
            folder={child}
            identity={identity}
            key={child.url}
            projection={projection}
          />)}
        </ul> : null}
      </div>
    </details>
  </li>;
}

export function KnowledgeNavigation({ browse, currentSlug, projection, identity }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return <aside className="knowledge-navigation" aria-label="Knowledge navigation">
    <button
      aria-controls="knowledge-navigation-panel"
      aria-expanded={mobileOpen}
      className="knowledge-navigation-toggle"
      onClick={() => setMobileOpen((open) => !open)}
      type="button"
    >Browse guides</button>
    <div className={mobileOpen ? "knowledge-navigation-panel mobile-open" : "knowledge-navigation-panel"} id="knowledge-navigation-panel">
      <nav aria-label="Available knowledge">
        <p>Broken Compass knowledge</p>
        <ul className="knowledge-tree">
          {browse.folders.map((folder) => <Folder
            currentSlug={currentSlug}
            folder={folder}
            identity={identity}
            key={folder.url}
            projection={projection}
          />)}
        </ul>
      </nav>
    </div>
  </aside>;
}
