import type { Article } from "./freshness";

// Promotional and shopping pages, not technology news. Patterns are deliberately
// specific: a bare word like "deal" is not enough, because business deals are news.
const PROMO_PATTERNS: RegExp[] = [
  /\bcoupons?\b/i,
  /\bpromo codes?\b/i,
  /\bdiscount codes?\b/i,
  /\b\d+\s?%\s*off\b/i,
  /\bbest deals?\b/i,
  /\bblack friday deals?\b/i,
  /\bcyber monday deals?\b/i,
];

export function isPromotional(title: string): boolean {
  return PROMO_PATTERNS.some((pattern) => pattern.test(title));
}

export function filterPromotional(articles: Article[]): { kept: Article[]; excluded: number } {
  const kept: Article[] = [];
  let excluded = 0;
  for (const article of articles) {
    if (isPromotional(article.title)) {
      excluded++;
    } else {
      kept.push(article);
    }
  }
  return { kept, excluded };
}