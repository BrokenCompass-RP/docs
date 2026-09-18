import "server-only";
import { parseCanonicalMarkdown, projectSections, renderProjection } from "./access-markdown.js";
import { getDocumentDefinition, listDocumentDefinitions, loadSeedSource } from "./content-registry.js";
import { versionRepository } from "./versions.js";

export function listDocuments() {
  return listDocumentDefinitions();
}

export { getDocumentDefinition };

export async function loadPublishedVersion(slug) {
  if (!getDocumentDefinition(slug)) throw new Error(`Unknown document: ${slug}`);
  const current = await versionRepository.getCurrent(slug);
  return current ?? versionRepository.ensureInitialized(slug, await loadSeedSource(slug));
}

export async function loadCanonicalSource(slug) {
  return (await loadPublishedVersion(slug)).canonicalMarkdown;
}

export async function loadCanonicalDocument(slug) {
  const entry = getDocumentDefinition(slug);
  if (!entry) throw new Error(`Unknown document: ${slug}`);

  const version = await loadPublishedVersion(slug);
  return { ...parseCanonicalMarkdown(version.canonicalMarkdown), slug, url: entry.url, version };
}

export async function loadProjectedDocument(slug, identity) {
  const document = await loadCanonicalDocument(slug);

  return {
    title: document.frontmatter.title,
    description: document.frontmatter.description,
    url: document.url,
    html: renderProjection(document, identity),
    sections: projectSections(document, identity),
    version: document.version
  };
}
