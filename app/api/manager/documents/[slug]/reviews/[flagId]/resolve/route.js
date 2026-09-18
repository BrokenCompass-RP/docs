import { NextResponse } from "next/server";
import { getManagerIdentity } from "../../../../../../../../lib/manager-access.js";
import { loadPublishedVersion } from "../../../../../../../../lib/knowledge.js";
import { reviewService } from "../../../../../../../../lib/review-operations.js";

export async function POST(_request, { params }) {
  const identity = await getManagerIdentity();
  if (!identity) return new NextResponse(null, { status: 404 });
  try {
    const { slug, flagId } = await params;
    const current = await loadPublishedVersion(slug);
    return NextResponse.json({ review: await reviewService.resolve(slug, flagId, identity, current.versionId) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
