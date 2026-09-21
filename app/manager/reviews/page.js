import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthControls } from "../../../components/AuthControls.js";
import { ReaderUtilityFooter } from "../../../components/ReaderUtilityFooter.js";
import { ReviewDashboard } from "../../../components/ReviewDashboard.js";
import { CAPABILITIES, hasCapability } from "../../../lib/capability-policy.js";
import { buildAuthorizedBrowse } from "../../../lib/browse.js";
import { getRequestAuthorization } from "../../../lib/request-authorization.js";
import { reviewService } from "../../../lib/review-operations.js";
import { resolveProjectionIdentity } from "../../../lib/view-as-policy.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review flags | Broken Compass Knowledge", robots: { index: false, follow: false } };

function browseDocuments(folders) {
  return folders.flatMap((folder) => [...folder.documents, ...browseDocuments(folder.children)]);
}

export default async function ReviewFlagsPage({ searchParams }) {
  const authorization = await getRequestAuthorization();
  if (!hasCapability(authorization.identity, CAPABILITIES.MANAGE_REVIEWS)) notFound();
  const params = await searchParams;
  const projection = resolveProjectionIdentity(authorization.identity, typeof params.viewAs === "string" ? params.viewAs : authorization.identity);
  const browse = await buildAuthorizedBrowse(projection);
  const documents = browseDocuments(browse.folders);
  const reviews = (await Promise.all(documents.map(async (document) => (await reviewService.list(document.slug, authorization.identity)).map((review) => ({ ...review, documentSlug: document.slug, documentTitle: document.title, documentUrl: document.url }))))).flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <main className="shell" id="page-top">
    <nav className="topbar" aria-label="Breadcrumb"><div className="topbar-breadcrumb"><Link href="/">Broken Compass knowledge</Link><span aria-hidden="true">/</span><Link href="/manager">Document Manager</Link><span aria-hidden="true">/</span><span>Review flags</span></div><div className="topbar-actions"><AuthControls authorization={authorization} /></div></nav>
    <ReviewDashboard initialReviews={reviews} />
    <ReaderUtilityFooter pageLabel="Review flags" identity={authorization.identity} projection={projection} returnTo="/manager/reviews" />
  </main>;
}
