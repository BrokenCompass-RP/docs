import "server-only";
import { CAPABILITIES, hasCapability } from "./capability-policy.js";
import { getDevelopmentIdentity } from "./dev-identity.js";

export async function getManagerIdentity() {
  if (process.env.NODE_ENV !== "development") return null;
  const identity = await getDevelopmentIdentity();
  return hasCapability(identity, CAPABILITIES.MANAGE_DOCUMENTS) ? identity : null;
}
