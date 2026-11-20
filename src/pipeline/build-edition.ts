import { buildShortlist } from "./shortlist";
import { runEditorialSelection, SelectedStory } from "./editorial";
import { generateBackupEdition } from "./backup-edition";
import { getResourceOfTheDay } from "../learning/resources";
import { getDailyLearningContent } from "../learning/daily-content";
import { resolveEditionImages } from "../image/prepare";
import type { Edition, EditionStory } from "../image/render";
import { selectLayout, TemplateName } from "../layout/select-layout";
import { estimateCanvasHeight } from "../layout/estimate-height";

const MIN_STORIES_FOR_NORMAL_EDITION = 4;

export interface BuildResult {
  edition: Edition; // images resolved, learning blocks attached, ready for renderEdition
  source: "normal" | "backup";
  template: TemplateName;
  reasons: string[];
  canvasHeight: number; // the height renderEdition will use for this edition and template
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

async function buildNormalEdition(): Promise<Edition | null> {
  const { stories } = buildShortlist();

  if (stories.length < MIN_STORIES_FOR_NORMAL_EDITION) {
    console.warn(
      `[build] only ${stories.length} eligible stories (need ${MIN_STORIES_FOR_NORMAL_EDITION}+) — using the educational edition`
    );
    return null;
  }

  console.log(`[build] ${stories.length} candidates — running AI editorial selection...`);
  const editorial = await runEditorialSelection(stories);

  if (!editorial) {
    console.warn("[build] editorial selection failed — using the educational edition");
    return null;
  }

  return {
    dateLabel: todayLabel(),
    editionLabel: "Daily Edition",
    lead: toEditionStory(editorial.lead),
    secondary: editorial.secondary.slice(0, 3).map(toEditionStory),
    techExplained: editorial.techExplained ?? undefined,
    techByTheNumbers: editorial.techByTheNumbers,
  };
}

/**
 * Builds a complete edition: normal if possible, educational otherwise.
 * Returns null if neither can be produced. Never calls process.exit, so
 * each command decides how to handle failure.
 */
export async function buildEdition(): Promise<BuildResult | null> {
  let source: "normal" | "backup" = "normal";
  let edition = await buildNormalEdition();

  if (!edition) {
    source = "backup";
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
    template: layout.template,
    reasons: layout.reasons,
    canvasHeight,
  };
}