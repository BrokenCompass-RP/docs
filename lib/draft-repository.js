import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export class FileDraftRepository {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
  }

  draftPath(slug) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Invalid document slug");
    return path.join(this.rootDirectory, `${slug}.md`);
  }

  async read(slug) {
    try {
      return await readFile(this.draftPath(slug), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async save(slug, source) {
    await mkdir(this.rootDirectory, { recursive: true });
    const target = this.draftPath(slug);
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, source, "utf8");
    await rename(temporary, target);
  }

  async discard(slug) {
    await rm(this.draftPath(slug), { force: true });
  }
}
