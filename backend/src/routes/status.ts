import type { Context } from "hono";
import type { JobRepo } from "../db/queries";

export type StatusDeps = {
  jobs: JobRepo;
};

export const createStatusRoute = (deps: StatusDeps) => async (c: Context) => {
  const jobId = c.req.param("job_id");
  if (!jobId) {
    return c.json({ error: "Missing job id" }, 400);
  }

  const job = await deps.jobs.find(jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json({
    status: job.status,
    error: job.error,
    feedItem: job.feedItem,
  });
};
