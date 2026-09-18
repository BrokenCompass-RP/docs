import "server-only";
import path from "node:path";
import { FileVersionRepository } from "./version-repository.js";

export const versionRepository = new FileVersionRepository(path.join(process.cwd(), ".published"));
