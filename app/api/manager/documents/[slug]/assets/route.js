import { NextResponse } from "next/server";
import { assetRepository } from "../../../../../../lib/assets.js";
import { assetMarkdown } from "../../../../../../lib/image-validation.js";
import { getDocumentDefinition } from "../../../../../../lib/knowledge.js";
import { getManagerAuthorization } from "../../../../../../lib/manager-access.js";
import { isVisibility } from "../../../../../../lib/visibility-policy.js";

export async function POST(request, { params }) {
  const authorization = await getManagerAuthorization();
  if (!authorization) return new NextResponse(null, { status: 404 });
  const { slug } = await params;
  if (!(await getDocumentDefinition(slug))) return new NextResponse(null, { status: 404 });
  try {
    const form = await request.formData();
    const file = form.get("image");
    const alt = form.get("alt");
    const caption = form.get("caption");
    const visibility = form.get("visibility");
    if (!(file instanceof File)) throw new Error("Choose an image to upload");
    if (!isVisibility(visibility)) throw new Error("Invalid image visibility");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const asset = await assetRepository.create({ documentSlug: slug, filename: file.name, mediaType: file.type, bytes, alt, visibility, createdBy: authorization.actorId });
    return NextResponse.json({ asset: { id: asset.id }, markdown: assetMarkdown(asset.id, alt, caption) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
