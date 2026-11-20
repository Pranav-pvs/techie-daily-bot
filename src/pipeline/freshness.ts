export interface Article {
  id: number;
  source_id: string;
  source_name: string;
  title: string;
  link: string;
  category: string | null;
  published_at: string | null;
  fetched_at: string;
  image_url: string | null;
}

const HOUR_MS = 60 * 60 * 1000;
// If fewer than this many dated articles fall within 24h, widen to 48h
// rather than risk too thin a selection pool for the editorial stage.
const MIN_CANDIDATES_BEFORE_WIDENING = 8;

export interface FreshnessResult {
  fresh: Article[];
  undatedExcluded: number;
  windowHours: 24 | 48;
}

/**
 * Applies the 24h-then-48h freshness window from PRD.md §5. Articles with no
 * verified published_at are never guessed at — they're excluded from the
 * normal selection and only counted, never included.
 */
export function selectFreshArticles(articles: Article[]): FreshnessResult {
  const now = Date.now();
  const dated = articles.filter((a) => a.published_at);
  const undatedExcluded = articles.length - dated.length;

  const within24h = dated.filter(
    (a) => now - new Date(a.published_at!).getTime() <= 24 * HOUR_MS
  );
  if (within24h.length >= MIN_CANDIDATES_BEFORE_WIDENING) {
    return { fresh: within24h, undatedExcluded, windowHours: 24 };
  }

  const within48h = dated.filter(
    (a) => now - new Date(a.published_at!).getTime() <= 48 * HOUR_MS
  );
  return { fresh: within48h, undatedExcluded, windowHours: 48 };
}