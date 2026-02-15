import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const CREATE_TABLES_SQL = `
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
`;

const INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
  CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
`;

function getClient() {
  if (process.env.TURSO_DATABASE_URL) {
    // Production: Turso cloud
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // Local dev: file-based SQLite via libsql
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, "linkforge.db");
  return createClient({ url: `file:${dbPath}` });
}

let _initialized = false;
const client = getClient();

async function ensureTables() {
  if (_initialized) return;
  const statements = (CREATE_TABLES_SQL + INDEX_SQL)
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
  _initialized = true;
}

// Initialize tables on startup
ensureTables().catch(console.error);

export const db = drizzle(client, { schema });
export { ensureTables };
