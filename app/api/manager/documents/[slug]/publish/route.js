import { NextResponse } from "next/server";
import { getDocumentDefinition, loadPublishedVersion } from "../../../../../../lib/knowledge.js";
import { getManagerAuthorization } from "../../../../../../lib/manager-access.js";
import { publicationService } from "../../../../../../lib/publication.js";

export async function POST(_request, { params }) {
  const authorization = await getManagerAuthorization();
  if (!authorization) return new NextResponse(null, { status: 404 });
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return new NextResponse(null, { status: 404 });
  try {
    await loadPublishedVersion(slug);
    return NextResponse.json({ published: true, version: await publicationService.publishDraft(slug, authorization.identity, authorization.actorId) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
