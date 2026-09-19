import { parseCanonicalMarkdown } from "./access-markdown.js";
import { CAPABILITIES, hasCapability } from "./capability-policy.js";

export function createPublicationService({ drafts, versions }) {
  return {
    async publishDraft(slug, identity) {
      if (!hasCapability(identity, CAPABILITIES.PUBLISH)) throw new Error("Publishing is not authorized");
      if (typeof versions.publishDraftTransaction === "function") {
        return versions.publishDraftTransaction(slug, identity, parseCanonicalMarkdown);
      }
      const source = await drafts.read(slug);
      if (source === null) throw new Error("There is no saved draft to publish");
      parseCanonicalMarkdown(source);
      const version = await versions.publish(slug, source, { publishedBy: identity });
      await drafts.discard(slug);
      return version;
    },

    async recoverVersion(slug, versionId, identity) {
      if (!hasCapability(identity, CAPABILITIES.PUBLISH)) throw new Error("Recovery is not authorized");
      const historical = await versions.getVersion(slug, versionId);
      if (!historical) throw new Error("Published version not found");
      parseCanonicalMarkdown(historical.canonicalMarkdown);
      return versions.recover(slug, versionId, { publishedBy: identity });
    }
  };
}
