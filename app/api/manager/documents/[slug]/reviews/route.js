import { NextResponse } from "next/server";
import { getDocumentDefinition } from "../../../../../../lib/knowledge.js";
import { getManagerIdentity } from "../../../../../../lib/manager-access.js";
import { reviewService } from "../../../../../../lib/review-operations.js";

export async function GET(_request, { params }) {
  const identity = await getManagerIdentity();
  if (!identity) return new NextResponse(null, { status: 404 });
  const { slug } = await params;
  if (!getDocumentDefinition(slug)) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ reviews: await reviewService.list(slug, identity) });
}
