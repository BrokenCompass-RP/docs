import "server-only";
import { parseCanonicalMarkdown, projectSections, renderProjection } from "./access-markdown.js";
import { getDocumentDefinition as getSeedDefinition, loadSeedSource } from "./content-registry.js";
import { documentRepository } from "./documents.js";
import { versionRepository } from "./versions.js";

export async function listDocuments() { return documentRepository.list(); }
export async function getDocumentDefinition(slug) { return documentRepository.get(slug); }

export async function loadPublishedVersion(slug) {
  const definition = await getDocumentDefinition(slug);
  if (!definition) throw new Error(`Unknown document: ${slug}`);
  const current = await versionRepository.getCurrent(slug);
  if (current) return current;
  if (!getSeedDefinition(slug)) throw new Error(`Document is not published: ${slug}`);
  return versionRepository.ensureInitialized(slug, await loadSeedSource(slug));
}

export async function loadCanonicalSource(slug) {
  return (await loadPublishedVersion(slug)).canonicalMarkdown;
}

export async function loadCanonicalDocument(slug) {
  const entry = await getDocumentDefinition(slug);
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
