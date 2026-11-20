import { getDb } from "./db";
import { RSS_SOURCES } from "./sources/config";
import { fetchRssSource } from "./sources/fetch-rss";

async function main() {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO articles (source_id, source_name, title, link, category, published_at, fetched_at, image_url)
    VALUES (@sourceId, @sourceName, @title, @link, @category, @publishedAt, @fetchedAt, @imageUrl)
  `);

  let totalNew = 0;
  for (const source of RSS_SOURCES) {
    const items = await fetchRssSource(source.feedUrl);
    const now = new Date().toISOString();
    let newForSource = 0;

    for (const item of items) {
      const result = insert.run({
        sourceId: source.id,
        sourceName: source.name,
        title: item.title,
        link: item.link,
        category: source.category ?? null,
        publishedAt: item.publishedAt,
        fetchedAt: now,
        imageUrl: item.imageUrl,
      });
      if (result.changes > 0) newForSource++;
    }

    totalNew += newForSource;
    console.log(`[collect] ${source.name}: fetched ${items.length}, ${newForSource} new`);
  }

  console.log(`[collect] done — ${totalNew} new articles stored`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});