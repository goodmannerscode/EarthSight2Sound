import type { JobStatus } from "@es2s/shared";

export type JobPayload = {
  jobId: string;
  key: string;
  description: string;
};

export type JobHandler = (payload: JobPayload) => Promise<void>;

export type JobQueue = {
  enqueue(payload: JobPayload): Promise<void>;
  /** Resolves once the in-flight job (if any) settles. Used by tests. */
  drain(): Promise<void>;
};

export type QueueOptions = {
  handler: JobHandler;
  onStatus: (jobId: string, status: JobStatus) => Promise<void>;
  onError: (jobId: string, error: string) => Promise<void>;
};

/**
 * In-process FIFO queue with concurrency 1.
 *
 * Deliberately dependency-free: the pipeline is already serialised by the
 * single worker, and a SQLite-backed queue would add a second source of truth
 * for job state that already lives in MariaDB.
 */
export const createJobQueue = (options: QueueOptions): JobQueue => {
  const pending: JobPayload[] = [];
  let running: Promise<void> | null = null;

  const runOne = async (payload: JobPayload): Promise<void> => {
    try {
      await options.onStatus(payload.jobId, "processing");
      await options.handler(payload);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      await options.onError(payload.jobId, message);
    }
  };

  const pump = (): void => {
    if (running) return;

    running = (async () => {
      while (pending.length > 0) {
        const next = pending.shift();
        if (next) await runOne(next);
      }
      running = null;
    })();
  };

  return {
    async enqueue(payload) {
      pending.push(payload);
      pump();
    },

    async drain() {
      while (running) await running;
    },
  };
};
