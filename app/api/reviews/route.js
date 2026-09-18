import { NextResponse } from "next/server";
import { getDevelopmentIdentity } from "../../../lib/dev-identity.js";
import { getDocumentDefinition, loadCanonicalDocument } from "../../../lib/knowledge.js";
import { reviewService } from "../../../lib/review-operations.js";
import { projectSections } from "../../../lib/access-markdown.js";

export async function POST(request) {
  try {
    const identity = await getDevelopmentIdentity();
    const input = await request.json();
    if (input.website) throw new Error("Invalid submission");
    if (!getDocumentDefinition(input.documentId)) throw new Error("Document not found");
    const document = await loadCanonicalDocument(input.documentId);
    let section = null;
    if (input.sectionId) {
      section = projectSections(document, identity).find((item) => item.sectionId === input.sectionId);
      if (!section) throw new Error("Section not found");
    }
    const flag = await reviewService.createFlag({
      documentId: input.documentId,
      sectionId: section?.sectionId,
      sectionHeading: section?.heading,
      reason: input.reason,
      initialComment: input.initialComment,
      versionAtReport: document.version.versionId
    }, identity);
    return NextResponse.json({ submitted: true, flagId: flag.flagId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
