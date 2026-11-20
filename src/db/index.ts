import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "techie-daily.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT NOT NULL UNIQUE,
      category TEXT,
      published_at TEXT,
      fetched_at TEXT NOT NULL
    );
  `);

  const columns = db.prepare(`PRAGMA table_info(articles)`).all() as { name: string }[];
  const hasImageUrl = columns.some((c) => c.name === "image_url");
  if (!hasImageUrl) {
    db.exec(`ALTER TABLE articles ADD COLUMN image_url TEXT`);
    console.log("[db] migrated: added image_url column to articles");
  }

  return db;
}