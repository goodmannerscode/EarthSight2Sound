import { describe, expect, it } from "bun:test";
import { MAX_UPLOAD_BYTES } from "@es2s/shared";
import { buildWav } from "../src/audio";
import { runPipeline, PipelineError } from "../src/pipeline";
import type { PipelineDeps } from "../src/ports";

type Call = string;

const makeDeps = (overrides: Partial<PipelineDeps> = {}) => {
  const calls: Call[] = [];
  const deleted: string[] = [];
  const removed: string[] = [];

  const deps: PipelineDeps = {
    storage: {
      head: async (key) => {
        calls.push(`head:${key}`);
        return { contentLength: 1024, contentType: "image/jpeg" };
      },
      get: async (key) => {
        calls.push(`get:${key}`);
        return new Uint8Array([1, 2, 3]);
      },
      put: async (key) => {
        calls.push(`put:${key}`);
        return `https://cdn.example/${key}`;
      },
      delete: async (key) => {
        deleted.push(key);
      },
    },
    repo: {
      insert: async (item) => {
        calls.push("insert");
        return {
          id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
          image_url: item.imageUrl,
          audio_url: item.audioUrl,
          description: item.description,
          created_at: new Date(),
        };
      },
    },
    sonify: {
      run: async (_imagePath, outDir) => {
        calls.push("sonify");
        return `${outDir}/track.wav`;
      },
    },
    resize: {
      run: async () => {
        calls.push("resize");
        return { data: new Uint8Array([9, 9]), width: 512, height: 384 };
      },
    },
    temp: {
      write: async (name) => {
        calls.push(`temp.write:${name}`);
        return `/tmp/${name}`;
      },
      read: async () => {
        calls.push("temp.read");
        return buildWav(new Float32Array(16_000), 16_000);
      },
      remove: async (path) => {
        removed.push(path);
      },
      mkdir: async (name) => {
        calls.push(`temp.mkdir:${name}`);
        return `/tmp/${name}`;
      },
    },
    ...overrides,
  };

  return { deps, calls, deleted, removed };
};

const input = {
  key: "uploads/abc.jpg",
  description: "Aurora over the North Atlantic",
};

describe("runPipeline — happy path", () => {
  it("returns the created feed item", async () => {
    const { deps } = makeDeps();
    const item = await runPipeline(deps, input);
    expect(item.description).toBe(input.description);
    expect(item.image_url).toContain("images/");
    expect(item.audio_url).toContain("audio/");
  });

  it("calls head before get", async () => {
    const { deps, calls } = makeDeps();
    await runPipeline(deps, input);
    expect(calls.indexOf(`head:${input.key}`)).toBeLessThan(
      calls.indexOf(`get:${input.key}`),
    );
  });

  it("uploads the audio before inserting the row", async () => {
    const { deps, calls } = makeDeps();
    await runPipeline(deps, input);
    const audioPut = calls.findIndex((call) => call.startsWith("put:audio/"));
    expect(audioPut).toBeGreaterThan(-1);
    expect(audioPut).toBeLessThan(calls.indexOf("insert"));
  });

  it("uploads the image before inserting the row", async () => {
    const { deps, calls } = makeDeps();
    await runPipeline(deps, input);
    const imagePut = calls.findIndex((call) => call.startsWith("put:images/"));
    expect(imagePut).toBeGreaterThan(-1);
    expect(imagePut).toBeLessThan(calls.indexOf("insert"));
  });

  it("resizes before sonifying", async () => {
    const { deps, calls } = makeDeps();
    await runPipeline(deps, input);
    expect(calls.indexOf("resize")).toBeLessThan(calls.indexOf("sonify"));
  });

  it("removes both temp files", async () => {
    const { deps, removed } = makeDeps();
    await runPipeline(deps, input);
    expect(removed).toHaveLength(2);
  });

  it("does not delete anything on success", async () => {
    const { deps, deleted } = makeDeps();
    await runPipeline(deps, input);
    expect(deleted).toHaveLength(0);
  });
});

describe("runPipeline — validation", () => {
  it("rejects an oversized object with 413 before downloading", async () => {
    const { deps, calls } = makeDeps({
      storage: {
        head: async () => ({
          contentLength: MAX_UPLOAD_BYTES + 1,
          contentType: "image/jpeg",
        }),
        get: async () => {
          calls.push("get");
          return new Uint8Array();
        },
        put: async () => "",
        delete: async () => {},
      },
    });

    await expect(runPipeline(deps, input)).rejects.toMatchObject({
      status: 413,
    });
    expect(calls).not.toContain("get");
  });

  it("rejects a disallowed mime type with 415 before downloading", async () => {
    const { deps, calls } = makeDeps({
      storage: {
        head: async () => ({
          contentLength: 1024,
          contentType: "image/gif",
        }),
        get: async () => {
          calls.push("get");
          return new Uint8Array();
        },
        put: async () => "",
        delete: async () => {},
      },
    });

    await expect(runPipeline(deps, input)).rejects.toMatchObject({
      status: 415,
    });
    expect(calls).not.toContain("get");
  });

  it("rejects an invalid description with 422 before downloading", async () => {
    const { deps, calls } = makeDeps();
    await expect(
      runPipeline(deps, { ...input, description: "   " }),
    ).rejects.toMatchObject({ status: 422 });
    expect(calls).not.toContain(`get:${input.key}`);
  });

  it("rejects a decompression bomb with 413", async () => {
    const { deps } = makeDeps({
      resize: {
        run: async () => ({
          data: new Uint8Array([1]),
          width: 50_000,
          height: 50_000,
        }),
      },
    });
    await expect(runPipeline(deps, input)).rejects.toMatchObject({
      status: 413,
    });
  });
});

describe("runPipeline — failure handling", () => {
  it("cleans up temp files when sonify throws", async () => {
    const { deps, removed } = makeDeps({
      sonify: {
        run: async () => {
          throw new Error("sonifier exploded");
        },
      },
    });

    await expect(runPipeline(deps, input)).rejects.toThrow("sonifier exploded");
    expect(removed).toHaveLength(2);
  });

  it("deletes the uploaded audio when insert fails", async () => {
    const { deps, deleted } = makeDeps({
      repo: {
        insert: async () => {
          throw new Error("db down");
        },
      },
    });

    await expect(runPipeline(deps, input)).rejects.toThrow("db down");
    expect(deleted).toHaveLength(1);
    expect(deleted[0]).toStartWith("audio/");
  });

  it("cleans up temp files when insert fails", async () => {
    const { deps, removed } = makeDeps({
      repo: {
        insert: async () => {
          throw new Error("db down");
        },
      },
    });

    await expect(runPipeline(deps, input)).rejects.toThrow("db down");
    expect(removed).toHaveLength(2);
  });

  it("wraps unknown errors in a PipelineError", async () => {
    const { deps } = makeDeps({
      storage: {
        head: async () => {
          throw new Error("network");
        },
        get: async () => new Uint8Array(),
        put: async () => "",
        delete: async () => {},
      },
    });

    const error = await runPipeline(deps, input).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(PipelineError);
  });
});
