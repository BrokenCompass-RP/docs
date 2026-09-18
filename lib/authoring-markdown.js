import matter from "gray-matter";
import { parseCanonicalMarkdown } from "./access-markdown.js";
import { isVisibility } from "./visibility-policy.js";

const DIRECTIVE_PATTERN = /^\s*:::(?:access)?\b/m;

function splitCoherentSections(markdown) {
  const sections = [];
  let current = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (/^##\s+/.test(line) && current.some((value) => value.trim())) {
      sections.push(current.join("\n").trim());
      current = [];
    }
    current.push(line);
  }
  if (current.some((value) => value.trim())) sections.push(current.join("\n").trim());
  return sections;
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

export function toEditableDocument(source) {
  const canonical = parseCanonicalMarkdown(source);
  return {
    title: canonical.frontmatter.title ?? "",
    description: canonical.frontmatter.description ?? "",
    defaultVisibility: canonical.frontmatter.default_visibility,
    sections: canonical.blocks.flatMap((block) =>
      splitCoherentSections(block.markdown).map((markdown) => ({
        visibility: block.visibility,
        markdown
      }))
    ).map((section, index) => ({ id: `section-${index + 1}`, ...section }))
  };
}

export function serializeEditableDocument(input) {
  const title = requiredText(input.title, "Title");
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const defaultVisibility = input.defaultVisibility;
  if (!isVisibility(defaultVisibility)) throw new Error("Invalid default visibility");
  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    throw new Error("At least one section is required");
  }

  const body = input.sections.map((section, index) => {
    if (!isVisibility(section.visibility)) {
      throw new Error(`Invalid visibility for section ${index + 1}`);
    }
    const markdown = requiredText(section.markdown, `Section ${index + 1}`);
    if (DIRECTIVE_PATTERN.test(markdown)) {
      throw new Error(`Section ${index + 1} contains reserved access-directive syntax`);
    }
    if (section.visibility === defaultVisibility) return markdown;
    return `:::access visibility="${section.visibility}"\n${markdown}\n:::`;
  }).join("\n\n");

  const source = matter.stringify(body, {
    title,
    description,
    default_visibility: defaultVisibility
  });

  // The same canonical parser used by readers and search is the final validator.
  parseCanonicalMarkdown(source);
  return source;
}

export function visibilitySummary(input) {
  const counts = { public: 0, moderator: 0, developer: 0, administrator: 0 };
  for (const section of input.sections ?? []) {
    if (isVisibility(section.visibility)) counts[section.visibility] += 1;
  }
  return counts;
}
