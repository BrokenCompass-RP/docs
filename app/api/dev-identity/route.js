import { NextResponse } from "next/server";
import {
  DEV_IDENTITY_COOKIE,
  isVisibility
} from "../../../lib/visibility-policy.js";

export async function POST(request) {
  // NODE_ENV is fixed to "production" by `next build`; there is no runtime flag
  // that can turn this endpoint on in a production build.
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const formData = await request.formData();
  const requested = formData.get("visibility");
  const requestedReturnTo = formData.get("returnTo");
  const visibility = isVisibility(requested) ? requested : "public";
  const returnTo =
    typeof requestedReturnTo === "string" &&
    requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/guides/building-manager";
  const response = NextResponse.redirect(
    new URL(returnTo, request.url),
    303
  );

  response.cookies.set(DEV_IDENTITY_COOKIE, visibility, {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return response;
}
