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

## Sonification (image2sound)

The vendored [`jaerrib/image2sound`](https://github.com/jaerrib/image2sound) CLI turns an image into
music. We patched it to emit a single, duration-bounded WAV.

### Python environment

`image2sound` needs **Python 3.11**. Python 3.15 breaks numpy on Windows
(`OverflowError: cannot convert longdouble infinity to integer` at import).

```powershell
conda create -n nasa python=3.11 -y
conda activate nasa
cd backend\vendor\image2sound
pip install -r requirements.txt
```

### Generate an audio file

Run from the repository root:

```powershell
New-Item -ItemType Directory -Force -Path backend\vendor\image2sound\output | Out-Null
cd backend\vendor\image2sound\src
python main.py -p test_image_rgb.png -o ..\output --min-duration 20 --max-duration 30
```

`-o` must point at an **existing directory**. If the path does not exist it is treated as a
filename prefix and the WAV lands next to `src/`.

### Verify the result

```powershell
Get-ChildItem ..\output | Select-Object Name, Length
python -c "import wave,glob; f=glob.glob(r'..\output\*.wav')[0]; w=wave.open(f); print(f); print('rate:', w.getframerate(), 'frames:', w.getnframes(), 'seconds:', round(w.getnframes()/w.getframerate(), 2))"
```

Expected: `rate: 16000` and `seconds` between **20 and 30**.

### CLI flags we added

| Flag | Default | Meaning |
|---|---|---|
| `--min-duration` | `20` | Minimum output length in seconds |
| `--max-duration` | `30` | Maximum output length in seconds |
| `--multi` | off | Write one WAV per colour channel instead of a single mixed file |

### Output format

- **One** WAV file, mixed from the R/G/B channels
- **16-bit PCM mono at 16 kHz** — 30 s ≈ 960 KB
- Duration clamped to `[min_duration, max_duration]`: trimmed when longer, looped when shorter
- Cover art embedded as an ID3 `APIC` frame

### Patches applied to the vendor code

| File | Change |
|---|---|
| `src/main.py` | `--min-duration`, `--max-duration`, `--multi` arguments |
| `src/sound_image.py` | `OUTPUT_RATE = 16000`; `min_duration` / `max_duration` / `multi` in `DEFAULT_SETTINGS`; tempo clamped to ≥ 20 BPM; `save_wav` writes 16-bit at `OUTPUT_RATE` and joins the output directory correctly; `convert_with_comp_engine` mixes channels by default; new `downsample` and `fit_duration` helpers; `generate_wave` guards against non-finite note durations |

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
