import type { FeedItem } from "@es2s/shared";
import { PostCard } from "@/components/PostCard";

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul aria-hidden className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="glass overflow-hidden">
          <div className="flex animate-pulse flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <div className="aspect-[4/3] w-full shrink-0 rounded-xl bg-white/10 sm:w-56" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/3 rounded bg-white/10" />
            </div>
          </div>
          <div className="border-t border-white/10 p-3">
            <div className="h-10 animate-pulse rounded-lg bg-white/10" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FeedEmpty() {
  return (
    <p className="glass px-6 py-12 text-center text-white/60">
      No sounds yet — be the first to sonify an image.
    </p>
  );
}

export function FeedItems({ items }: { items: FeedItem[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.id}>
          <PostCard item={item} />
        </li>
      ))}
    </ul>
  );
}
