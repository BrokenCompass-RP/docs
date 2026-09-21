import { notFound } from "next/navigation";
import { DocumentManager } from "../../components/DocumentManager.js";
import { toEditableDocument } from "../../lib/authoring-markdown.js";
import { draftRepository } from "../../lib/drafts.js";
import { listDocuments, loadCanonicalDocument, loadCanonicalSource, loadPublishedVersion } from "../../lib/knowledge.js";
import { getManagerIdentity } from "../../lib/manager-access.js";
import { versionRepository } from "../../lib/versions.js";
import { reviewService } from "../../lib/review-operations.js";
import { discoverBrowseFolders } from "../../lib/browse.js";
import { resolveProjectionIdentity } from "../../lib/view-as-policy.js";
import { getRequestAuthorization } from "../../lib/request-authorization.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Document Manager | Broken Compass Knowledge",
  robots: { index: false, follow: false }
};

export default async function ManagerPage({ searchParams }) {
  const identity = await getManagerIdentity();
  if (!identity) notFound();
  const authorization = await getRequestAuthorization();

  const params = await searchParams;
  const projection = resolveProjectionIdentity(identity, typeof params.viewAs === "string" ? params.viewAs : identity);
  const requestedSlug = typeof params.document === "string" ? params.document : "building-manager";
  const definitions = await listDocuments();
  const selected = definitions.find((document) => document.slug === requestedSlug);
  if (!selected) notFound();

  const documentList = await Promise.all(definitions.map(async (definition) => {
    const reviews = await reviewService.list(definition.slug, identity);
    let publishedMetadata = null;
    if (definition.published) publishedMetadata = await loadCanonicalDocument(definition.slug);
    return {
      slug: definition.slug,
      title: publishedMetadata?.frontmatter.title ?? definition.title,
      defaultVisibility: publishedMetadata?.frontmatter.default_visibility ?? definition.defaultVisibility,
      url: definition.url,
      hasDraft: (await draftRepository.read(definition.slug)) !== null,
      openFlags: reviews.filter((review) => review.status === "open").length,
      browsePath: definition.browsePath
    };
  }));

  const draftSource = await draftRepository.read(selected.slug);
  const canonicalSource = draftSource === null ? await loadCanonicalSource(selected.slug) : null;
  const currentVersion = selected.published ? await loadPublishedVersion(selected.slug) : null;
  const versions = await versionRepository.listVersions(selected.slug);
  const reviews = await reviewService.list(selected.slug, identity);

  return (
    <DocumentManager
      identity={identity}
      authorization={authorization}
      projection={projection}
      documents={documentList}
      selectedSlug={selected.slug}
      initialDocument={{ ...toEditableDocument(draftSource ?? canonicalSource), browsePath: (await draftRepository.readBrowsePath?.(selected.slug)) ?? selected.browsePath }}
      initialHasDraft={draftSource !== null}
      initialCurrentVersion={currentVersion}
      initialVersions={versions}
      initialReviews={reviews}
      browseLocations={(await discoverBrowseFolders()).map((folder) => ({ label: folder.name, path: folder.segments }))}
    />
  );
}
