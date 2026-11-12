import Image from "next/image";
import type { FeedItem } from "@es2s/shared";
import { PlayerCard } from "@/components/PlayerCard";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function PostCard({ item }: { item: FeedItem }) {
  return (
    <article className="glass overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-void-700 sm:w-56">
          <Image
            src={item.image_url}
            alt={item.description}
            fill
            sizes="(max-width: 640px) 100vw, 224px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-balance text-base leading-snug text-white">
            {item.description}
          </p>
          <time
            dateTime={item.created_at.toISOString()}
            className="mt-2 block text-xs text-white/40"
          >
            {dateFormatter.format(item.created_at)}
          </time>
        </div>
      </div>
      <div className="border-t border-white/10 p-3">
        <PlayerCard
          id={item.id}
          src={item.audio_url}
          title={item.description}
        />
      </div>
    </article>
  );
}
