import { CAPABILITIES, hasCapability } from "./capability-policy.js";

export function accountNavigationState(authorization) {
  const canManageDocuments = hasCapability(authorization.identity, CAPABILITIES.MANAGE_DOCUMENTS);
  const discordSession = authorization.source === "discord" ? authorization : authorization.discordSession;
  if (discordSession) return {
    accountLabel: `Signed in as ${discordSession.displayName ?? discordSession.username ?? "Discord member"}`,
    showDocumentManager: canManageDocuments,
    showLogin: false,
    showLogout: true
  };
  if (authorization.source === "development-simulator") return {
    accountLabel: null,
    showDocumentManager: canManageDocuments,
    showLogin: true,
    showLogout: false
  };
  return { accountLabel: null, showDocumentManager: false, showLogin: true, showLogout: false };
}

export function shouldShowViewAsControl(authorization, nodeEnvironment) {
  return nodeEnvironment !== "development" && authorization.source !== "development-simulator";
}
