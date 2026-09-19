import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const digest = (content) => createHash("sha256").update(content).digest("hex");
const readJson = async (filename) => JSON.parse(await readFile(filename, "utf8"));

export class FileVersionRepository {
  constructor(root, options = {}) {
    this.root = root;
    this.clock = options.clock ?? (() => new Date());
    this.beforePointerUpdate = options.beforePointerUpdate;
  }

  directory(slug) { return path.join(this.root, slug); }
  manifestPath(slug) { return path.join(this.directory(slug), "manifest.json"); }
  versionPath(slug, number) { return path.join(this.directory(slug), "versions", `v${String(number).padStart(6, "0")}.json`); }

  async atomicJson(filename, value) {
    await mkdir(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporary, filename);
  }

  async manifest(slug) {
    try { return await readJson(this.manifestPath(slug)); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  }

  async ensureInitialized(slug, canonicalMarkdown) {
    const existing = await this.manifest(slug);
    if (existing) return this.getCurrent(slug);
    return this.publish(slug, canonicalMarkdown, { publishedBy: "system-seed", publicationKind: "initial" });
  }

  async publish(slug, canonicalMarkdown, options = {}) {
    const manifest = await this.manifest(slug);
    const versionNumber = (manifest?.latestVersionNumber ?? 0) + 1;
    const publishedAt = this.clock().toISOString();
    const publicationKind = options.publicationKind ?? "publish";
    const firstPublished = manifest
      ? manifest.firstPublished
      : (publicationKind === "initial" ? null : (options.firstPublished ?? publishedAt));
    const versionId = `v${String(versionNumber).padStart(6, "0")}`;
    const version = Object.freeze({
      documentId: slug, versionId, versionNumber, firstPublished, publishedAt,
      publishedBy: options.publishedBy ?? "unknown",
      publicationKind,
      ...(publicationKind === "initial" ? { importedAt: publishedAt, firstPublishedKnown: false } : { firstPublishedKnown: firstPublished !== null }),
      ...(options.recoveredFromVersion ? { recoveredFromVersion: options.recoveredFromVersion } : {}),
      contentHash: digest(canonicalMarkdown), canonicalMarkdown
    });
    const versionFile = this.versionPath(slug, versionNumber);
    await this.atomicJson(versionFile, version);
    try {
      if (this.beforePointerUpdate) await this.beforePointerUpdate(version);
      await this.atomicJson(this.manifestPath(slug), {
        documentId: slug, currentVersionId: versionId, latestVersionNumber: versionNumber,
        firstPublished, lastUpdated: publishedAt
      });
    } catch (error) {
      await rm(versionFile, { force: true });
      throw error;
    }
    return version;
  }

  async getCurrent(slug) {
    const manifest = await this.manifest(slug);
    return manifest ? this.getVersion(slug, manifest.currentVersionId) : null;
  }

  async getVersion(slug, versionId) {
    const match = /^v(\d{6})$/.exec(versionId ?? "");
    if (!match) return null;
    try { return await readJson(this.versionPath(slug, Number(match[1]))); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  }

  async listVersions(slug) {
    const manifest = await this.manifest(slug);
    if (!manifest) return [];
    const versions = [];
    for (let number = manifest.latestVersionNumber; number >= 1; number -= 1) {
      const version = await this.getVersion(slug, `v${String(number).padStart(6, "0")}`);
      if (version) versions.push(version);
    }
    return versions;
  }

  async recover(slug, versionId, options = {}) {
    const historical = await this.getVersion(slug, versionId);
    if (!historical) throw new Error(`Unknown version: ${versionId}`);
    return this.publish(slug, historical.canonicalMarkdown, {
      publishedBy: options.publishedBy, publicationKind: "recovery", recoveredFromVersion: versionId
    });
  }
}
