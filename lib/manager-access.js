import "server-only";
import { CAPABILITIES, hasCapability } from "./capability-policy.js";
import { getRequestAuthorization } from "./request-authorization.js";

export async function getManagerAuthorization() {
  const authorization = await getRequestAuthorization();
  return hasCapability(authorization.identity, CAPABILITIES.MANAGE_DOCUMENTS) ? authorization : null;
}

export async function getManagerIdentity() {
  return (await getManagerAuthorization())?.identity ?? null;
}
