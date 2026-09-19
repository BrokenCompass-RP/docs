import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { projectSections } from "./access-markdown.js";
import { constructBrowse } from "./browse-model.js";
import { listDocuments, loadCanonicalDocument } from "./knowledge.js";

export { findBrowseFolder } from "./browse-model.js";

const slugify = (name) => name.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function walkFolders(directory, segments = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  const folders = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const folderSegments = [...segments, slugify(entry.name)];
    folders.push({ name: entry.name, segments: folderSegments });
    folders.push(...await walkFolders(path.join(directory, entry.name), folderSegments));
  }
  return folders;
}

export async function discoverBrowseFolders(contentDirectory = path.join(process.cwd(), "content")) {
  return walkFolders(contentDirectory);
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
