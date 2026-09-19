import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthControls } from "../../../components/AuthControls.js";
import { DevIdentitySwitcher } from "../../../components/DevIdentitySwitcher.js";
import { ViewAsControl } from "../../../components/ViewAsControl.js";
import { buildAuthorizedBrowse, findBrowseFolder } from "../../../lib/browse.js";
import { getRequestAuthorization } from "../../../lib/request-authorization.js";
import { resolveProjectionIdentity } from "../../../lib/view-as-policy.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse knowledge | Broken Compass Knowledge", robots: { index: false, follow: false } };

export default async function BrowseFolderPage({ params, searchParams }) {
  const { segments } = await params;
  const authorization = await getRequestAuthorization();
  const query = await searchParams;
  const projection = resolveProjectionIdentity(authorization.identity, typeof query.viewAs === "string" ? query.viewAs : authorization.identity);
  const browse = await buildAuthorizedBrowse(projection);
  const folder = findBrowseFolder(browse, segments);
  if (!folder) notFound();
  const returnTo = folder.url;

  return <main className="shell">
    <nav className="topbar" aria-label="Breadcrumb">
      <Link href="/">Knowledge</Link>
      {folder.segments.map((segment, index) => {
        const match = findBrowseFolder(browse, folder.segments.slice(0, index + 1));
        return <span key={segment}><span aria-hidden="true"> / </span>{index === folder.segments.length - 1 ? match.name : <Link href={match.url}>{match.name}</Link>}</span>;
      })}
      <Link className="nav-action" href="/search">Search</Link>
    </nav>
    <DevIdentitySwitcher identity={authorization.identity} returnTo={returnTo} />
    <AuthControls authorization={authorization} />
    <header className="browse-header"><p className="eyebrow">Browse knowledge</p><h1>{folder.name}</h1></header>
    {folder.children.length > 0 ? <section aria-labelledby="folders-heading"><h2 id="folders-heading">Folders</h2><div className="browse-grid">{folder.children.map((child) => <Link className="browse-card" href={child.url} key={child.url}><h3>{child.name}</h3><p>{child.preview.join(" · ")}</p><small>{child.documentCount} {child.documentCount === 1 ? "document" : "documents"}</small></Link>)}</div></section> : null}
    {folder.documents.length > 0 ? <section aria-labelledby="documents-heading"><h2 id="documents-heading">Documents</h2><div className="browse-documents">{folder.documents.map((document) => <article key={document.slug}><h3><Link href={document.url}>{document.title}</Link></h3><p>{document.description}</p></article>)}</div></section> : null}
    <ViewAsControl identity={authorization.identity} projection={projection} returnTo={returnTo} />
  </main>;
}
