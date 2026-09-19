import { NextResponse } from "next/server";
import { serializeEditableDocument, toEditableDocument } from "../../../../../lib/authoring-markdown.js";
import { draftRepository } from "../../../../../lib/drafts.js";
import { getDocumentDefinition, loadCanonicalSource } from "../../../../../lib/knowledge.js";
import { getManagerIdentity } from "../../../../../lib/manager-access.js";

function unavailable() {
  return new NextResponse(null, { status: 404 });
}

export async function GET(_request, { params }) {
  if (!(await getManagerIdentity())) return unavailable();
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return unavailable();
  const canonicalSource = await loadCanonicalSource(slug);
  const draftSource = await draftRepository.read(slug);
  return NextResponse.json({
    document: toEditableDocument(draftSource ?? canonicalSource),
    hasDraft: draftSource !== null
  });
}

export async function PUT(request, { params }) {
  const identity = await getManagerIdentity();
  if (!identity) return unavailable();
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return unavailable();
  try {
    const document = await request.json();
    const source = serializeEditableDocument(document);
    await draftRepository.save(slug, source, { authorIdentity: identity });
    return NextResponse.json({ saved: true, document: toEditableDocument(source) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  if (!(await getManagerIdentity())) return unavailable();
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return unavailable();
  await draftRepository.discard(slug);
  return NextResponse.json({ discarded: true });
}
