import { getDb } from "../db";
import { Article, selectFreshArticles } from "./freshness";
import { dedupeAcrossSources, DedupedStory, isAggregatorOnlyStory } from "./dedupe";
import { readHistory, filterRepeats, todayUtc } from "./published-history";
import { filterPromotional } from "./promo-filter";

export interface ShortlistResult {
  stories: DedupedStory[];
  undatedExcluded: number;
  aggregatorOnlyExcluded: number;
  repeatExcluded: number;
  promoExcluded: number;
  windowHours: 24 | 48;
}

export function buildShortlist(): ShortlistResult {
  const db = getDb();
  const articles = db.prepare(`SELECT * FROM articles`).all() as Article[];

  // Promotional pages are removed first, so they never reach ranking or the editorial model.
  const { kept: nonPromo, excluded: promoExcluded } = filterPromotional(articles);

  // Repeats are removed before the freshness window is chosen, so the
  // 24h-to-48h widening counts only stories that can still be used.
  const history = readHistory();
  if (history.error) {
    console.warn(`[history] ${history.error} — repeat prevention skipped for this run`);
  }
  const { kept, excluded: repeatExcluded } = filterRepeats(nonPromo, history.entries, todayUtc());

  const { fresh, undatedExcluded, windowHours } = selectFreshArticles(kept);
  const allStories = dedupeAcrossSources(fresh);

  const aggregatorOnlyExcluded = allStories.filter(isAggregatorOnlyStory).length;
  const stories = allStories.filter((s) => !isAggregatorOnlyStory(s));

  stories.sort((a, b) => {
    if (b.sources.length !== a.sources.length) {
      return b.sources.length - a.sources.length;
    }
    const aTime = a.canonical.published_at ? new Date(a.canonical.published_at).getTime() : 0;
    const bTime = b.canonical.published_at ? new Date(b.canonical.published_at).getTime() : 0;
    return bTime - aTime;
  });

  return { stories, undatedExcluded, aggregatorOnlyExcluded, repeatExcluded, promoExcluded, windowHours };
}