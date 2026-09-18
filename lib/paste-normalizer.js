function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, ""));
}

export function normalizeRichTextToMarkdown(html, plainText = "") {
  if (typeof html !== "string" || !html.trim()) return plainText.replace(/\r\n/g, "\n");

  let output = html
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*hr\s*\/?\s*>/gi, "\n\n---\n\n")
    .replace(/<\s*h([1-6])[^>]*>([\s\S]*?)<\/\s*h\1\s*>/gi, (_, level, text) => `\n\n${"#".repeat(Number(level))} ${stripTags(text).trim()}\n\n`)
    .replace(/<\s*(strong|b)[^>]*>([\s\S]*?)<\/\s*\1\s*>/gi, (_, __, text) => `**${stripTags(text).trim()}**`)
    .replace(/<\s*(em|i)[^>]*>([\s\S]*?)<\/\s*\1\s*>/gi, (_, __, text) => `*${stripTags(text).trim()}*`)
    .replace(/<\s*a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\s*a\s*>/gi, (_, href, text) => `[${stripTags(text).trim()}](${href})`)
    .replace(/<\s*pre[^>]*>[\s\S]*?<\s*code[^>]*>([\s\S]*?)<\/\s*code\s*>[\s\S]*?<\/\s*pre\s*>/gi, (_, code) => `\n\n\`\`\`\n${decodeEntities(code).trim()}\n\`\`\`\n\n`)
    .replace(/<\s*code[^>]*>([\s\S]*?)<\/\s*code\s*>/gi, (_, code) => `\`${stripTags(code).trim()}\``)
    .replace(/<\s*li[^>]*>([\s\S]*?)<\/\s*li\s*>/gi, (_, text) => `\n@@LI@@${stripTags(text).trim()}`)
    .replace(/<\s*ol[^>]*>([\s\S]*?)<\/\s*ol\s*>/gi, (_, list) => {
      let index = 0;
      return `\n\n${list.replace(/@@LI@@/g, () => `${++index}. `)}\n\n`;
    })
    .replace(/<\s*ul[^>]*>([\s\S]*?)<\/\s*ul\s*>/gi, (_, list) => `\n\n${list.replace(/@@LI@@/g, "- ")}\n\n`)
    .replace(/@@LI@@/g, "- ")
    .replace(/<\s*(p|div|blockquote)[^>]*>([\s\S]*?)<\/\s*\1\s*>/gi, (_, __, text) => `\n\n${stripTags(text).trim()}\n\n`)
    .replace(/<[^>]*>/g, "");

  output = decodeEntities(output)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return output || plainText.replace(/\r\n/g, "\n");
}
