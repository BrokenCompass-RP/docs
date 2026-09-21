import { NextResponse } from "next/server";
import { getAuthRepository } from "../../../../lib/auth-store.js";
import { AUTH_SESSION_COOKIE } from "../../../../lib/request-authorization.js";
import { applicationUrl } from "../../../../lib/application-url.js";

export async function POST(request) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  try { await getAuthRepository().revokeSession(token); } catch {}
  const response = NextResponse.redirect(applicationUrl("/", request.url), 303);
  response.cookies.delete(AUTH_SESSION_COOKIE);
  return response;
}
