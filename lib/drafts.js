import "server-only";
import path from "node:path";
import { FileDraftRepository } from "./draft-repository.js";

export const draftRepository = new FileDraftRepository(
  path.join(process.cwd(), ".drafts")
);
