# EarthSight2Sound

Upload a satellite image of Earth → sonify it into a 20–30 s WAV → publish image + audio to a
public feed.

Built for the **NASA 2026 Hackathon** ("Earth Jukebox").

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TailwindCSS 4 |
| API | Hono on Bun |
| Database | MariaDB (native install) + Drizzle ORM |
| Storage | Cloudflare R2 (S3-compatible, public read) |
| Images | `sharp` → resize 512px inside, JPEG q85 |
| Audio | `jaerrib/image2sound` via `Bun.spawn` |
| Jobs | `bunqueue` embedded (SQLite, in-process, concurrency 1) |
| Validation | Zod in `shared/schemas.ts` — single source of truth |
| Package manager | pnpm workspaces |

## Monorepo layout

```
shared/     @es2s/shared    Zod schemas + inferred types (no build step)
backend/    @es2s/backend   Hono API, pipeline, adapters
frontend/   @es2s/frontend  Next.js app
e2e/        @es2s/e2e       Playwright specs
```

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Bun ≥ 1.1
- MariaDB ≥ 10.11 running locally
- Python 3.11+ (for `image2sound`)

## Setup

```powershell
pnpm install
Copy-Item .env.example .env   # then fill in the values
```

### Environment variables

See [.env.example](.env.example). Required keys:

| Key | Purpose |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | R2 S3 API token id |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API token secret |
| `R2_BUCKET` | bucket name |
| `R2_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` — **host only**, no bucket path |
| `R2_PUBLIC_BASE_URL` | public `r2.dev` base URL, **no trailing slash** |
| `DATABASE_URL` | `mysql://user:pass@127.0.0.1:3306/earthsight2sound` |
| `PORT` | API port (default `3001`) |
| `IMAGE2SOUND_BIN` | path to the `image2sound` entry point |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL used by the browser |
| `NEXT_PUBLIC_SITE_URL` | canonical site URL for metadata/sitemap |

## Development

```powershell
pnpm run dev:web   # Next.js on http://localhost:3000
pnpm run dev:api   # Hono on http://localhost:3001
```

## Testing

Tests are **left-shifted**: written before the implementation, with Zod schemas as the single
source of truth for every boundary.

```powershell
bun test shared/tests/schemas.test.ts
bun test backend/tests/validators.test.ts
```

Current status:

| Suite | Tests | Status |
|---|---|---|
| `shared/tests/schemas.test.ts` | ~90 | ✅ pass |
| `backend/tests/validators.test.ts` | 31 | ✅ pass |

## Architecture

Ports & adapters — the pipeline core imports no concrete adapter:

```ts
type PipelineDeps = {
  storage: StoragePort;   // head, get, put, delete
  repo: RepoPort;         // insert
  sonify: SonifyPort;     // (imagePath, seconds) => wavPath
  resize: ResizePort;     // (buf) => buf
};
```

This makes ordering assertions testable with fakes: `head` before `get`, `put` before `insert`,
cleanup on throw.

### Validation order (strict)

1. Frontend: `UploadSchema.safeParse()`; submit disabled until valid.
2. Backend: `head_object` **before** download — size > 10 MB → 413, MIME not png/jpeg/webp → 415,
   description fails Zod → 422.
3. `sharp` bomb guard: reject if `width * height > 50_000_000` (413).
4. Resize: `sharp(buf).resize(512, 512, { fit: "inside" }).jpeg({ quality: 85 })`.
5. Whole pipeline in `try/finally`; always delete the temp resized image and temp WAV.

### API

| Method | Path | Response |
|---|---|---|
| `POST` | `/api/upload` | `201 { job_id, status: "queued" }` · `413` · `415` · `422` |
| `GET` | `/api/status/{job_id}` | `{ status, error, feedItem }` |
| `GET` | `/api/feed?page=1&pageSize=20` | `{ items, total }`, `created_at DESC` |
| `GET` | `/health` | `{ status: "ok" }` |

## Frontend routes

| Route | Content |
|---|---|
| `/` | Header · Feed of `PostCard`s (newest first, infinite scroll) · Footer |
| `/upload` | Header · `UploadCard` · Footer |
| `/contact` | Header · `CollaboratorCard` grid (max 2/row) · Footer |
| `/about` `/support` `/terms` `/privacy` `/cookies` | Header · static content · Footer |

`PlayerCard` constraints are structural: a single `AudioProvider` owns one `<audio>` element, so
only one track can play at a time and volume/mute are global by construction.

## License

Hackathon project — see the repository for details.
