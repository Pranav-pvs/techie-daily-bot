import { getDb } from "./db";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const search = process.argv[2];
  if (!search) {
    console.error("Usage: tsx src/debug-image-url.ts <part of the article URL>");
    process.exit(1);
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT title, link, image_url FROM articles WHERE link LIKE ?`)
    .get(`%${search}%`) as { title: string; link: string; image_url: string | null } | undefined;

  if (!row) {
    console.error(`No article found matching "${search}"`);
    process.exit(1);
  }

  console.log(`Title: ${row.title}`);
  console.log(`Link: ${row.link}`);
  console.log(`Image URL: ${row.image_url ?? "(none)"}`);

  if (!row.image_url) {
    process.exit(0);
  }

  const res = await fetch(row.image_url);
  console.log(`Content-Type: ${res.headers.get("content-type")}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = res.headers.get("content-type")?.includes("png") ? "png" : "jpg";
  const outDir = path.join(process.cwd(), "data/output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `debug-source-image.${ext}`);
  fs.writeFileSync(outPath, buf);
  console.log(`Saved raw image to ${outPath} — open it directly and check the text.`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});