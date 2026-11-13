import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import type { TempPort } from "../ports";

const WORK_DIR = join(tmpdir(), "es2s");

const ensureWorkDir = async (): Promise<void> => {
  await mkdir(WORK_DIR, { recursive: true });
};

/** Real filesystem temp port. Every path lives under one per-process directory. */
export const createTempAdapter = (): TempPort => ({
  async write(name, data) {
    await ensureWorkDir();
    const ext = extname(name) || ".bin";
    const path = join(WORK_DIR, `${randomUUID()}${ext}`);
    await writeFile(path, data);
    return path;
  },

  async read(path) {
    return new Uint8Array(await readFile(path));
  },

  async remove(path) {
    await rm(path, { force: true, recursive: true });
  },

  async mkdir(name) {
    await ensureWorkDir();
    const path = join(WORK_DIR, `${randomUUID()}-${name}`);
    await mkdir(path, { recursive: true });
    return path;
  },
});
