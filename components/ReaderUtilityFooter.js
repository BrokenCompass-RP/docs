"use client";

import Link from "next/link";
import { CAPABILITIES, hasCapability } from "../lib/capability-policy.js";
import { findBrowseDocumentPath } from "../lib/browse-model.js";
import { availableViewAs } from "../lib/view-as-policy.js";

const LABELS = { public: "Public", moderator: "Moderator", developer: "Developer", administrator: "Administrator" };

function withProjection(url, projection, identity) {
  if (projection === identity) return url;
  return `${url}?viewAs=${encodeURIComponent(projection)}`;
}

export function ReaderUtilityFooter({ browse, currentSlug, pageLabel, identity, projection, returnTo, preserveQuery = {}, showBackToTop = true }) {
  const location = browse && currentSlug ? findBrowseDocumentPath(browse, currentSlug) : null;
  const canPreview = hasCapability(identity, CAPABILITIES.MANAGE_DOCUMENTS);
  const options = canPreview ? availableViewAs(identity) : [];

  return <footer className="reader-utility-footer">
    <nav className="reader-path" aria-label="Knowledge path">
      <Link href={withProjection("/", projection, identity)}>Broken Compass Knowledge</Link>
      {location?.folders.map((folder) => <span key={folder.url}>
        <span aria-hidden="true"> / </span>
        <Link href={withProjection(folder.url, projection, identity)}>{folder.name}</Link>
      </span>)}
      {location ? <span><span aria-hidden="true"> / </span><span aria-current="page">{location.document.title}</span></span> : null}
      {!location && pageLabel ? <span><span aria-hidden="true"> / </span><span aria-current="page">{pageLabel}</span></span> : null}
    </nav>
    {showBackToTop ? <a className="back-to-top" href="#page-top">↑ Back to top</a> : null}
    {options.length > 1 ? <form className="reader-preview-control" action={returnTo} method="get">
      {Object.entries(preserveQuery).map(([name, value]) => <input name={name} type="hidden" value={value} key={name} />)}
      <label htmlFor="reader-view-as">Preview as</label>
      <select id="reader-view-as" name="viewAs" defaultValue={projection}>
        {options.map((value) => <option value={value} key={value}>{LABELS[value]}</option>)}
      </select>
      <button type="submit">Switch</button>
    </form> : null}
  </footer>;
}
