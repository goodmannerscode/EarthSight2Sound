import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import type { FeedItem } from "@es2s/shared";
import type { JobRepo } from "../src/db/queries";
import { createFeedRoute } from "../src/routes/feed";
import { createStatusRoute } from "../src/routes/status";

const item: FeedItem = {
  id: "11111111-1111-4111-8111-111111111111",
  image_url: "https://cdn.example.com/images/a.jpg",
  audio_url: "https://cdn.example.com/audio/a.wav",
  description: "Amazon basin at dusk",
  created_at: new Date("2026-01-01T00:00:00Z"),
};

const makeJobRepo = (overrides: Partial<JobRepo> = {}): JobRepo => ({
  create: async () => "22222222-2222-4222-8222-222222222222",
  markProcessing: async () => {},
  markDone: async () => {},
  markFailed: async () => {},
  find: async () => null,
  ...overrides,
});

describe("GET /api/feed", () => {
  it("returns items and total", async () => {
    const app = new Hono();
    app.get(
      "/api/feed",
      createFeedRoute({ feed: { list: async () => ({ items: [item], total: 1 }) } }),
    );

    const res = await app.request("/api/feed");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ total: 1 });
  });

  it("defaults to page 1 and pageSize 20", async () => {
    const calls: Array<[number, number]> = [];
    const app = new Hono();
    app.get(
      "/api/feed",
      createFeedRoute({
        feed: {
          list: async (page, pageSize) => {
            calls.push([page, pageSize]);
            return { items: [], total: 0 };
          },
        },
      }),
    );

    await app.request("/api/feed");
    expect(calls).toEqual([[1, 20]]);
  });

  it("rejects a pageSize above the maximum with 422", async () => {
    const app = new Hono();
    app.get(
      "/api/feed",
      createFeedRoute({ feed: { list: async () => ({ items: [], total: 0 }) } }),
    );

    const res = await app.request("/api/feed?pageSize=500");
    expect(res.status).toBe(422);
  });
});

describe("GET /api/status/:job_id", () => {
  it("returns 404 for an unknown job", async () => {
    const app = new Hono();
    app.get("/api/status/:job_id", createStatusRoute({ jobs: makeJobRepo() }));

    const res = await app.request("/api/status/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns the job status and feed item", async () => {
    const app = new Hono();
    app.get(
      "/api/status/:job_id",
      createStatusRoute({
        jobs: makeJobRepo({
          find: async () => ({
            id: "abc",
            status: "done",
            error: null,
            feedItem: item,
          }),
        }),
      }),
    );

    const res = await app.request("/api/status/abc");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      status: "done",
      error: null,
      feedItem: { id: item.id },
    });
  });

  it("surfaces the failure message", async () => {
    const app = new Hono();
    app.get(
      "/api/status/:job_id",
      createStatusRoute({
        jobs: makeJobRepo({
          find: async () => ({
            id: "abc",
            status: "failed",
            error: "image2sound exited with code 1",
            feedItem: null,
          }),
        }),
      }),
    );

    const res = await app.request("/api/status/abc");
    expect(await res.json()).toMatchObject({
      status: "failed",
      error: "image2sound exited with code 1",
    });
  });
});
