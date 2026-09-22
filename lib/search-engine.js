import { createRetrievalUnits, projectSections } from "./access-markdown.js";
import { canView, isVisibility } from "./visibility-policy.js";

const WEIGHTS = Object.freeze({ title: 300, heading: 200, body: 100 });

function normalize(value) {
  return value.toLocaleLowerCase("en-US");
}

function tokenize(query) {
  return [...new Set(normalize(query).match(/[\p{L}\p{N}_/-]+/gu) ?? [])];
}

function occurrences(text, term) {
  let count = 0;
  let position = 0;
  while ((position = text.indexOf(term, position)) !== -1) {
    count += 1;
    position += term.length;
  }
  return count;
}

function fieldScore(text, terms, base) {
  const normalized = normalize(text);
  if (!terms.every((term) => normalized.includes(term))) return 0;
  const frequencyBonus = Math.min(
    99,
    terms.reduce((sum, term) => sum + occurrences(normalized, term), 0)
  );
  return base + frequencyBonus;
}

function makeSnippet(unit, terms) {
  if (!unit.body) return unit.heading;
  const normalized = normalize(unit.body);
  const positions = terms.map((term) => normalized.indexOf(term)).filter((value) => value >= 0);
  const matchAt = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, matchAt - 70);
  const end = Math.min(unit.body.length, matchAt + 170);
  return `${start > 0 ? "…" : ""}${unit.body.slice(start, end).trim()}${end < unit.body.length ? "…" : ""}`;
}

export function searchParsedDocuments(documents, query, identity) {
  if (!isVisibility(identity)) throw new Error(`Invalid identity: ${String(identity)}`);
  const terms = tokenize(query);
  if (!terms.length) return [];

  const results = [];

  for (const document of documents) {
    const metadataVisibility = document.frontmatter.default_visibility;
    if (!canView(identity, metadataVisibility)) continue;
    if (projectSections(document, identity).length === 0) continue;

    // Authorization is applied before any query matching, scoring, or snippets.
    const authorizedUnits = createRetrievalUnits(document).filter((unit) =>
      canView(identity, unit.visibility)
    );

    const candidates = [];
    const titleScore = fieldScore(document.frontmatter.title, terms, WEIGHTS.title);
    if (titleScore) {
      const firstUnit = authorizedUnits[0];
      candidates.push({
        score: titleScore,
        heading: "",
        snippet: firstUnit ? makeSnippet(firstUnit, terms) : document.frontmatter.description
      });
    }

    for (const unit of authorizedUnits) {
      const headingScore = fieldScore(unit.heading, terms, WEIGHTS.heading);
      const bodyScore = fieldScore(unit.body, terms, WEIGHTS.body);
      if (headingScore || bodyScore) {
        candidates.push({
          score: Math.max(headingScore, bodyScore),
          heading: headingScore ? unit.heading : "",
          snippet: makeSnippet(unit, terms)
        });
      }
    }

    if (!candidates.length) continue;
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    results.push({
      slug: document.slug,
      title: document.frontmatter.title,
      url: document.url,
      score: best.score,
      heading: best.heading,
      snippet: best.snippet
    });
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}
