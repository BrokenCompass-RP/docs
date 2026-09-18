import { notFound } from "next/navigation";
import { DocumentManager } from "../../components/DocumentManager.js";
import { toEditableDocument } from "../../lib/authoring-markdown.js";
import { draftRepository } from "../../lib/drafts.js";
import { listDocuments, loadCanonicalDocument, loadCanonicalSource, loadPublishedVersion } from "../../lib/knowledge.js";
import { getManagerIdentity } from "../../lib/manager-access.js";
import { versionRepository } from "../../lib/versions.js";
import { reviewService } from "../../lib/review-operations.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Document Manager | Broken Compass Knowledge",
  robots: { index: false, follow: false }
};

export default async function ManagerPage({ searchParams }) {
  const identity = await getManagerIdentity();
  if (!identity) notFound();

  const params = await searchParams;
  const requestedSlug = typeof params.document === "string" ? params.document : "building-manager";
  const definitions = listDocuments();
  const selected = definitions.find((document) => document.slug === requestedSlug);
  if (!selected) notFound();

  const documentList = await Promise.all(definitions.map(async (definition) => {
    const canonical = await loadCanonicalDocument(definition.slug);
    const reviews = await reviewService.list(definition.slug, identity);
    return {
      slug: definition.slug,
      title: canonical.frontmatter.title,
      defaultVisibility: canonical.frontmatter.default_visibility,
      url: definition.url,
      hasDraft: (await draftRepository.read(definition.slug)) !== null,
      openFlags: reviews.filter((review) => review.status === "open").length
    };
  }));

  const canonicalSource = await loadCanonicalSource(selected.slug);
  const draftSource = await draftRepository.read(selected.slug);
  const currentVersion = await loadPublishedVersion(selected.slug);
  const versions = await versionRepository.listVersions(selected.slug);
  const reviews = await reviewService.list(selected.slug, identity);

  return (
    <DocumentManager
      identity={identity}
      documents={documentList}
      selectedSlug={selected.slug}
      initialDocument={toEditableDocument(draftSource ?? canonicalSource)}
      initialHasDraft={draftSource !== null}
      initialCurrentVersion={currentVersion}
      initialVersions={versions}
      initialReviews={reviews}
    />
  );
}
