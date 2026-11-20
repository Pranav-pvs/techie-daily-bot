import type { EditionStory } from "./render";

/**
 * General list: image URL fragments that were confirmed to be unrelated to
 * their story. Add an entry only after seeing it in a real edition.
 */
export const GENERAL_IMAGE_DENYLIST: { match: string; reason: string }[] = [
  {
    match: "imageId=241526",
    reason:
      "nuclear explosion photo (mushroom cloud), unrelated to OpenAI security products; seen on The Register story on 13 Nov 2026",
  },
];

/**
 * Source-specific rules: add only after the same pattern appears across
 * several editions, not from a single example.
 */
export const SOURCE_RULES: { sourceName: string; category: string; reason: string; evidence: string }[] = [];

/** Returns the reason an image should be blocked, or null if it is allowed. */
export function denylistReason(story: EditionStory): string | null {
  const url = story.sourceImageUrl ?? "";
  if (!url) return null;

  for (const entry of GENERAL_IMAGE_DENYLIST) {
    if (url.includes(entry.match)) return `general denylist: ${entry.reason}`;
  }

  for (const rule of SOURCE_RULES) {
    if (story.sourceName === rule.sourceName && story.category === rule.category) {
      return `source rule (${rule.sourceName} / ${rule.category}): ${rule.reason}`;
    }
  }

  return null;
}