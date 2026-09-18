import { NextResponse } from "next/server";
import { getDocumentDefinition, loadPublishedVersion } from "../../../../../../lib/knowledge.js";
import { getManagerIdentity } from "../../../../../../lib/manager-access.js";
import { publicationService } from "../../../../../../lib/publication.js";
import { versionRepository } from "../../../../../../lib/versions.js";

const unavailable = () => new NextResponse(null, { status: 404 });

export async function GET(_request, { params }) {
  if (!(await getManagerIdentity())) return unavailable();
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return unavailable();
  await loadPublishedVersion(slug);
  return NextResponse.json({ versions: await versionRepository.listVersions(slug) });
}

export async function POST(request, { params }) {
  const identity = await getManagerIdentity();
  if (!identity) return unavailable();
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return unavailable();
  try {
    const { versionId } = await request.json();
    return NextResponse.json({ recovered: true, version: await publicationService.recoverVersion(slug, versionId, identity) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
