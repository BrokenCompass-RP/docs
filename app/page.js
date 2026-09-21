import Link from "next/link";
import { AuthControls } from "../components/AuthControls.js";
import { ReaderUtilityFooter } from "../components/ReaderUtilityFooter.js";
import { buildAuthorizedBrowse } from "../lib/browse.js";
import { getRequestAuthorization } from "../lib/request-authorization.js";
import { resolveProjectionIdentity } from "../lib/view-as-policy.js";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const authorization = await getRequestAuthorization();
  const query = await searchParams;
  const projection = resolveProjectionIdentity(authorization.identity, typeof query.viewAs === "string" ? query.viewAs : authorization.identity);
  const browse = await buildAuthorizedBrowse(projection);
  return (
    <main className="shell landing" id="page-top">
      <header className="topbar">
        <div className="topbar-breadcrumb"><p className="eyebrow">Broken Compass knowledge</p></div>
        <div className="topbar-actions"><AuthControls authorization={authorization} /></div>
      </header>
      <section className="home-hero"><h1>Find your way.</h1><p className="lede">Search for what you need, or browse the knowledge base.</p><Link className="primary-link" href="/search">Search knowledge</Link></section>
      <section className="browse-home" aria-labelledby="browse-heading">
        <div><p className="eyebrow">Explore</p><h2 id="browse-heading">Browse knowledge</h2></div>
        <div className="browse-grid">{browse.folders.map((folder) => <Link className="browse-card" href={folder.url} key={folder.url}><h3>{folder.name}</h3><p>{folder.preview.join(" · ")}</p><small>{folder.documentCount} {folder.documentCount === 1 ? "document" : "documents"}</small></Link>)}</div>
      </section>
      <ReaderUtilityFooter pageLabel="Browse Knowledge" identity={authorization.identity} projection={projection} returnTo="/" />
    </main>
  );
}
