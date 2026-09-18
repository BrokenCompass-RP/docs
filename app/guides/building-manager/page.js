import Link from "next/link";
import { DevIdentitySwitcher } from "../../../components/DevIdentitySwitcher.js";
import { ViewAsControl } from "../../../components/ViewAsControl.js";
import { FlagForReview } from "../../../components/FlagForReview.js";
import { CAPABILITIES, hasCapability } from "../../../lib/capability-policy.js";
import { getDevelopmentIdentity } from "../../../lib/dev-identity.js";
import { loadProjectedDocument } from "../../../lib/knowledge.js";
import { resolveProjectionIdentity } from "../../../lib/view-as-policy.js";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  // Metadata is intentionally projection-independent and contains no restricted text.
  return {
    title: "Building Manager guide | Broken Compass Knowledge",
    description: "Current public information about the Broken Compass Building Manager."
  };
}

export default async function BuildingManagerPage({ searchParams }) {
  const identity = await getDevelopmentIdentity();
  const params = await searchParams;
  const projection = resolveProjectionIdentity(identity, typeof params.viewAs === "string" ? params.viewAs : identity);
  const document = await loadProjectedDocument("building-manager", projection);

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Breadcrumb">
        <Link href="/">Broken Compass knowledge</Link>
        <span aria-hidden="true">/</span>
        <span>Building Manager</span>
        <Link className="nav-action" href="/search">Search</Link>
        {hasCapability(identity, CAPABILITIES.MANAGE_DOCUMENTS) ? <Link href="/manager?document=building-manager">Edit draft</Link> : null}
      </nav>

      <DevIdentitySwitcher identity={identity} returnTo="/guides/building-manager" />

      <article className="document">
        <header>
          <p className="eyebrow">Canonical guide · {projection} projection</p>
          <h1>{document.title}</h1>
          <p className="lede">{document.description}</p>
        </header>
        {document.sections.map((section) => <section className="document-section" id={section.sectionId} key={section.sectionId}>
          <div className="markdown" dangerouslySetInnerHTML={{ __html: section.html }} />
          <FlagForReview documentId="building-manager" sectionId={section.sectionId} sectionHeading={section.heading} />
        </section>)}
        <footer className="publication-meta">First published {new Date(document.version.firstPublished).toLocaleDateString()} · Last updated {new Date(document.version.publishedAt).toLocaleDateString()} · {document.version.versionId}</footer>
        <FlagForReview documentId="building-manager" />
      </article>
      <ViewAsControl identity={identity} projection={projection} returnTo="/guides/building-manager" />
    </main>
  );
}
