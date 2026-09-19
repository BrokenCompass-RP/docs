import { NextResponse } from "next/server";
import { serializeEditableDocument } from "../../../../lib/authoring-markdown.js";
import { documentRepository } from "../../../../lib/documents.js";
import { draftRepository } from "../../../../lib/drafts.js";
import { getManagerAuthorization } from "../../../../lib/manager-access.js";
import { isVisibility } from "../../../../lib/visibility-policy.js";

export async function POST(request) {
  const authorization = await getManagerAuthorization();
  if (!authorization) return new NextResponse(null, { status: 404 });
  try {
    const input = await request.json();
    if (typeof input.title !== "string" || !input.title.trim()) throw new Error("Title is required");
    if (!isVisibility(input.defaultVisibility)) throw new Error("Invalid default visibility");
    const editable = {
      title: input.title.trim(), description: typeof input.description === "string" ? input.description.trim() : "",
      defaultVisibility: input.defaultVisibility, sections: [{ visibility: input.defaultVisibility, markdown: "## Overview\n\nStart writing here." }]
    };
    const source = serializeEditableDocument(editable);
    const document = await documentRepository.create({ ...editable, browsePath: input.browsePath });
    await draftRepository.save(document.slug, source, { authorIdentity: authorization.actorId, browsePath: document.browsePath });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    const collision = error?.code === "23505";
    return NextResponse.json({ error: collision ? "That document slug is already in use" : error.message }, { status: 400 });
  }
}
