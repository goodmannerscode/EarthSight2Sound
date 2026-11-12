import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
  R2_ENDPOINT: z.string().url("R2_ENDPOINT must be a URL"),
  R2_PUBLIC_BASE_URL: z
    .string()
    .url("R2_PUBLIC_BASE_URL must be a URL")
    .transform((value) => value.replace(/\/+$/, "")),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  IMAGE2SOUND_BIN: z.string().min(1).default("image2sound"),
  IMAGE2SOUND_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  QUEUE_DB_PATH: z.string().min(1).default(".data/queue.sqlite"),
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid configuration:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
    this.name = "ConfigError";
    this.issues = issues;
  }
}

/** Parses an env bag into a validated config. Throws `ConfigError` on failure. */
export const parseConfig = (env: Record<string, string | undefined>): Config => {
  const result = ConfigSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    );
  }
  return result.data;
};

let cached: Config | undefined;

/** Lazily validated process config. Importing this module never throws. */
export const getConfig = (): Config => {
  cached ??= parseConfig(Bun.env as Record<string, string | undefined>);
  return cached;
};
