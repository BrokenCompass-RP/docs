export const VISIBILITIES = [
  "public",
  "moderator",
  "developer",
  "administrator"
];

export const DEV_IDENTITY_COOKIE = "bcrp_dev_identity";

// Named grants make the cumulative policy explicit without numeric privilege comparisons.
export const VISIBILITY_GRANTS = Object.freeze({
  public: new Set(["public"]),
  moderator: new Set(["public", "moderator"]),
  developer: new Set(["public", "moderator", "developer"]),
  administrator: new Set([
    "public",
    "moderator",
    "developer",
    "administrator"
  ])
});

export function isVisibility(value) {
  return typeof value === "string" && VISIBILITIES.includes(value);
}

export function canView(identity, visibility) {
  if (!isVisibility(identity) || !isVisibility(visibility)) return false;
  return VISIBILITY_GRANTS[identity].has(visibility);
}
