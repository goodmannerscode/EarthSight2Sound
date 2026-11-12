import { z } from "zod";

/**
 * Single source of truth for every type crossing the frontend/backend boundary.
 * No hand-written types anywhere else in the monorepo — always `z.infer<typeof X>`.
 */

export const MAX_UPLOAD_BYTES = 10_000_000;
export const MAX_IMAGE_PIXELS = 50_000_000;
export const MAX_AUDIO_BYTES = 1_000_000;
export const MIN_AUDIO_SECONDS = 20;
export const MAX_AUDIO_SECONDS = 30;
export const MAX_DESCRIPTION_LENGTH = 100;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ImageMimeTypeSchema = z.enum(ALLOWED_IMAGE_MIME_TYPES);

export const DescriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(
    MAX_DESCRIPTION_LENGTH,
    `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
  );

export const UploadSchema = z.object({
  description: DescriptionSchema,
  mimeType: ImageMimeTypeSchema,
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, `File must be at most ${MAX_UPLOAD_BYTES} bytes`),
});

export const JobStatusSchema = z.enum([
  "queued",
  "processing",
  "done",
  "failed",
]);

export const FeedItemSchema = z.object({
  id: z.string().uuid(),
  image_url: z.string().url(),
  audio_url: z.string().url(),
  description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
  created_at: z.coerce.date(),
});

export const FeedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export const FeedResponseSchema = z.object({
  items: z.array(FeedItemSchema),
  total: z.number().int().nonnegative(),
});

export const JobStatusResponseSchema = z.object({
  status: JobStatusSchema,
  error: z.string().nullable(),
  feedItem: FeedItemSchema.nullable(),
});

export const UploadResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.literal("queued"),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const SocialLinksSchema = z.object({
  instagram: z.string().url().optional(),
  facebook: z.string().url().optional(),
  discord: z.string().url().optional(),
  youtube: z.string().url().optional(),
  snapchat: z.string().url().optional(),
});

export const TeamMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(60),
  bio: z.string().min(1).max(280),
  imageUrl: z.string().min(1),
  socials: SocialLinksSchema,
});

export const TeamSchema = z.array(TeamMemberSchema).min(1);

export type ImageMimeType = z.infer<typeof ImageMimeTypeSchema>;
export type Upload = z.infer<typeof UploadSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type FeedItem = z.infer<typeof FeedItemSchema>;
export type FeedQuery = z.infer<typeof FeedQuerySchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Team = z.infer<typeof TeamSchema>;
