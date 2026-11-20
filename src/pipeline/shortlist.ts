import { getDb } from "../db";
import { Article, selectFreshArticles } from "./freshness";
import { dedupeAcrossSources, DedupedStory, isAggregatorOnlyStory } from "./dedupe";

export interface ShortlistResult {
  stories: DedupedStory[];
  undatedExcluded: number;
  aggregatorOnlyExcluded: number;
  windowHours: 24 | 48;
}

export function buildShortlist(): ShortlistResult {
  const db = getDb();
  const articles = db.prepare(`SELECT * FROM articles`).all() as Article[];

  const { fresh, undatedExcluded, windowHours } = selectFreshArticles(articles);
  const allStories = dedupeAcrossSources(fresh);

  // Exclude stories we only ever found via an aggregator (Google News) —
  // we have no genuine direct-publisher link to offer readers for these.
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

  return { stories, undatedExcluded, aggregatorOnlyExcluded, windowHours };
}