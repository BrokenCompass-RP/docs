import "server-only";
import { listDocuments, loadCanonicalDocument } from "./knowledge.js";
import { searchParsedDocuments } from "./search-engine.js";

export async function searchKnowledge(query, identity) {
  const documents = await Promise.all(
    listDocuments().map(({ slug }) => loadCanonicalDocument(slug))
  );
  return searchParsedDocuments(documents, query, identity);
}
