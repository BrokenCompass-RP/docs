import "server-only";
import { cookies } from "next/headers";
import { DEV_IDENTITY_COOKIE, isVisibility } from "./visibility-policy.js";
import { getAuthRepository } from "./auth-store.js";

export const AUTH_SESSION_COOKIE = "bcrp_auth_session";

export async function getRequestAuthorization() {
  const cookieStore = await cookies();
  if (process.env.NODE_ENV === "development") {
    const simulated = cookieStore.get(DEV_IDENTITY_COOKIE)?.value;
    if (isVisibility(simulated)) return { identity: simulated, actorId: `development:${simulated}`, source: "development-simulator" };
  }
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return { identity: "public", actorId: null, source: "anonymous" };
  try {
    const session = await getAuthRepository().findSession(token);
    return session ? { ...session, source: "discord" } : { identity: "public", actorId: null, source: "anonymous" };
  } catch {
    return { identity: "public", actorId: null, source: "authorization-unavailable" };
  }
}
