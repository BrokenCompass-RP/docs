import { NextResponse } from "next/server";
import { getAuthRepository } from "../../../../lib/auth-store.js";
import { AUTH_SESSION_COOKIE } from "../../../../lib/request-authorization.js";

export async function POST(request) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  try { await getAuthRepository().revokeSession(token); } catch {}
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.delete(AUTH_SESSION_COOKIE);
  return response;
}
