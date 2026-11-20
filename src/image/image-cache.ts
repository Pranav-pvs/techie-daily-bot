import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), "data/image-cache");

function cacheFilePath(key: string): string {
  const safe = key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return path.join(CACHE_DIR, `${safe}.txt`);
}

export function readCachedImage(key: string): string | null {
  try {
    return fs.readFileSync(cacheFilePath(key), "utf-8");
  } catch {
    return null; // no cache entry yet — not an error
  }
}

export function writeCachedImage(key: string, dataUri: string): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFilePath(key), dataUri, "utf-8");
}