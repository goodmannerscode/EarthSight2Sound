import type { FeedItem } from "@es2s/shared";

/**
 * Development-only fixtures. Replaced by `GET /api/feed` once the backend is wired.
 * Images come from picsum.photos; audio is a public-domain sample.
 */
export const mockFeed: FeedItem[] = [
  {
    id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    image_url: "https://picsum.photos/seed/earth-aurora/1024/768",
    audio_url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3",
    description: "Aurora over the North Atlantic",
    created_at: new Date("2026-11-12T19:50:34.740Z"),
  },
  {
    id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    image_url: "https://picsum.photos/seed/earth-desert/1024/768",
    audio_url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3",
    description: "Dust plumes crossing the Sahara",
    created_at: new Date("2026-11-12T18:12:05.000Z"),
  },
  {
    id: "16fd2706-8baf-433b-82eb-8c7fada847da",
    image_url: "https://picsum.photos/seed/earth-cyclone/1024/768",
    audio_url: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_00fa5593f3.mp3",
    description: "Cyclone swirling off the coast of Japan",
    created_at: new Date("2026-11-12T16:03:41.000Z"),
  },
];
