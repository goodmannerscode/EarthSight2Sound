import { describe, expect, it } from "bun:test";
import { createJobQueue, type JobPayload } from "../src/queue";

const payload = (jobId: string): JobPayload => ({
  jobId,
  key: `uploads/${jobId}/a.jpg`,
  description: "test",
});

describe("createJobQueue", () => {
  it("runs jobs one at a time in FIFO order", async () => {
    const order: string[] = [];
    let active = 0;
    let maxActive = 0;

    const queue = createJobQueue({
      handler: async ({ jobId }) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await Bun.sleep(5);
        order.push(jobId);
        active -= 1;
      },
      onStatus: async () => {},
      onError: async () => {},
    });

    await queue.enqueue(payload("a"));
    await queue.enqueue(payload("b"));
    await queue.enqueue(payload("c"));
    await queue.drain();

    expect(order).toEqual(["a", "b", "c"]);
    expect(maxActive).toBe(1);
  });

  it("marks a job processing before running it", async () => {
    const events: string[] = [];
    const queue = createJobQueue({
      handler: async ({ jobId }) => {
        events.push(`run:${jobId}`);
      },
      onStatus: async (jobId, status) => {
        events.push(`${status}:${jobId}`);
      },
      onError: async () => {},
    });

    await queue.enqueue(payload("a"));
    await queue.drain();

    expect(events).toEqual(["processing:a", "run:a"]);
  });

  it("reports a failure without stopping the queue", async () => {
    const failures: string[] = [];
    const done: string[] = [];

    const queue = createJobQueue({
      handler: async ({ jobId }) => {
        if (jobId === "bad") throw new Error("boom");
        done.push(jobId);
      },
      onStatus: async () => {},
      onError: async (jobId, error) => {
        failures.push(`${jobId}:${error}`);
      },
    });

    await queue.enqueue(payload("bad"));
    await queue.enqueue(payload("good"));
    await queue.drain();

    expect(failures).toEqual(["bad:boom"]);
    expect(done).toEqual(["good"]);
  });
});
