import "server-only";
import { cookies } from "next/headers";
import { DEV_IDENTITY_COOKIE, isVisibility } from "./visibility-policy.js";
import { getAuthRepository } from "./auth-store.js";

export const AUTH_SESSION_COOKIE = "bcrp_auth_session";

export async function getRequestAuthorization() {
  const cookieStore = await cookies();
  let simulatedIdentity = null;
  if (process.env.NODE_ENV === "development") {
    const simulated = cookieStore.get(DEV_IDENTITY_COOKIE)?.value;
    if (isVisibility(simulated)) simulatedIdentity = simulated;
  }
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  let discordSession = null;
  let discordSource = "anonymous";
  try {
    if (token) discordSession = await getAuthRepository().findSession(token);
    if (discordSession) discordSource = "discord";
  } catch {
    discordSource = "authorization-unavailable";
  }

  if (simulatedIdentity) return { identity: simulatedIdentity, actorId: `development:${simulatedIdentity}`, source: "development-simulator", discordSession };
  if (discordSession) return { ...discordSession, source: "discord", discordSession };
  return { identity: "public", actorId: null, source: discordSource, discordSession: null };
}
