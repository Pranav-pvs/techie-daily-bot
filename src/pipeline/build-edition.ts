import { buildShortlist } from "./shortlist";
import { runEditorialSelectionDetailed, SelectedStory } from "./editorial";
import { generateBackupEdition } from "./backup-edition";
import { getResourceOfTheDay } from "../learning/resources";
import { getDailyLearningContent } from "../learning/daily-content";
import { resolveEditionImages } from "../image/prepare";
import type { Edition, EditionStory } from "../image/render";
import { selectLayout, TemplateName } from "../layout/select-layout";
import { estimateCanvasHeight } from "../layout/estimate-height";
import { PublishedStory, todayUtc } from "./published-history";

const MIN_STORIES_FOR_NORMAL_EDITION = 4;

export type FallbackReason = "too-few-stories" | "rate-limited" | "editorial-failed";

export interface BuildResult {
  edition: Edition; // images resolved, learning blocks attached, ready for renderEdition
  source: "normal" | "backup";
  fallbackReason?: FallbackReason; // set only when source is "backup"
  template: TemplateName;
  reasons: string[];
  canvasHeight: number;
  published: PublishedStory[]; // normal editions only: the original articles this edition used
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toEditionStory(s: SelectedStory): EditionStory {
  return {
    headline: s.headline,
    summary: s.summary,
    tag: s.tag,
    category: s.category,
    sourceLink: s.sourceLink,
    sourceName: s.sourceName,
    whyItMatters: s.whyItMatters,
    sourceImageUrl: s.imageUrl,
  };
}

type NormalResult =
  | { ok: true; edition: Edition; published: PublishedStory[] }
  | { ok: false; reason: FallbackReason };

async function buildNormalEdition(): Promise<NormalResult> {
  const { stories } = buildShortlist();

  if (stories.length < MIN_STORIES_FOR_NORMAL_EDITION) {
    console.warn(
      `[build] only ${stories.length} eligible stories (need ${MIN_STORIES_FOR_NORMAL_EDITION}+) — using the educational edition`
    );
    return { ok: false, reason: "too-few-stories" };
  }

  console.log(`[build] ${stories.length} candidates — running AI editorial selection...`);
  const outcome = await runEditorialSelectionDetailed(stories);

  if (!outcome.result) {
    const reason: FallbackReason = outcome.failure ?? "editorial-failed";
    console.warn(
      reason === "rate-limited"
        ? "[build] editorial selection rate-limited by Groq — using the educational edition"
        : "[build] editorial selection failed — using the educational edition"
    );
    return { ok: false, reason };
  }

  const editorial = outcome.result;

  // Map each selected story back to its original article, so repeat prevention
  // compares real article titles and links. Falls back to what the AI returned.
  const published: PublishedStory[] = [editorial.lead, ...editorial.secondary].map((s) => {
    const match = stories.find((st) => st.canonical.link === s.sourceLink);
    return {
      date: todayUtc(),
      link: match?.canonical.link ?? s.sourceLink,
      title: match?.canonical.title ?? s.headline,
    };
  });

  return {
    ok: true,
    published,
    edition: {
      dateLabel: todayLabel(),
      editionLabel: "Daily Edition",
      lead: toEditionStory(editorial.lead),
      secondary: editorial.secondary.slice(0, 3).map(toEditionStory),
      techExplained: editorial.techExplained ?? undefined,
      techByTheNumbers: editorial.techByTheNumbers,
    },
  };
}

/**
 * Builds a complete edition: normal if possible, educational otherwise.
 * Returns null if neither can be produced. Never calls process.exit, so
 * each command decides how to handle failure.
 */
export async function buildEdition(): Promise<BuildResult | null> {
  let source: "normal" | "backup" = "normal";
  let fallbackReason: FallbackReason | undefined;
  let published: PublishedStory[] = [];
  let edition: Edition | null = null;

  const normal = await buildNormalEdition();
  if (normal.ok) {
    edition = normal.edition;
    published = normal.published;
  } else {
    source = "backup";
    fallbackReason = normal.reason;
    edition = await generateBackupEdition(todayLabel());
  }

  if (!edition) return null;

  edition.learningResource = getResourceOfTheDay();
  edition.learningContent = getDailyLearningContent();

  const resolved = await resolveEditionImages(edition);
  const layout = selectLayout(resolved);
  const canvasHeight = estimateCanvasHeight(resolved, layout.template, { log: false });

  return {
    edition: resolved,
    source,
    fallbackReason,
    template: layout.template,
    reasons: layout.reasons,
    canvasHeight,
    published,
  };
}