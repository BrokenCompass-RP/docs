import "server-only";
import { cookies } from "next/headers";
import {
  DEV_IDENTITY_COOKIE,
  isVisibility
} from "./visibility-policy.js";

export async function getDevelopmentIdentity() {
  // Production builds have no identity override path: the cookie is never read and
  // every unauthenticated request is unconditionally projected as public.
  if (process.env.NODE_ENV !== "development") return "public";

  const cookieStore = await cookies();
  const value = cookieStore.get(DEV_IDENTITY_COOKIE)?.value;
  return isVisibility(value) ? value : "public";
}
