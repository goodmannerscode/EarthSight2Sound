import {
  ALLOWED_IMAGE_MIME_TYPES,
  DescriptionSchema,
  MAX_IMAGE_PIXELS,
  MAX_UPLOAD_BYTES,
} from "@es2s/shared";

export type ValidationOk<T> = { ok: true; value: T };
export type ValidationErr = { ok: false; status: 413 | 415 | 422; error: string };
export type ValidationResult<T> = ValidationOk<T> | ValidationErr;

const fail = (status: ValidationErr["status"], error: string): ValidationErr => ({
  ok: false,
  status,
  error,
});

const normaliseMime = (raw: string): string =>
  raw.split(";")[0]?.trim().toLowerCase() ?? "";

export type HeadObjectInput = {
  contentLength: number | undefined;
  contentType: string | undefined;
};

/**
 * Runs against the R2 `head_object` result, before any bytes are downloaded.
 * Size is checked first so an oversized file never reaches the MIME check.
 */
export const validateHeadObject = (
  head: HeadObjectInput,
): ValidationResult<{ sizeBytes: number; mimeType: string }> => {
  const sizeBytes = head.contentLength;
  if (typeof sizeBytes !== "number" || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return fail(413, "File is empty or its size could not be determined");
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return fail(413, `File is too large (max ${MAX_UPLOAD_BYTES} bytes)`);
  }

  const mimeType = head.contentType ? normaliseMime(head.contentType) : "";
  if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return fail(
      415,
      `Unsupported image type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
    );
  }

  return { ok: true, value: { sizeBytes, mimeType } };
};

export type ImageDimensions = {
  width: number | undefined;
  height: number | undefined;
};

/** Decompression-bomb guard, run on `sharp` metadata before any resize. */
export const validateImageDimensions = (
  dims: ImageDimensions,
): ValidationResult<{ width: number; height: number }> => {
  const { width, height } = dims;
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return fail(422, "Image dimensions could not be read");
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    return fail(413, `Image is too large (max ${MAX_IMAGE_PIXELS} pixels)`);
  }
  return { ok: true, value: { width, height } };
};

/** Validates the description with the shared schema — no duplicated rules. */
export const validateDescription = (
  raw: unknown,
): ValidationResult<string> => {
  const parsed = DescriptionSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid description";
    return fail(422, message);
  }
  return { ok: true, value: parsed.data };
};
