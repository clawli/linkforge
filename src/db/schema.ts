import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  url: text("url").notNull(),
  adminToken: text("admin_token").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  expiresAt: text("expires_at"),
});

export const clicks = sqliteTable("clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkId: integer("link_id")
    .notNull()
    .references(() => links.id, { onDelete: "cascade" }),
  timestamp: text("timestamp").notNull().default("(datetime('now'))"),
  referrer: text("referrer"),
  country: text("country"),
  city: text("city"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
});
