import { NextResponse } from "next/server";
import { parseCanonicalMarkdown, projectDocument, renderProjection } from "../../../../lib/access-markdown.js";
import { assetRepository } from "../../../../lib/assets.js";
import { serializeEditableDocument, visibilitySummary } from "../../../../lib/authoring-markdown.js";
import { getManagerIdentity } from "../../../../lib/manager-access.js";
import { isVisibility } from "../../../../lib/visibility-policy.js";

export async function POST(request) {
  if (!(await getManagerIdentity())) return new NextResponse(null, { status: 404 });
  try {
    const { document, visibility, slug } = await request.json();
    if (!isVisibility(visibility)) throw new Error("Invalid preview visibility");
    const source = serializeEditableDocument(document);
    const canonical = parseCanonicalMarkdown(source);
    const ids = new Set(projectDocument(canonical, visibility).flatMap((block) => [...block.markdown.matchAll(/asset:([0-9a-f-]{36})/gi)].map((match) => match[1])));
    const urls = new Map();
    for (const id of ids) {
      const asset = await assetRepository.get(id);
      if (!asset || asset.documentSlug !== slug) throw new Error("Referenced image is unavailable");
      urls.set(id, `data:${asset.mediaType};base64,${Buffer.from(asset.content).toString("base64")}`);
    }
    return NextResponse.json({
      html: renderProjection(canonical, visibility, { assetUrl: (id) => urls.get(id) ?? "" }),
      summary: visibilitySummary(document)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
