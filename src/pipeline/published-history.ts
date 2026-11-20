import fs from "node:fs";
import path from "node:path";
import { Article } from "./freshness";
import { significantWords, jaccardSimilarity } from "./dedupe";

const HISTORY_PATH = path.join(process.cwd(), "data/state/published-history.json");
export const REPEAT_WINDOW_DAYS = 7;
export const REPEAT_TITLE_THRESHOLD = 0.55;
const KEEP_DAYS = 30;

export interface PublishedStory {
  date: string; // UTC day of publication, YYYY-MM-DD
  link: string;
  title: string; // the original article title, not the rewritten headline
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A missing file is normal (first run). An empty or whitespace-only file holds
 * no data, so it counts as an empty history. Any other unreadable content is
 * reported and never thrown.
 */
export function readHistory(): { entries: PublishedStory[]; error?: string } {
  if (!fs.existsSync(HISTORY_PATH)) return { entries: [] };
  try {
    // Strip a byte-order mark if an editor added one; JSON.parse rejects it.
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8").replace(/^\uFEFF/, "");
    if (raw.trim() === "") return { entries: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { entries: [], error: "published-history.json is not a list" };
    }
    return { entries: parsed as PublishedStory[] };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { entries: [], error: `published-history.json is unreadable (${reason})` };
  }
}

/**
 * Removes articles that repeat a story published on an earlier UTC day within
 * the window. Matches on the same link, or on a title similar enough to count
 * as the same story. Today's entries are ignored, so reruns never block each other.
 */
export function filterRepeats(
  articles: Article[],
  history: PublishedStory[],
  today: string
): { kept: Article[]; excluded: number } {
  const windowStart = new Date(today + "T00:00:00Z").getTime() - REPEAT_WINDOW_DAYS * 86_400_000;

  const earlier = history.filter(
    (h) =>
      typeof h.link === "string" &&
      typeof h.title === "string" &&
      typeof h.date === "string" &&
      h.date < today &&
      new Date(h.date + "T00:00:00Z").getTime() >= windowStart
  );

  if (earlier.length === 0) return { kept: articles, excluded: 0 };

  const earlierLinks = new Set(earlier.map((h) => h.link));
  const earlierTokens = earlier.map((h) => significantWords(h.title));

  const kept: Article[] = [];
  let excluded = 0;

  for (const article of articles) {
    const isLinkRepeat = earlierLinks.has(article.link);
    const tokens = significantWords(article.title);
    const isTitleRepeat = earlierTokens.some(
      (t) => jaccardSimilarity(tokens, t) >= REPEAT_TITLE_THRESHOLD
    );

    if (isLinkRepeat || isTitleRepeat) {
      excluded++;
    } else {
      kept.push(article);
    }
  }

  return { kept, excluded };
}

/**
 * Adds the stories used by a published normal edition. Never throws, so a
 * recording problem cannot stop an edition from being produced. An unreadable
 * history file is left unchanged rather than overwritten.
 */
export function recordPublished(stories: PublishedStory[]): { recorded: number; error?: string } {
  try {
    const current = readHistory();
    if (current.error) {
      return { recorded: 0, error: `${current.error}; the existing file was left unchanged` };
    }

    const seen = new Set(current.entries.map((e) => e.link));
    const fresh = stories.filter((s) => !seen.has(s.link));

    const cutoff = new Date(todayUtc() + "T00:00:00Z").getTime() - KEEP_DAYS * 86_400_000;
    const merged = [...current.entries, ...fresh].filter(
      (e) => new Date(e.date + "T00:00:00Z").getTime() >= cutoff
    );

    // Write to a temporary file, then rename, so an interrupted run can't leave a half-written file.
    fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
    const tmpPath = HISTORY_PATH + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(merged, null, 2));
    fs.renameSync(tmpPath, HISTORY_PATH);

    return { recorded: fresh.length };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { recorded: 0, error: `could not write history (${reason})` };
  }
}