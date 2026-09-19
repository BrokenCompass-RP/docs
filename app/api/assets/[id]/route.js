import { NextResponse } from "next/server";
import { projectSections } from "../../../../lib/access-markdown.js";
import { assetRepository } from "../../../../lib/assets.js";
import { loadCanonicalDocument } from "../../../../lib/knowledge.js";
import { getRequestAuthorization } from "../../../../lib/request-authorization.js";

const missing = () => new NextResponse(null, { status: 404 });
const referenced = (sections, id) => sections.some((section) => new RegExp(`!\\[[^\\]]*\\]\\(asset:${id}(?:\\s+\"[^\"]*\")?\\)`, "i").test(section.markdown));

export async function GET(request, { params }) {
  const { id } = await params;
  const asset = await assetRepository.get(id);
  if (!asset) return missing();
  const authorization = await getRequestAuthorization();
  let allowed = false;
  try { allowed = referenced(projectSections(await loadCanonicalDocument(asset.documentSlug), authorization.identity), id); }
  catch { allowed = false; }
  if (!allowed) return missing();
  return new NextResponse(asset.content, { headers: { "Content-Type": asset.mediaType, "Content-Length": String(asset.byteSize), "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" } });
}
