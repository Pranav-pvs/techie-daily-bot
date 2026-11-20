import { fetchRssSource } from "./sources/fetch-rss";
import { RSS_SOURCES } from "./sources/config";

async function main() {
  const targetName = process.argv[2];
  const sources = targetName
    ? RSS_SOURCES.filter((s) => s.name.toLowerCase().includes(targetName.toLowerCase()))
    : RSS_SOURCES;

  for (const source of sources) {
    console.log(`\n=== ${source.name} ===`);
    const items = await fetchRssSource(source.feedUrl);
    for (const item of items.slice(0, 5)) {
      console.log(`- ${item.title.slice(0, 60)}`);
      console.log(`  image: ${item.imageUrl ?? "(none)"}`);
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});