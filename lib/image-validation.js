const TYPES = new Map([
  ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/gif", [0x47, 0x49, 0x46, 0x38]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]]
]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageUpload({ mediaType, bytes, alt }) {
  if (typeof alt !== "string" || !alt.trim()) throw new Error("Image alt text is required");
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error("Image must be between 1 byte and 5 MB");
  const signature = TYPES.get(mediaType);
  if (!signature) throw new Error("Only PNG, JPEG, GIF, and WebP images are supported");
  if (!signature.every((value, index) => bytes[index] === value)) throw new Error("Image contents do not match the selected file type");
  if (mediaType === "image/webp" && String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") throw new Error("Invalid WebP image");
  return { alt: alt.trim() };
}

export function assetMarkdown(assetId, alt, caption = "") {
  const safeAlt = alt.replace(/[\]\r\n]/g, " ").trim();
  const safeCaption = String(caption ?? "").replace(/["\r\n]/g, " ").trim();
  if (!safeAlt) throw new Error("Image alt text is required");
  return `![${safeAlt}](asset:${assetId}${safeCaption ? ` \"${safeCaption}\"` : ""})`;
}
