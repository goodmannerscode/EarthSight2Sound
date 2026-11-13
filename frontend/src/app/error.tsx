"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <section className="glass flex flex-col items-center gap-4 px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          The feed could not be loaded
        </h1>
        <p className="max-w-md text-sm text-white/60">
          {error.message || "Something went wrong while reaching the server."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-earth-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-earth-500"
        >
          Try again
        </button>
      </section>
    </div>
  );
}
