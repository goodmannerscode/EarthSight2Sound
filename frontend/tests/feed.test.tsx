import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { FeedItem } from "@es2s/shared";
import { AudioProvider } from "@/components/AudioProvider";
import { FeedList } from "@/components/FeedList";
import { observers, resetIntersectionObserver } from "./setup";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

const makeItem = (id: string, description: string): FeedItem => ({
  id,
  image_url: `https://pub-c5312941d1a24d1883e646aab4436e22.r2.dev/images/${id}.jpg`,
  audio_url: `https://pub-c5312941d1a24d1883e646aab4436e22.r2.dev/audio/${id}.wav`,
  description,
  created_at: new Date("2026-11-13T10:44:05.000Z"),
});

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const renderFeed = (props: {
  initialItems: FeedItem[];
  initialTotal: number;
  pageSize: number;
}) =>
  render(
    <AudioProvider>
      <FeedList {...props} />
    </AudioProvider>,
  );

const originalFetch = globalThis.fetch;

beforeEach(() => {
  resetIntersectionObserver();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("FeedList", () => {
  it("renders the initial items", () => {
    renderFeed({
      initialItems: [makeItem(ID_A, "Amazon delta")],
      initialTotal: 1,
      pageSize: 20,
    });

    expect(screen.getByText("Amazon delta")).toBeDefined();
  });

  it("shows the empty state when there are no items", () => {
    renderFeed({ initialItems: [], initialTotal: 0, pageSize: 20 });

    expect(
      screen.getByText("No sounds yet — be the first to sonify an image."),
    ).toBeDefined();
  });

  it("does not observe a sentinel when every item is already loaded", () => {
    renderFeed({
      initialItems: [makeItem(ID_A, "Amazon delta")],
      initialTotal: 1,
      pageSize: 20,
    });

    expect(screen.queryByTestId("feed-sentinel")).toBeNull();
    expect(observers).toHaveLength(0);
  });

  it("appends the next page when the sentinel intersects", async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL) =>
      jsonResponse({
        items: [makeItem(ID_B, "Sahara dust")],
        total: 2,
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderFeed({
      initialItems: [makeItem(ID_A, "Amazon delta")],
      initialTotal: 2,
      pageSize: 1,
    });

    expect(screen.getByTestId("feed-sentinel")).toBeDefined();
    expect(observers).toHaveLength(1);

    await act(async () => {
      observers[0]!.trigger(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Sahara dust")).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("/api/feed?page=2&pageSize=1");
    expect(screen.queryByTestId("feed-sentinel")).toBeNull();
  });

  it("surfaces a retry action when the next page fails", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: "boom" }, 500),
    ) as unknown as typeof fetch;

    renderFeed({
      initialItems: [makeItem(ID_A, "Amazon delta")],
      initialTotal: 2,
      pageSize: 1,
    });

    await act(async () => {
      observers[0]!.trigger(true);
    });

    await waitFor(() => {
      expect(screen.getByText("boom")).toBeDefined();
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeDefined();
  });
});

