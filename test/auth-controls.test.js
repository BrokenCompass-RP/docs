import test from "node:test";
import assert from "node:assert/strict";
import { accountNavigationState, shouldShowViewAsControl } from "../lib/account-navigation.js";

const discordAuthorization = (identity) => ({
  identity,
  source: "discord",
  displayName: `${identity} account`
});

test("authenticated Administrator and Developer receive account and authoring controls", () => {
  for (const identity of ["administrator", "developer"]) {
    const state = accountNavigationState(discordAuthorization(identity));
    assert.equal(state.showDocumentManager, true);
    assert.equal(state.showLogout, true);
    assert.equal(state.showLogin, false);
  }
});

test("public visitors receive login without authenticated authoring controls", () => {
  const state = accountNavigationState({ identity: "public", source: "anonymous" });
  assert.equal(state.showLogin, true);
  assert.equal(state.showDocumentManager, false);
  assert.equal(state.showLogout, false);
});

test("account controls depend on actual identity and remain present during a lower projection", () => {
  const actualAuthorization = discordAuthorization("administrator");
  const projectedIdentity = "public";
  const state = accountNavigationState(actualAuthorization);
  assert.equal(projectedIdentity, "public");
  assert.equal(state.showDocumentManager, true);
  assert.equal(state.showLogout, true);
});

test("development identity exposes capability-gated authoring without fake account controls", () => {
  const developer = accountNavigationState({ identity: "developer", source: "development-simulator" });
  const publicView = accountNavigationState({ identity: "public", source: "development-simulator" });
  assert.equal(developer.showDocumentManager, true);
  assert.equal(developer.accountLabel, null);
  assert.equal(developer.showLogin, true);
  assert.equal(developer.showLogout, false);
  assert.equal(publicView.showDocumentManager, false);
  assert.equal(publicView.showLogout, false);
});

test("Discord session UI remains independent while the simulator controls capabilities", () => {
  assert.deepEqual(accountNavigationState({
    identity: "administrator",
    source: "development-simulator",
    discordSession: null
  }), {
    accountLabel: null,
    showDocumentManager: true,
    showLogin: true,
    showLogout: false
  });

  assert.deepEqual(accountNavigationState({
    identity: "public",
    source: "development-simulator",
    discordSession: { identity: "administrator", displayName: "Compass Admin" }
  }), {
    accountLabel: "Signed in as Compass Admin",
    showDocumentManager: false,
    showLogin: false,
    showLogout: true
  });
});

test("simulator instrumentation replaces the redundant View As control", () => {
  assert.equal(shouldShowViewAsControl({ identity: "developer", source: "development-simulator" }, "development"), false);
  assert.equal(shouldShowViewAsControl(discordAuthorization("developer"), "development"), false);
  assert.equal(shouldShowViewAsControl(discordAuthorization("developer"), "production"), true);
  assert.equal(shouldShowViewAsControl(discordAuthorization("administrator"), "production"), true);
  assert.equal(shouldShowViewAsControl({ identity: "public", source: "anonymous" }, "production"), true);
});
