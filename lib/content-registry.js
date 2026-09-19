import { readFile } from "node:fs/promises";
import path from "node:path";

const DOCUMENTS = Object.freeze({
  "building-manager": { id: "0f251c65-ce3d-4aa6-a604-d7fe8460510f", filename: "building-manager.md", url: "/guides/building-manager" },
  "getting-around": { id: "4f510418-f67e-45b9-a93d-3f264372f776", filename: "getting-around.md", url: "/docs/getting-around" },
  "mechanic-job": { id: "2c21fa3e-2b55-48a2-953e-117e504f0ad2", filename: "mechanic-job.md", url: "/docs/mechanic-job" },
  "community-rules": { id: "b1f7acc2-aa92-4850-9afd-e078f3d9ad5e", filename: "community-rules.md", url: "/docs/community-rules" },
  "architecture-guide": { id: "ad3fcae8-3a70-4c3c-a46c-0b477aa94673", filename: "architecture-guide.md", url: "/docs/architecture-guide" }
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
