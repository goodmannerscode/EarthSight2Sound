import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { mockFeed } from "@/lib/mock-feed";

export default function Home() {
  const items = mockFeed;

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

        {items.length === 0 ? (
          <p className="glass px-6 py-12 text-center text-white/60">
            No sounds yet — be the first to sonify an image.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.id}>
                <PostCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

