import {
  char,
  datetime,
  index,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const feedItems = mysqlTable(
  "feed_items",
  {
    id: char("id", { length: 36 }).primaryKey(),
    imageUrl: varchar("image_url", { length: 512 }).notNull(),
    audioUrl: varchar("audio_url", { length: 512 }).notNull(),
    description: varchar("description", { length: 100 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("feed_items_created_at_idx").on(table.createdAt)],
);

export const jobs = mysqlTable(
  "jobs",
  {
    id: char("id", { length: 36 }).primaryKey(),
    status: varchar("status", { length: 16 }).notNull().default("queued"),
    error: text("error"),
    feedItemId: char("feed_item_id", { length: 36 }),
    createdAt: datetime("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: datetime("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [index("jobs_created_at_idx").on(table.createdAt)],
);

export type FeedItemRow = typeof feedItems.$inferSelect;
export type NewFeedItemRow = typeof feedItems.$inferInsert;
export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
