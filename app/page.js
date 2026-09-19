import Link from "next/link";
import { AuthControls } from "../components/AuthControls.js";
import { getRequestAuthorization } from "../lib/request-authorization.js";

export default async function HomePage() {
  const authorization = await getRequestAuthorization();
  return (
    <main className="shell landing">
      <p className="eyebrow">Broken Compass knowledge</p>
      <h1>Find your way.</h1>
      <p className="lede">
        This checkpoint proves one canonical guide can produce safe, role-aware
        views without sending restricted material to unauthorized readers.
      </p>
      <div className="home-actions">
        <Link className="primary-link" href="/search">Search knowledge</Link>
        <Link className="secondary-link" href="/guides/building-manager">Open the Building Manager guide</Link>
      </div>
      <AuthControls authorization={authorization} />
    </main>
  );
}
