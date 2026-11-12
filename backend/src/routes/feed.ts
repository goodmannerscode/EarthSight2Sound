import { FeedQuerySchema } from "@es2s/shared";
import type { Context } from "hono";
import type { FeedRepo } from "../db/queries";

export type FeedDeps = {
  feed: FeedRepo;
};

export const createFeedRoute = (deps: FeedDeps) => async (c: Context) => {
  const parsed = FeedQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query" },
      422,
    );
  }

  const { page, pageSize } = parsed.data;
  const result = await deps.feed.list(page, pageSize);
  return c.json(result);
};
