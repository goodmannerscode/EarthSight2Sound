import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createR2Adapter } from "./adapters/r2";
import { createResizeAdapter } from "./adapters/resize";
import { createSonifyAdapter } from "./adapters/sonify";
import { createTempAdapter } from "./adapters/temp";
import { getConfig } from "./config";
import { createDatabase } from "./db/client";
import { createFeedRepo, createJobRepo } from "./db/queries";
import { PipelineError, runPipeline } from "./pipeline";
import { createJobQueue } from "./queue";
import { createFeedRoute } from "./routes/feed";
import { createStatusRoute } from "./routes/status";
import { createUploadRoute } from "./routes/upload";

export const createApp = () => {
  const config = getConfig();
  const { db } = createDatabase(config.DATABASE_URL);

  const feedRepo = createFeedRepo(db);
  const jobRepo = createJobRepo(db);

  const storage = createR2Adapter({
    accountId: config.R2_ACCOUNT_ID,
    bucket: config.R2_BUCKET,
    endpoint: config.R2_ENDPOINT,
    publicBaseUrl: config.R2_PUBLIC_BASE_URL,
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  });

  const queue = createJobQueue({
    handler: async ({ jobId, key, description }) => {
      const item = await runPipeline(
        {
          storage,
          repo: feedRepo,
          sonify: createSonifyAdapter({
            bin: config.IMAGE2SOUND_BIN,
            timeoutMs: config.IMAGE2SOUND_TIMEOUT_MS,
          }),
          resize: createResizeAdapter(),
          temp: createTempAdapter(),
        },
        { key, description },
      );
      await jobRepo.markDone(jobId, item.id);
    },
    onStatus: (jobId, status) => jobRepo.markProcessing(jobId).then(() => undefined),
    onError: (jobId, error) => jobRepo.markFailed(jobId, error),
  });

  const app = new Hono();

  app.use("*", logger());
  app.use(
    "/api/*",
    cors({
      origin: (origin) => origin ?? "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" as const }));

  app.post(
    "/api/upload",
    createUploadRoute({ queue, createJob: () => jobRepo.create() }),
  );
  app.get("/api/status/:job_id", createStatusRoute({ jobs: jobRepo }));
  app.get("/api/feed", createFeedRoute({ feed: feedRepo }));

  app.onError((cause, c) => {
    if (cause instanceof PipelineError) {
      return c.json({ error: cause.message }, cause.status as 400);
    }
    console.error("[api] unhandled error", cause);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
};
