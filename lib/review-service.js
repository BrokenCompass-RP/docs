import { CAPABILITIES, hasCapability } from "./capability-policy.js";

export const REVIEW_REASONS = Object.freeze(["outdated", "incorrect", "unclear", "missing-information", "something-else"]);

function boundedText(value, label, maximum) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  const text = value.trim();
  if (text.length > maximum) throw new Error(`${label} must be ${maximum} characters or fewer`);
  return text;
}

export function createReviewService({ repository }) {
  return {
    async createFlag(input, identity, actorId = identity === "public" ? null : identity) {
      if (!hasCapability(identity, CAPABILITIES.FLAG)) throw new Error("Flagging is not authorized");
      if (!REVIEW_REASONS.includes(input.reason)) throw new Error("Reason is required");
      return repository.createFlag({
        ...input,
        initialComment: boundedText(input.initialComment, "Comment", 1000),
        reporterIdentity: actorId
      });
    },

    async list(slug, identity) {
      if (!hasCapability(identity, CAPABILITIES.MANAGE_REVIEWS)) throw new Error("Review access is not authorized");
      return repository.listForDocument(slug);
    },

    async addComment(slug, flagId, body, identity, actorId = identity) {
      if (!hasCapability(identity, CAPABILITIES.MANAGE_REVIEWS)) throw new Error("Review access is not authorized");
      return repository.addComment(slug, flagId, actorId, boundedText(body, "Comment", 2000));
    },

    async resolve(slug, flagId, identity, versionAtResolution, actorId = identity) {
      if (!hasCapability(identity, CAPABILITIES.MANAGE_REVIEWS)) throw new Error("Review access is not authorized");
      return repository.resolve(slug, flagId, actorId, versionAtResolution);
    }
  };
}
