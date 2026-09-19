import Link from "next/link";
import { notFound } from "next/navigation";
import { DevIdentitySwitcher } from "../../../components/DevIdentitySwitcher.js";
import { ViewAsControl } from "../../../components/ViewAsControl.js";
import { FlagForReview } from "../../../components/FlagForReview.js";
import { AuthControls } from "../../../components/AuthControls.js";
import { CAPABILITIES, hasCapability } from "../../../lib/capability-policy.js";
import { getRequestAuthorization } from "../../../lib/request-authorization.js";
import { loadProjectedDocument } from "../../../lib/knowledge.js";
import { resolveProjectionIdentity } from "../../../lib/view-as-policy.js";

export const dynamic = "force-dynamic";

export default async function KnowledgeDocumentPage({ params, searchParams }) {
  const { slug } = await params;
  const authorization = await getRequestAuthorization();
  const identity = authorization.identity;
  const query = await searchParams;
  const projection = resolveProjectionIdentity(identity, typeof query.viewAs === "string" ? query.viewAs : identity);
  let document;
  try {
    document = await loadProjectedDocument(slug, projection);
  } catch {
    notFound();
  }

  if (!document.html.trim()) notFound();

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Breadcrumb">
        <Link href="/">Broken Compass knowledge</Link>
        <span aria-hidden="true">/</span>
        <span>{document.title}</span>
        <Link className="nav-action" href="/search">Search</Link>
        {hasCapability(identity, CAPABILITIES.MANAGE_DOCUMENTS) ? <Link href={`/manager?document=${slug}`}>Edit draft</Link> : null}
      </nav>
      <DevIdentitySwitcher identity={identity} returnTo={document.url} />
      <AuthControls authorization={authorization} />
      <article className="document">
        <header>
          <p className="eyebrow">Canonical guide · {projection} projection</p>
          <h1>{document.title}</h1>
          <p className="lede">{document.description}</p>
        </header>
        {document.sections.map((section) => <section className="document-section" id={section.sectionId} key={section.sectionId}>
          <div className="markdown" dangerouslySetInnerHTML={{ __html: section.html }} />
          <FlagForReview documentId={slug} sectionId={section.sectionId} sectionHeading={section.heading} />
        </section>)}
        <footer className="publication-meta">First published {document.version.firstPublished ? new Date(document.version.firstPublished).toLocaleDateString() : "Unknown"} · Last updated {new Date(document.version.publishedAt).toLocaleDateString()} · {document.version.versionId}</footer>
        <FlagForReview documentId={slug} />
      </article>
      <ViewAsControl identity={identity} projection={projection} returnTo={document.url} />
    </main>
  );
}
