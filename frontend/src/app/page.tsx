import Link from "next/link";
import { DEFAULT_PAGE_SIZE } from "@es2s/shared";
import { FeedList } from "@/components/FeedList";
import { fetchFeed } from "@/lib/feed";

export default async function Home() {
  const { items, total } = await fetchFeed(1, DEFAULT_PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <section aria-labelledby="feed-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1
            id="feed-heading"
            className="text-2xl font-semibold tracking-tight text-white"
          >
            Earth Jukebox
          </h1>
          <Link
            href="/upload"
            className="rounded-lg bg-earth-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-earth-500"
          >
            Sonify an image
          </Link>
        </div>

        <FeedList
          initialItems={items}
          initialTotal={total}
          pageSize={DEFAULT_PAGE_SIZE}
        />
      </section>
    </div>
  );
}

