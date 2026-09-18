import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRichTextToMarkdown } from "../lib/paste-normalizer.js";

test("normalizes common rich-text headings, emphasis, links, and paragraphs", () => {
  const markdown = normalizeRichTextToMarkdown(`
    <h2>Developer notes</h2>
    <p>Use <strong>care</strong> with <em>restricted</em> settings and <a href="https://example.com/docs">read the guide</a>.</p>
  `);
  assert.match(markdown, /^## Developer notes/);
  assert.match(markdown, /\*\*care\*\*/);
  assert.match(markdown, /\*restricted\*/);
  assert.match(markdown, /\[read the guide\]\(https:\/\/example\.com\/docs\)/);
});

test("normalizes ordered and unordered lists", () => {
  const markdown = normalizeRichTextToMarkdown("<ol><li>First</li><li>Second</li></ol><ul><li>Alpha</li><li>Beta</li></ul>");
  assert.match(markdown, /1\. First\n2\. Second/);
  assert.match(markdown, /- Alpha\n- Beta/);
});

test("normalizes inline and fenced code and removes scripts", () => {
  const markdown = normalizeRichTextToMarkdown("<p>Run <code>refresh</code>.</p><pre><code>ensure bcrp-propertytools</code></pre><script>secret()</script>");
  assert.match(markdown, /`refresh`/);
  assert.match(markdown, /```\nensure bcrp-propertytools\n```/);
  assert.doesNotMatch(markdown, /secret/);
});

test("falls back to plain text when rich HTML is unavailable", () => {
  assert.equal(normalizeRichTextToMarkdown("", "Plain\r\ntext"), "Plain\ntext");
});
