import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

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

  CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
  CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
`;

function getDbUrl(): string {
  // Production: Turso cloud database
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  // Vercel: use /tmp for writable storage (ephemeral but functional)
  if (process.env.VERCEL) {
    return "file:/tmp/linkforge.db";
  }

  // Local dev: use project data directory
  const path = require("path");
  const fs = require("fs");
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return `file:${path.join(dbDir, "linkforge.db")}`;
}

function getClient() {
  const url = getDbUrl();

  if (process.env.TURSO_DATABASE_URL) {
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return createClient({ url });
}

let _initialized = false;
const client = getClient();

async function ensureTables() {
  if (_initialized) return;
  const statements = CREATE_TABLES_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
  _initialized = true;
}

// Initialize tables on module load
ensureTables().catch(console.error);

export const db = drizzle(client, { schema });
export { ensureTables };
