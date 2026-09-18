const PROJECTIONS = Object.freeze({
  public: Object.freeze(["public"]),
  moderator: Object.freeze(["moderator"]),
  developer: Object.freeze(["public", "moderator", "developer"]),
  administrator: Object.freeze(["public", "moderator", "developer", "administrator"])
});

export function availableViewAs(identity) {
  return PROJECTIONS[identity] ?? Object.freeze([]);
}

export function resolveProjectionIdentity(identity, requested) {
  return availableViewAs(identity).includes(requested) ? requested : identity;
}
