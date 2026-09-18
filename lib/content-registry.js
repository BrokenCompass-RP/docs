import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DOCUMENTS = Object.freeze({
  "building-manager": { filename: "building-manager.md", url: "/guides/building-manager" },
  "getting-around": { filename: "getting-around.md", url: "/docs/getting-around" },
  "mechanic-job": { filename: "mechanic-job.md", url: "/docs/mechanic-job" },
  "community-rules": { filename: "community-rules.md", url: "/docs/community-rules" },
  "architecture-guide": { filename: "architecture-guide.md", url: "/docs/architecture-guide" }
});

export function listDocumentDefinitions() {
  return Object.entries(DOCUMENTS).map(([slug, entry]) => ({ slug, ...entry }));
}

export function getDocumentDefinition(slug) {
  const entry = DOCUMENTS[slug];
  return entry ? { slug, ...entry } : null;
}

export async function loadSeedSource(slug) {
  const entry = DOCUMENTS[slug];
  if (!entry) throw new Error(`Unknown document: ${slug}`);
  return readFile(path.join(process.cwd(), "content", entry.filename), "utf8");
}
