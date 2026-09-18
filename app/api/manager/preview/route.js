import { NextResponse } from "next/server";
import { parseCanonicalMarkdown, renderProjection } from "../../../../lib/access-markdown.js";
import { serializeEditableDocument, visibilitySummary } from "../../../../lib/authoring-markdown.js";
import { getManagerIdentity } from "../../../../lib/manager-access.js";
import { isVisibility } from "../../../../lib/visibility-policy.js";

export async function POST(request) {
  if (!(await getManagerIdentity())) return new NextResponse(null, { status: 404 });
  try {
    const { document, visibility } = await request.json();
    if (!isVisibility(visibility)) throw new Error("Invalid preview visibility");
    const source = serializeEditableDocument(document);
    const canonical = parseCanonicalMarkdown(source);
    return NextResponse.json({
      html: renderProjection(canonical, visibility),
      summary: visibilitySummary(document)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
