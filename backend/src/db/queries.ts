import { randomUUID } from "node:crypto";
import type { FeedItem, JobStatus } from "@es2s/shared";
import { desc, eq, sql } from "drizzle-orm";
import type { NewFeedItem, RepoPort } from "../ports";
import type { Database } from "./client";
import { feedItems, jobs, type FeedItemRow } from "./schema";

const toFeedItem = (row: FeedItemRow): FeedItem => ({
  id: row.id,
  image_url: row.imageUrl,
  audio_url: row.audioUrl,
  description: row.description,
  created_at: row.createdAt,
});

export type JobRecord = {
  id: string;
  status: JobStatus;
  error: string | null;
  feedItem: FeedItem | null;
};

export type JobRepo = {
  create(): Promise<string>;
  markProcessing(id: string): Promise<void>;
  markDone(id: string, feedItemId: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  find(id: string): Promise<JobRecord | null>;
};

export type FeedRepo = {
  list(page: number, pageSize: number): Promise<{ items: FeedItem[]; total: number }>;
};

export const createFeedRepo = (db: Database): RepoPort & FeedRepo => ({
  async insert(item: NewFeedItem): Promise<FeedItem> {
    const row = {
      id: randomUUID(),
      imageUrl: item.imageUrl,
      audioUrl: item.audioUrl,
      description: item.description,
    };
    await db.insert(feedItems).values(row);
    return toFeedItem({ ...row, createdAt: new Date() });
  },

  async list(page, pageSize) {
    const offset = (page - 1) * pageSize;
    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(feedItems)
        .orderBy(desc(feedItems.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(feedItems),
    ]);

    return {
      items: rows.map(toFeedItem),
      total: Number(totals[0]?.count ?? 0),
    };
  },
});

export const createJobRepo = (db: Database): JobRepo => ({
  async create() {
    const id = randomUUID();
    await db.insert(jobs).values({ id, status: "queued" });
    return id;
  },

  async markProcessing(id) {
    await db.update(jobs).set({ status: "processing" }).where(eq(jobs.id, id));
  },

  async markDone(id, feedItemId) {
    await db
      .update(jobs)
      .set({ status: "done", feedItemId, error: null })
      .where(eq(jobs.id, id));
  },

  async markFailed(id, error) {
    await db
      .update(jobs)
      .set({ status: "failed", error: error.slice(0, 1_000) })
      .where(eq(jobs.id, id));
  },

  async find(id) {
    const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;

    let feedItem: FeedItem | null = null;
    if (row.feedItemId) {
      const items = await db
        .select()
        .from(feedItems)
        .where(eq(feedItems.id, row.feedItemId))
        .limit(1);
      const item = items[0];
      if (item) feedItem = toFeedItem(item);
    }

    return {
      id: row.id,
      status: row.status as JobStatus,
      error: row.error,
      feedItem,
    };
  },
});
