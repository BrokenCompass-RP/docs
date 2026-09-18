import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { canView, isVisibility } from "./visibility-policy.js";

const OPEN_DIRECTIVE = /^:::access\s+visibility="([a-z]+)"\s*$/;
const CLOSE_DIRECTIVE = /^:::\s*$/;
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function parseCanonicalMarkdown(source) {
  const parsed = matter(source);
  const defaultVisibility = parsed.data.default_visibility;

  if (!isVisibility(defaultVisibility)) {
    throw new Error(`Invalid default_visibility: ${String(defaultVisibility)}`);
  }

  const blocks = [];
  let activeVisibility = defaultVisibility;
  let activeLines = [];
  let insideAccessBlock = false;

  const flush = () => {
    const markdownSource = activeLines.join("\n").trim();
    if (markdownSource) blocks.push({ visibility: activeVisibility, markdown: markdownSource });
    activeLines = [];
  };

  for (const [index, line] of parsed.content.split(/\r?\n/).entries()) {
    const open = line.match(OPEN_DIRECTIVE);

    if (open) {
      if (insideAccessBlock) {
        throw new Error(`Nested access directive at line ${index + 1}`);
      }
      if (!isVisibility(open[1])) {
        throw new Error(`Unknown visibility at line ${index + 1}: ${open[1]}`);
      }
      flush();
      activeVisibility = open[1];
      insideAccessBlock = true;
      continue;
    }

    if (line.startsWith(":::access")) {
      throw new Error(`Malformed access directive at line ${index + 1}`);
    }

    if (CLOSE_DIRECTIVE.test(line)) {
      if (!insideAccessBlock) {
        throw new Error(`Unexpected access directive close at line ${index + 1}`);
      }
      flush();
      activeVisibility = defaultVisibility;
      insideAccessBlock = false;
      continue;
    }

    activeLines.push(line);
  }

  if (insideAccessBlock) throw new Error("Unclosed access directive");
  flush();

  return { frontmatter: parsed.data, blocks };
}

export function projectDocument(document, identity) {
  if (!isVisibility(identity)) throw new Error(`Invalid identity: ${String(identity)}`);
  return document.blocks.filter((block) => canView(identity, block.visibility));
}

export function renderProjection(document, identity) {
  const authorizedMarkdown = projectDocument(document, identity)
    .map((block) => block.markdown)
    .join("\n\n");
  return markdown.render(authorizedMarkdown);
}

function sectionSlug(value) {
  return stripInlineMarkdown(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

export function createDocumentSections(document) {
  const sections = [];
  const occurrences = new Map();
  for (const block of document.blocks) {
    let lines = [];
    const flush = () => {
      const source = lines.join("\n").trim();
      if (!source) return;
      const headingMatch = source.match(/^##\s+(.+)$/m);
      const heading = headingMatch ? stripInlineMarkdown(headingMatch[1]) : "Document introduction";
      const base = headingMatch ? sectionSlug(heading) : "document-introduction";
      const count = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, count);
      sections.push({
        sectionId: count === 1 ? base : `${base}-${count}`,
        heading,
        visibility: block.visibility,
        markdown: source,
        html: markdown.render(source)
      });
      lines = [];
    };
    for (const line of block.markdown.split(/\r?\n/)) {
      if (/^##\s+/.test(line) && lines.some((value) => value.trim())) flush();
      lines.push(line);
    }
    flush();
  }
  return sections;
}

export function projectSections(document, identity) {
  if (!isVisibility(identity)) throw new Error(`Invalid identity: ${String(identity)}`);
  return createDocumentSections(document).filter((section) => canView(identity, section.visibility));
}

function stripInlineMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function createRetrievalUnits(document) {
  const units = [];

  for (const block of document.blocks) {
    let heading = "";
    let body = [];

    const flush = () => {
      const bodyText = stripInlineMarkdown(body.join(" "));
      if (heading || bodyText) {
        units.push({
          visibility: block.visibility,
          heading,
          body: bodyText
        });
      }
      body = [];
    };

    for (const line of block.markdown.split(/\r?\n/)) {
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headingMatch) {
        flush();
        heading = stripInlineMarkdown(headingMatch[1]);
      } else if (!/^\s*(?:---|:::)/.test(line)) {
        body.push(line);
      }
    }
    flush();
  }

  return units;
}
