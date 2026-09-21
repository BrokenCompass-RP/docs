import Link from "next/link";
import { accountNavigationState } from "../lib/account-navigation.js";

export function AuthControls({ authorization }) {
  const state = accountNavigationState(authorization);
  if (state.showLogin && !state.showDocumentManager) return <a className="auth-login" href="/api/auth/discord/login">Log in with Discord</a>;
  return <div className="auth-controls">
    {state.showDocumentManager ? <Link className="admin-link" href="/manager">Document Manager</Link> : null}
    {state.accountLabel ? <span>{state.accountLabel}</span> : null}
    {state.showLogin ? <a href="/api/auth/discord/login">Log in with Discord</a> : null}
    {state.showLogout ? <form action="/api/auth/logout" method="post"><button type="submit">Log out</button></form> : null}
  </div>;
}
