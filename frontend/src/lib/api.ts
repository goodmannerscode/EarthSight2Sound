import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@es2s/shared";

export const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:3001";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const readError = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
};

export const uploadImage = async (
  file: File,
  description: string,
): Promise<{ job_id: string; status: "queued" }> => {
  const form = new FormData();
  form.append("file", file);
  form.append("description", description);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  return (await response.json()) as { job_id: string; status: "queued" };
};

export const getJobStatus = async (
  jobId: string,
): Promise<{ status: string; error: string | null; feedItem: unknown }> => {
  const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  return (await response.json()) as {
    status: string;
    error: string | null;
    feedItem: unknown;
  };
};

export const isAllowedImage = (file: File): boolean =>
  (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);

export const isWithinSizeLimit = (file: File): boolean =>
  file.size > 0 && file.size <= MAX_UPLOAD_BYTES;
