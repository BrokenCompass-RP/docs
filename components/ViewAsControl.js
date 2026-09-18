import { availableViewAs } from "../lib/view-as-policy.js";

const LABELS = { public: "Public", moderator: "Moderator", developer: "Developer", administrator: "Administrator" };

export function ViewAsControl({ identity, projection, returnTo }) {
  const options = availableViewAs(identity);
  if (options.length < 2) return null;
  return (
    <aside className="view-as-panel">
      <form action={returnTo} method="get">
        <label htmlFor="view-as">View as</label>
        <select id="view-as" name="viewAs" defaultValue={projection}>
          {options.map((value) => <option value={value} key={value}>{LABELS[value]}</option>)}
        </select>
        <button type="submit">Apply projection</button>
      </form>
      <small>You remain signed in as {LABELS[identity]}. Authoring capabilities are unchanged.</small>
    </aside>
  );
}
