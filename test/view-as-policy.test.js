import test from "node:test";
import assert from "node:assert/strict";
import { availableViewAs, resolveProjectionIdentity } from "../lib/view-as-policy.js";
import { CAPABILITIES, hasCapability } from "../lib/capability-policy.js";

test("view-as choices are explicit and cannot escalate", () => {
  assert.deepEqual(availableViewAs("developer"), ["public", "moderator", "developer"]);
  assert.deepEqual(availableViewAs("administrator"), ["public", "moderator", "developer", "administrator"]);
  assert.deepEqual(availableViewAs("moderator"), ["moderator"]);
  assert.equal(resolveProjectionIdentity("developer", "administrator"), "developer");
  assert.equal(resolveProjectionIdentity("public", "developer"), "public");
});

test("viewing a lower projection does not change actual capabilities", () => {
  const projection = resolveProjectionIdentity("developer", "public");
  assert.equal(projection, "public");
  assert.equal(hasCapability("developer", CAPABILITIES.PUBLISH), true);
  assert.equal(hasCapability("developer", CAPABILITIES.MANAGE_REVIEWS), true);
  assert.equal(hasCapability(projection, CAPABILITIES.MANAGE_REVIEWS), false);
});
