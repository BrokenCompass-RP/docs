import test from "node:test";
import assert from "node:assert/strict";
import { CAPABILITIES, hasCapability } from "../lib/capability-policy.js";

test("only Developer and Administrator receive document-management capability", () => {
  assert.equal(hasCapability("public", CAPABILITIES.MANAGE_DOCUMENTS), false);
  assert.equal(hasCapability("moderator", CAPABILITIES.MANAGE_DOCUMENTS), false);
  assert.equal(hasCapability("developer", CAPABILITIES.MANAGE_DOCUMENTS), true);
  assert.equal(hasCapability("administrator", CAPABILITIES.MANAGE_DOCUMENTS), true);
});

test("read visibility does not imply edit capability", () => {
  assert.equal(hasCapability("moderator", CAPABILITIES.READ), true);
  assert.equal(hasCapability("moderator", CAPABILITIES.MANAGE_DOCUMENTS), false);
});
