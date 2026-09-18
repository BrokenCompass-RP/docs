import { NextResponse } from "next/server";
import { getManagerIdentity } from "../../../../../../../../lib/manager-access.js";
import { reviewService } from "../../../../../../../../lib/review-operations.js";

export async function POST(request, { params }) {
  const identity = await getManagerIdentity();
  if (!identity) return new NextResponse(null, { status: 404 });
  try {
    const { slug, flagId } = await params;
    const { body } = await request.json();
    return NextResponse.json({ comment: await reviewService.addComment(slug, flagId, body, identity) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
