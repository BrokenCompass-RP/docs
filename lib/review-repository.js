import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const readJson = async (filename) => JSON.parse(await readFile(filename, "utf8"));

export class FileReviewRepository {
  constructor(root, options = {}) {
    this.root = root;
    this.clock = options.clock ?? (() => new Date());
    this.id = options.id ?? randomUUID;
  }

  flagDirectory(slug, flagId) { return path.join(this.root, slug, flagId); }

  async writeImmutable(filename, value) {
    await mkdir(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporary, filename);
  }

  async createFlag(input) {
    const flagId = `flag-${this.id()}`;
    const flag = Object.freeze({
      flagId, documentId: input.documentId, sectionId: input.sectionId ?? null,
      sectionHeading: input.sectionHeading ?? null, reason: input.reason,
      initialComment: input.initialComment, reporterIdentity: input.reporterIdentity ?? null,
      createdAt: this.clock().toISOString(), versionAtReport: input.versionAtReport,
      status: "open"
    });
    await this.writeImmutable(path.join(this.flagDirectory(input.documentId, flagId), "flag.json"), flag);
    return flag;
  }

  async getFlag(slug, flagId) {
    try {
      const base = await readJson(path.join(this.flagDirectory(slug, flagId), "flag.json"));
      const commentsDirectory = path.join(this.flagDirectory(slug, flagId), "comments");
      let commentFiles = [];
      try { commentFiles = await readdir(commentsDirectory); } catch (error) { if (error.code !== "ENOENT") throw error; }
      const comments = await Promise.all(commentFiles.filter((name) => name.endsWith(".json")).map((name) => readJson(path.join(commentsDirectory, name))));
      comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      let resolution = null;
      try { resolution = await readJson(path.join(this.flagDirectory(slug, flagId), "resolution.json")); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      return { ...base, status: resolution ? "resolved" : "open", comments, resolution };
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async listForDocument(slug) {
    let ids = [];
    try { ids = await readdir(path.join(this.root, slug)); } catch (error) { if (error.code === "ENOENT") return []; throw error; }
    const flags = (await Promise.all(ids.map((id) => this.getFlag(slug, id)))).filter(Boolean);
    return flags.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addComment(slug, flagId, authorIdentity, body) {
    if (!(await this.getFlag(slug, flagId))) throw new Error("Flag not found");
    const commentId = `comment-${this.id()}`;
    const comment = Object.freeze({ commentId, authorIdentity, body, createdAt: this.clock().toISOString() });
    await this.writeImmutable(path.join(this.flagDirectory(slug, flagId), "comments", `${commentId}.json`), comment);
    return comment;
  }

  async resolve(slug, flagId, resolvedBy, versionAtResolution) {
    const flag = await this.getFlag(slug, flagId);
    if (!flag) throw new Error("Flag not found");
    if (flag.status === "resolved") throw new Error("Flag is already resolved");
    const resolution = Object.freeze({ resolvedAt: this.clock().toISOString(), resolvedBy, versionAtResolution });
    await this.writeImmutable(path.join(this.flagDirectory(slug, flagId), "resolution.json"), resolution);
    return { ...flag, status: "resolved", resolution };
  }
}
