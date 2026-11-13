import { FeedSkeleton } from "@/components/FeedSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <section aria-busy="true" aria-label="Loading feed" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Earth Jukebox
          </h1>
        </div>
        <FeedSkeleton />
      </section>
    </div>
  );
}
