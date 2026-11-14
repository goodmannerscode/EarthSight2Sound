"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  DescriptionSchema,
  MAX_DESCRIPTION_LENGTH,
  MAX_UPLOAD_BYTES,
} from "@es2s/shared";
import {
  ApiError,
  getJobStatus,
  isAllowedImage,
  isWithinSizeLimit,
  uploadImage,
} from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

type Phase = "idle" | "uploading" | "processing" | "error";

const formatBytes = (bytes: number): string =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.round(bytes / 1000)} KB`;

export function UploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const acceptFile = useCallback((candidate: File | undefined) => {
    if (!candidate) return;
    setError(null);

    if (!isAllowedImage(candidate)) {
      setError("Unsupported file type. Use PNG, JPEG or WebP.");
      return;
    }
    if (!isWithinSizeLimit(candidate)) {
      setError(`File must be between 1 byte and ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(candidate);
    previewRef.current = url;
    setPreview(url);
    setFile(candidate);
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const descriptionValid = DescriptionSchema.safeParse(description).success;
  const canSubmit =
    file !== null && descriptionValid && (phase === "idle" || phase === "error");
  const busy = phase === "uploading" || phase === "processing";

  const poll = useCallback(
    async (jobId: string) => {
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const result = await getJobStatus(jobId);
        if (result.status === "done") return true;
        if (result.status === "failed") {
          throw new Error(result.error ?? "Sonification failed");
        }
      }
      throw new Error("Timed out waiting for the song. Please try again.");
    },
    [],
  );

  const onSubmit = async () => {
    if (!file || !canSubmit) return;
    setError(null);
    setPhase("uploading");

    try {
      const { job_id } = await uploadImage(file, description.trim());
      setPhase("processing");
      await poll(job_id);
      router.push("/");
      router.refresh();
    } catch (cause) {
      setPhase("error");
      if (cause instanceof ApiError) {
        setError(
          cause.status === 413
            ? "That image is too large."
            : cause.status === 415
              ? "That image type is not supported."
              : cause.status === 422
                ? "Please check the description."
                : cause.message,
        );
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="glass flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose an image or drop one here"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative grid min-h-48 flex-1 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
            dragging
              ? "border-earth-400 bg-earth-500/10"
              : "border-white/20 bg-white/5 hover:border-earth-400/60"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected satellite image preview"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-white/80">
                Drag &amp; drop an image here
              </p>
              <p className="mt-1 text-xs text-white/50">
                or click to browse · PNG, JPEG, WebP · max{" "}
                {formatBytes(MAX_UPLOAD_BYTES)}
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onInputChange}
            className="sr-only"
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-earth-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-earth-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 sm:w-48"
        >
          {busy ? (
            <>
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              {phase === "uploading" ? "Uploading…" : "Sonifying…"}
            </>
          ) : (
            "Get the song"
          )}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-white/80">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          required
          rows={3}
          placeholder="What are we looking at? e.g. Aurora over the North Atlantic"
          className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-earth-400 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs">
          <span role="alert" className="text-red-300">
            {error ?? ""}
          </span>
          <span className="tabular-nums text-white/40">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}
