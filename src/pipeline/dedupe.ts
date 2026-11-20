import { Article } from "./freshness";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function significantWords(title: string): Set<string> {
  return new Set(normalizeTitle(title).split(" ").filter((w) => w.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersectionSize = [...a].filter((word) => b.has(word)).length;
  const unionSize = new Set([...a, ...b]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

const DUPLICATE_THRESHOLD = 0.55;

const AGGREGATOR_SOURCE_IDS = new Set(["google-news-ai"]);

/**
 * Decides which article in a duplicate group should be the canonical one.
 * Direct-publisher links are always preferred over an aggregator's redirect
 * link — PRD.md §6 requires a direct source link, and Google News RSS links
 * route through Google rather than landing on the actual article.
 */
function isPreferredCanonical(candidate: Article, current: Article): boolean {
  const candidateIsAggregator = AGGREGATOR_SOURCE_IDS.has(candidate.source_id);
  const currentIsAggregator = AGGREGATOR_SOURCE_IDS.has(current.source_id);

  if (currentIsAggregator && !candidateIsAggregator) return true;
  if (!currentIsAggregator && candidateIsAggregator) return false;

  return (
    !!candidate.published_at &&
    (!current.published_at || new Date(candidate.published_at) < new Date(current.published_at))
  );
}

export interface DedupedStory {
  canonical: Article;
  sources: Article[];
}

/** Groups articles from different sources that appear to cover the same event. */
export function dedupeAcrossSources(articles: Article[]): DedupedStory[] {
  const groups: DedupedStory[] = [];

  for (const article of articles) {
    const tokens = significantWords(article.title);
    let matchedGroup: DedupedStory | undefined;

    for (const group of groups) {
      const groupTokens = significantWords(group.canonical.title);
      if (jaccardSimilarity(tokens, groupTokens) >= DUPLICATE_THRESHOLD) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.sources.push(article);
      if (isPreferredCanonical(article, matchedGroup.canonical)) {
        matchedGroup.canonical = article;
      }
    } else {
      groups.push({ canonical: article, sources: [article] });
    }
  }

  return groups;
}

/**
 * True when every source backing this story is an aggregator (e.g. Google
 * News) rather than an outlet we actually subscribe to directly — meaning
 * we have no genuine direct-publisher link for it, only a redirect.
 */
export function isAggregatorOnlyStory(story: DedupedStory): boolean {
  return story.sources.every((s) => AGGREGATOR_SOURCE_IDS.has(s.source_id));
}