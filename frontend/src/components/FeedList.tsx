"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem } from "@es2s/shared";
import { FeedEmpty, FeedItems, FeedSkeleton } from "@/components/FeedSkeleton";
import { fetchFeed } from "@/lib/feed";

type FeedListProps = {
  initialItems: FeedItem[];
  initialTotal: number;
  pageSize: number;
};

export function FeedList({ initialItems, initialTotal, pageSize }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const pageRef = useRef(1);

  const hasMore = items.length < total;

  const loadMore = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    const nextPage = pageRef.current + 1;
    try {
      const result = await fetchFeed(nextPage, pageSize);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.items.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
      pageRef.current = nextPage;
      setPage(nextPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load more");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) {
    return <FeedEmpty />;
  }

  return (
    <div className="flex flex-col gap-4">
      <FeedItems items={items} />

      {hasMore ? (
        <div ref={sentinelRef} data-testid="feed-sentinel">
          {isLoading ? <FeedSkeleton count={1} /> : null}
        </div>
      ) : null}

      {error ? (
        <div className="glass flex flex-col items-center gap-3 px-6 py-6 text-center">
          <p className="text-sm text-white/70">{error}</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="rounded-lg bg-earth-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-earth-500"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
