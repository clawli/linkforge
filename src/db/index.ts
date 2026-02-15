import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) return _db;

  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "linkforge.db");
  const sqlite = new Database(dbPath);

  // Enable WAL mode and busy timeout for concurrent access
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      admin_token TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT
    );
    
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      referrer TEXT,
      country TEXT,
      city TEXT,
      device TEXT,
      browser TEXT,
      os TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
    CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
  `);

  _db = drizzle(sqlite, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const instance = getDb();
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});
