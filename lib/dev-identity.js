import "server-only";
import { getRequestAuthorization } from "./request-authorization.js";

export async function getDevelopmentIdentity() {
  return (await getRequestAuthorization()).identity;
}
