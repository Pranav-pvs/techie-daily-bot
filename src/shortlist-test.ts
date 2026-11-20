import { buildShortlist } from "./pipeline/shortlist";

function main() {
  const { stories, undatedExcluded, aggregatorOnlyExcluded, repeatExcluded, promoExcluded, windowHours } =
    buildShortlist();

  console.log(`Freshness window used: ${windowHours}h`);
  console.log(`Undated articles excluded (no verified publish date): ${undatedExcluded}`);
  console.log(`Aggregator-only stories excluded (no direct-publisher link): ${aggregatorOnlyExcluded}`);
  console.log(`Promotional pages excluded (coupons, promo codes, deals): ${promoExcluded}`);
  console.log(`Articles excluded as repeats of earlier-day stories: ${repeatExcluded}`);
  console.log(`Unique stories after cross-source dedup: ${stories.length}\n`);

  for (const story of stories.slice(0, 20)) {
    const sourceNames = story.sources.map((s) => s.source_name).join(", ");
    console.log(`[${story.sources.length}x] ${story.canonical.title}`);
    console.log(`    sources: ${sourceNames}`);
  }
}

main();