import "server-only";
import { projectSections } from "./access-markdown.js";
import { constructBrowse } from "./browse-model.js";
import { BROWSE_TAXONOMY } from "./browse-taxonomy.js";
import { listDocuments, loadCanonicalDocument } from "./knowledge.js";

export { findBrowseFolder } from "./browse-model.js";

export async function discoverBrowseFolders() {
  return BROWSE_TAXONOMY.map((folder) => ({ ...folder, segments: [...folder.segments] }));
}

export async function buildAuthorizedBrowse(identity, options = {}) {
  const folderDefinitions = options.folderDefinitions ?? await discoverBrowseFolders();
  const documentDefinitions = options.documentDefinitions ?? await listDocuments();
  const loadDocument = options.loadDocument ?? loadCanonicalDocument;

  // Projection happens before any document title, description, URL, folder, count,
  // or preview is admitted to the navigation model.
  const authorizedDocuments = [];
  for (const definition of documentDefinitions) {
    if (definition.published === false) continue;
    const document = await loadDocument(definition.slug);
    if (projectSections(document, identity).length === 0) continue;
    authorizedDocuments.push({
      slug: definition.slug,
      title: document.frontmatter.title,
      description: document.frontmatter.description ?? "",
      url: definition.url,
      browsePath: [...(definition.browsePath ?? [])]
    });
  }

  return constructBrowse(identity, folderDefinitions, authorizedDocuments);
}
