import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createDiscordClient } from "../../../../../lib/discord-client.js";
import { loadDiscordConfig } from "../../../../../lib/discord-authorization.js";
import { applicationUrl } from "../../../../../lib/application-url.js";

export async function GET(request) {
  try {
    const config = loadDiscordConfig();
    const state = randomBytes(24).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const response = NextResponse.redirect(createDiscordClient().authorizationUrl(config, state, challenge));
    response.cookies.set("bcrp_oauth_attempt", Buffer.from(JSON.stringify({ state, verifier })).toString("base64url"), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/discord", maxAge: 10 * 60 });
    return response;
  } catch {
    return NextResponse.redirect(applicationUrl("/?auth_error=discord_unavailable", request.url));
  }
}
