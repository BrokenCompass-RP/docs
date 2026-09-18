import "server-only";
import { draftRepository } from "./drafts.js";
import { createPublicationService } from "./publication-service.js";
import { versionRepository } from "./versions.js";

export const publicationService = createPublicationService({ drafts: draftRepository, versions: versionRepository });
