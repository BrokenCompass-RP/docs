import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { createDocumentSections, parseCanonicalMarkdown } from "../lib/access-markdown.js";
import { slugifyTitle } from "../lib/document-repository.js";
import { stableMigrationDocumentId } from "../lib/migration-identity.js";

const corpusRoot = path.join(process.cwd(), "content");
const outputRoot = path.join(process.cwd(), "migration", "dry-run");
const protectedSlugs = new Set(["architecture-guide", "building-manager", "community-rules", "getting-around", "mechanic-job", "phone-directory"]);
const batchOne = new Set([
  "Development/BCRP_PHOTO_DEPLOYMENT.md",
  "Development/bcrp-hud-backlog.md",
  "Development/bcrp-hud-data-contract.md",
  "Development/bcrp-hud-phase-1-validation.md",
  "Development/bcrp-hud-resource-map.md",
  "Development/bcrp-hud-ui-audit.md",
  "Development/vehicle-lifecycle-impound-architecture-review-2026-08-01.md"
]);

const imageCounts = new Map(Object.entries({
  "Departments/Fire/BCRP-Fire-SOP.docx": 2,
  "Departments/Fire/Fire Basics Guide BCRP.docx": 14,
  "Departments/Police/BCRP-Police-SOP.docx": 1,
  "Departments/Police/Police Basics Guide BCRP.docx": 17,
  "Departments/Police/Prison Guide BCRP.docx": 9,
  "Getting Started/Towing Job Guide BCRP.docx": 12,
  "Getting Started/Jobs/Mechanic Guide v1 BCRP.docx": 8,
  "Getting Started/Properties/Bay City Blue Apts Guide BCRP.docx": 7
}));

const collisionGroups = new Map(Object.entries({
  "architecture-guide.md": "existing-architecture",
  "Development/ARCHITECTURE.md": "existing-architecture",
  "Development/server-architecture.md": "existing-architecture",
  "Development/CODEBASE_HEALTH_PERFORMANCE_AUDIT.md": "existing-architecture",
  "building-manager.md": "existing-building-manager",
  "Staff/Building Manager Guide BCRP.docx": "existing-building-manager",
  "community-rules.md": "community-rules",
  "Community/rules.mdx": "community-rules",
  "getting-around.md": "getting-around",
  "Getting Started/getting-around.mdx": "getting-around",
  "mechanic-job.md": "mechanic-job",
  "Getting Started/Jobs/mechanic-job.mdx": "mechanic-job",
  "Getting Started/Jobs/Mechanic Guide v1 BCRP.docx": "mechanic-job",
  "Getting Started/Jobs/tow-job.mdx": "towing-guide",
  "Getting Started/Towing Job Guide BCRP.docx": "towing-guide",
  "Getting Started/common-commands.mdx": "commands-and-controls",
  "Getting Started/controls.mdx": "commands-and-controls",
  "Getting Started/Player Control & Command Guide.docx": "commands-and-controls",
  "Development/COMMANDS_AND_KEYBINDS.md": "commands-and-controls",
  "Development/commands-and-hotkeys.md": "commands-and-controls",
  "Development/bcrp_testing_coverage_report.md": "qa-coverage",
  "Development/6-30-26 Broken Compass RP – QA Testing Coverage Report.docx": "qa-coverage",
  "Development/coding-standards.md": "development-process",
  "Development/cody-instructions.md": "development-process",
  "Development/development-workflow.md": "development-process",
  "Development/BCRP - Dev 10 Day Roadmap.docx": "development-process",
  "Development/BCRP - Dev Onboarding.docx": "development-process",
  "Development/Broken Compass RP Git Branch Map.docx": "development-process",
  "Civilian Activities/overview.mdx": "overview-slug",
  "Criminal Activities/overview.mdx": "overview-slug",
  "Getting Started/overview.mdx": "overview-slug",
  "Getting Started/Jobs/overview.mdx": "overview-slug"
}));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

const slash = (value) => value.split(path.sep).join("/");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceTitle = (relative, text) => {
  if (text) {
    const parsed = matter(text);
    if (typeof parsed.data.title === "string" && parsed.data.title.trim()) return parsed.data.title.trim();
    const heading = parsed.content.match(/^#\s+(.+)$/m);
    if (heading) return heading[1].replace(/[`*_~]/g, "").trim();
  }
  return path.basename(relative, path.extname(relative));
};

function browseDestination(relative) {
  if (relative.startsWith("Development/")) return ["development"];
  if (relative.startsWith("Community/")) return ["community"];
  if (relative.startsWith("Staff/")) return ["staff"];
  if (relative.startsWith("Getting Started/Jobs/")) return ["getting-started", "jobs"];
  if (relative.startsWith("Getting Started/Properties/")) return null;
  if (relative.startsWith("Getting Started/")) return ["getting-started"];
  if (relative === "architecture-guide.md") return ["development"];
  if (relative === "building-manager.md") return ["systems-features"];
  if (relative === "community-rules.md") return ["community"];
  if (relative === "getting-around.md") return ["getting-started"];
  if (relative === "mechanic-job.md") return ["getting-started", "jobs"];
  return null;
}

function disposition(relative) {
  if (!relative.includes("/")) return "RECONCILE";
  if (relative === "Development/reflective-codewalker-commands-2026-07-31.txt") return "EXCLUDE";
  if (relative === "Development/commands-and-hotkeys.md") return "HISTORICAL";
  if (batchOne.has(relative)) return "IMPORT";
  if (collisionGroups.has(relative)) return "RECONCILE";
  if (relative.endsWith(".csv") || relative.endsWith(".pdf")) return "HOLD";
  if (relative.startsWith("Civilian Activities/") || relative.startsWith("Criminal Activities/") || relative.startsWith("Departments/") || relative.startsWith("Getting Started/Properties/")) return "HOLD";
  if (/Getting Started\/Jobs\/(bus-job|ems-job|garbage-worker|overview|police-job|recycler|taxi-job|trucker)\.mdx$/.test(relative)) return "HOLD";
  if (relative === "Community/Community Creator Guide - BCRP.docx") return "HOLD";
  if (relative.startsWith("Staff/")) return "HOLD";
  if (relative.startsWith("Development/") && relative.endsWith(".docx")) return "IMPORT";
  if (relative === "Getting Started/Random Joe.docx") return "IMPORT";
  if (relative === "Getting Started/known-issues.mdx") return "IMPORT";
  return "HOLD";
}

function visibility(relative, proposedDisposition) {
  if (relative === "architecture-guide.md") return "developer";
  if (["building-manager.md", "community-rules.md", "getting-around.md", "mechanic-job.md"].includes(relative)) return "public";
  if (relative.startsWith("Development/") && ["IMPORT", "HISTORICAL"].includes(proposedDisposition)) return "developer";
  if ((relative === "Getting Started/Random Joe.docx" || relative === "Getting Started/known-issues.mdx") && proposedDisposition === "IMPORT") return "public";
  return null;
}

function importMethod(extension) {
  if (extension === ".md" || extension === ".mdx") return "native-markdown-canonical-envelope-v1";
  if (extension === ".docx") return "docx-wordprocessingml-text-extraction-pending";
  if (extension === ".csv") return "csv-preservation-decision-pending";
  if (extension === ".pdf") return "pdf-text-extraction-pending";
  if (extension === ".txt") return "plain-text-review-pending";
  return "unsupported-review-pending";
}

function missingReferencesFor(filename, text) {
  if (!text) return [];
  const references = [...text.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1].split(/\s+"/)[0].replace(/^<|>$/g, ""));
  return references.filter((target) => {
    if (/^(?:https?:|mailto:|#)/.test(target)) return false;
    const candidate = target.startsWith("/")
      ? path.join(process.cwd(), target.replace(/^\/+/, ""))
      : path.resolve(path.dirname(filename), target);
    try { return !requireFile(candidate); } catch { return true; }
  });
}

function requireFile(filename) {
  try {
    return process.getBuiltinModule("fs").statSync(filename).isFile();
  } catch {
    return false;
  }
}

function notesFor(relative, proposedDisposition, images, text) {
  const notes = [];
  if (protectedSlugs.has(slugifyTitle(path.basename(relative, path.extname(relative))))) notes.push("Matches a protected PostgreSQL slug; do not create or overwrite automatically.");
  if (images) notes.push(`Source contains ${images} embedded image${images === 1 ? "" : "s"}; visual migration deferred.`);
  if (relative === "Departments/DOJ/DOJ SOPS.docx") notes.push("Reliable text extraction has not been established; ordinary Word text inspection returned only eight characters.");
  if (relative === "Departments/Police/Prison Guide BCRP.docx") notes.push("Contains an unresolved image placeholder in source text.");
  if (relative === "Community/Community Creator Guide - BCRP.docx") notes.push("Contains leftover editorial/reviewer prose requiring a preserve-versus-publish decision.");
  if (relative.endsWith(".mdx") && text?.includes("THIS PAGE IS INCOMPLETE")) notes.push("Source explicitly identifies itself as incomplete.");
  if (relative.endsWith(".csv")) notes.push("Living tabular record is not safely represented as an editable canonical Markdown document.");
  if (relative.endsWith(".pdf")) notes.push("Generic PDF attachment preservation is not implemented.");
  if (proposedDisposition === "EXCLUDE") notes.push("Raw machine-specific session transcript; exclusion was recommended during discovery.");
  if (!browseDestination(relative)) notes.push("No approved current browse destination preserves the source hierarchy.");
  return notes;
}

await mkdir(path.join(outputRoot, "batch-1"), { recursive: true });
const files = (await walk(corpusRoot)).filter((filename) => path.basename(filename) !== ".gitkeep").sort((a, b) => slash(a).localeCompare(slash(b)));
const manifest = [];
const dryRun = [];

for (const filename of files) {
  const relative = slash(path.relative(corpusRoot, filename));
  const extension = path.extname(filename).toLowerCase();
  const bytes = await readFile(filename);
  const text = extension === ".md" || extension === ".mdx" || extension === ".txt" || extension === ".csv" ? bytes.toString("utf8") : null;
  const title = sourceTitle(relative, text);
  const proposedDisposition = disposition(relative);
  const proposedSlug = slugifyTitle(title);
  const images = imageCounts.get(relative) ?? (text ? [...text.matchAll(/!\[[^\]]*\]\([^)]+\)/g)].length : 0);
  const missingReferences = missingReferencesFor(filename, text);
    const entry = {
    sourcePath: `content/${relative}`,
    sourceSha256: sha256(bytes),
    proposedDisposition,
    proposedTitle: title,
    proposedSlug,
    proposedDocumentId: stableMigrationDocumentId(`content/${relative}`, sha256(bytes)),
    proposedBrowsePath: browseDestination(relative),
    proposedVisibility: visibility(relative, proposedDisposition),
    collisionGroup: collisionGroups.get(relative) ?? null,
    extractionMethod: importMethod(extension),
    sourceContainsImages: images > 0,
    sourceImageCount: images,
    knownMissingReferences: [...new Set(missingReferences)],
    notes: notesFor(relative, proposedDisposition, images, text)
  };
  manifest.push(entry);

  if (batchOne.has(relative)) {
    if (protectedSlugs.has(proposedSlug)) throw new Error(`Batch 1 protected-slug collision: ${proposedSlug}`);
    const parsedSource = matter(text.replace(/\r\n/g, "\n"));
    const body = parsedSource.content.trim();
    const canonical = matter.stringify(body, { title, description: "", default_visibility: "developer" });
    const parsedCanonical = parseCanonicalMarkdown(canonical);
    const sections = createDocumentSections(parsedCanonical);
    await writeFile(path.join(outputRoot, "batch-1", `${proposedSlug}.md`), canonical, "utf8");
    dryRun.push({
      title,
      slug: proposedSlug,
      documentId: entry.proposedDocumentId,
      browsePath: ["development"],
      visibility: "developer",
      sectionCount: sections.length,
      sourcePath: entry.sourcePath,
      sourceSha256: entry.sourceSha256,
      importMethod: entry.extractionMethod,
      omitted: [],
      deferred: images ? [`${images} source images`] : [],
      transformation: "Added canonical frontmatter only; source body text retained after line-ending normalization."
    });
  }
}

const generatedAt = new Date().toISOString();
await writeFile(path.join(outputRoot, "migration-manifest.json"), `${JSON.stringify({ generatedAt, sourceRoot: "content", protectedSlugs: [...protectedSlugs], entries: manifest }, null, 2)}\n`);
await writeFile(path.join(outputRoot, "batch-1-report.json"), `${JSON.stringify({ generatedAt, documents: dryRun }, null, 2)}\n`);
console.log(`Manifest: ${manifest.length} sources`);
console.log(`Batch 1: ${dryRun.length} canonical documents`);
