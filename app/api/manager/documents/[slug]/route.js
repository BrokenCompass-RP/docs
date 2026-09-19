import { NextResponse } from "next/server";
import { serializeEditableDocument, toEditableDocument } from "../../../../../lib/authoring-markdown.js";
import { draftRepository } from "../../../../../lib/drafts.js";
import { getDocumentDefinition, loadCanonicalSource } from "../../../../../lib/knowledge.js";
import { getManagerAuthorization, getManagerIdentity } from "../../../../../lib/manager-access.js";

function unavailable() {
  return new NextResponse(null, { status: 404 });
}

export async function GET(_request, { params }) {
  if (!(await getManagerIdentity())) return unavailable();
  const { slug } = await params;
  if (!(await getDocumentDefinition(slug))) return unavailable();
  const draftSource = await draftRepository.read(slug);
  const canonicalSource = draftSource === null ? await loadCanonicalSource(slug) : null;
  return NextResponse.json({
    document: { ...toEditableDocument(draftSource ?? canonicalSource), browsePath: (await draftRepository.readBrowsePath?.(slug)) ?? (await getDocumentDefinition(slug)).browsePath },
    hasDraft: draftSource !== null
  });
}

export async function PUT(request, { params }) {
  const authorization = await getManagerAuthorization();
  if (!authorization) return unavailable();
  const { slug } = await params;
  if (!(await getDocumentDefinition(slug))) return unavailable();
  try {
    const document = await request.json();
    const source = serializeEditableDocument(document);
    await draftRepository.save(slug, source, { authorIdentity: authorization.actorId, browsePath: document.browsePath });
    return NextResponse.json({ saved: true, document: { ...toEditableDocument(source), browsePath: document.browsePath } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  if (!(await getManagerIdentity())) return unavailable();
  const { slug } = await params;
  if (!(await getDocumentDefinition(slug))) return unavailable();
  await draftRepository.discard(slug);
  return NextResponse.json({ discarded: true });
}
