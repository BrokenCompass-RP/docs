export function AuthControls({ authorization }) {
  if (authorization.source === "discord") return <form className="auth-controls" action="/api/auth/logout" method="post"><span>Signed in as {authorization.displayName ?? authorization.username ?? "Discord member"}</span><button type="submit">Log out</button></form>;
  if (authorization.source === "development-simulator") return null;
  return <a className="auth-login" href="/api/auth/discord/login">Log in with Discord</a>;
}
