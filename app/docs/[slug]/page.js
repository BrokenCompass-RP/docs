import Link from "next/link";
import { notFound } from "next/navigation";
import { FlagForReview } from "../../../components/FlagForReview.js";
import { AuthControls } from "../../../components/AuthControls.js";
import { KnowledgeNavigation } from "../../../components/KnowledgeNavigation.js";
import { ReaderUtilityFooter } from "../../../components/ReaderUtilityFooter.js";
import { CAPABILITIES, hasCapability } from "../../../lib/capability-policy.js";
import { buildAuthorizedBrowse } from "../../../lib/browse.js";
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
  const browse = await buildAuthorizedBrowse(projection);

  return (
    <main className="shell" id="page-top">
      <nav className="topbar" aria-label="Breadcrumb">
        <div className="topbar-breadcrumb"><Link href="/">Broken Compass knowledge</Link><span aria-hidden="true">/</span><span>{document.title}</span></div>
        <div className="topbar-actions">
          <Link href="/search">Search</Link>
          {hasCapability(identity, CAPABILITIES.MANAGE_DOCUMENTS) ? <Link href={`/manager?document=${slug}`}>Edit draft</Link> : null}
          <AuthControls authorization={authorization} />
        </div>
      </nav>
      <div className="reader-layout">
      <KnowledgeNavigation browse={browse} currentSlug={slug} identity={identity} projection={projection} />
      <article className="document">
        <header>
          <p className="eyebrow">Guide · {projection} view</p>
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
      </div>
      <ReaderUtilityFooter browse={browse} currentSlug={slug} identity={identity} projection={projection} returnTo={document.url} />
    </main>
  );
}
