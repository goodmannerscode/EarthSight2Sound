import { randomUUID } from "node:crypto";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  UploadSchema,
} from "@es2s/shared";
import type { Context } from "hono";
import type { JobQueue } from "../queue";

export type UploadDeps = {
  queue: JobQueue;
  createJob: () => Promise<string>;
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const errorBody = (error: string) => ({ error });

export const createUploadRoute = (deps: UploadDeps) => async (c: Context) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json(errorBody("Expected multipart/form-data"), 400);
  }

  const file = form.get("file");
  const description = form.get("description");

  if (!(file instanceof File)) {
    return c.json(errorBody("Missing `file` field"), 422);
  }
  if (typeof description !== "string") {
    return c.json(errorBody("Missing `description` field"), 422);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return c.json(
      errorBody(`File must be at most ${MAX_UPLOAD_BYTES} bytes`),
      413,
    );
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as never)) {
    return c.json(
      errorBody(`Unsupported type: ${file.type || "unknown"}`),
      415,
    );
  }

  const parsed = UploadSchema.safeParse({
    description,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!parsed.success) {
    return c.json(
      errorBody(parsed.error.issues[0]?.message ?? "Invalid upload"),
      422,
    );
  }

  const jobId = await deps.createJob();
  const extension = IMAGE_EXTENSIONS[parsed.data.mimeType] ?? "bin";
  const key = `uploads/${jobId}/${randomUUID()}.${extension}`;

  await deps.queue.enqueue({
    jobId,
    key,
    description: parsed.data.description,
  });

  return c.json({ job_id: jobId, status: "queued" as const }, 201);
};
