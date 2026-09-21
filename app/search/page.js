import Link from "next/link";
import { AuthControls } from "../../components/AuthControls.js";
import { ReaderUtilityFooter } from "../../components/ReaderUtilityFooter.js";
import { getRequestAuthorization } from "../../lib/request-authorization.js";
import { searchKnowledge } from "../../lib/search.js";
import { resolveProjectionIdentity } from "../../lib/view-as-policy.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search | Broken Compass Knowledge",
  description: "Search the Broken Compass knowledge you are authorized to read."
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const authorization = await getRequestAuthorization();
  const identity = authorization.identity;
  const projection = resolveProjectionIdentity(identity, typeof params.viewAs === "string" ? params.viewAs : identity);
  const results = query ? await searchKnowledge(query, projection) : [];
  const returnTo = query ? `/search?q=${encodeURIComponent(query)}` : "/search";

  return (
    <main className="shell" id="page-top">
      <nav className="topbar" aria-label="Breadcrumb">
        <div className="topbar-breadcrumb"><Link href="/">Broken Compass knowledge</Link><span aria-hidden="true">/</span><span>Search</span></div>
        <div className="topbar-actions"><AuthControls authorization={authorization} /></div>
      </nav>

      <section className="search-surface">
        <p className="eyebrow">Authorized lexical search</p>
        <h1>Search the knowledge base</h1>
        <form className="search-form" action="/search" method="get" role="search">
          <label className="sr-only" htmlFor="query">Search documents</label>
          <input id="query" name="q" type="search" defaultValue={query} placeholder="Try taxi, configuration, or bcrp-roaming" autoFocus />
          <button type="submit">Search</button>
        </form>

        {query ? (
          <div className="search-summary" aria-live="polite">
            <strong>{results.length}</strong> {results.length === 1 ? "result" : "results"} for “{query}”
          </div>
        ) : (
          <p className="search-hint">Results are calculated only from sections available to the current identity.</p>
        )}

        <div className="results">
          {results.map((result) => (
            <article className="result-card" key={result.url}>
              <p className="result-path">{result.url}</p>
              <h2><Link href={result.url}>{result.title}</Link></h2>
              {result.heading ? <p className="result-heading">{result.heading}</p> : null}
              <p>{result.snippet}</p>
            </article>
          ))}
          {query && results.length === 0 ? (
            <div className="empty-state">
              <h2>No authorized results</h2>
              <p>No visible section matches this query.</p>
            </div>
          ) : null}
        </div>
      </section>
      <ReaderUtilityFooter pageLabel="Search" identity={identity} projection={projection} returnTo="/search" preserveQuery={query ? { q: query } : {}} />
    </main>
  );
}
