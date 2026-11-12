import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs on Node (CJS, no top-level await) and does not load `.env`.
const envPath = new URL("../.env", import.meta.url);
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = (rawValue ?? "").replace(/^["']|["']$/g, "");
  }
}

const databaseUrl = process.env["DATABASE_URL"] ?? "";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
