import { VISIBILITIES } from "../lib/visibility-policy.js";

export function DevIdentitySwitcher({ identity, returnTo }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <aside className="identity-panel" aria-label="Development identity simulator">
      <div>
        <p className="eyebrow">Development only</p>
        <strong>Authorized view: {identity}</strong>
      </div>
      <form action="/api/dev-identity" method="post">
        <input type="hidden" name="returnTo" value={returnTo} />
        <label htmlFor="visibility">Preview identity</label>
        <select id="visibility" name="visibility" defaultValue={identity}>
          {VISIBILITIES.map((visibility) => (
            <option key={visibility} value={visibility}>
              {visibility}
            </option>
          ))}
        </select>
        <button type="submit">Switch view</button>
      </form>
    </aside>
  );
}
