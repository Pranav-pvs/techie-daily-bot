import type { Edition } from "../image/render";
import { LIMITS, truncate } from "../image/limits";
import type { TemplateName } from "./select-layout";

export const MIN_CANVAS_HEIGHT = 1100;
export const MAX_CANVAS_HEIGHT = 2100;

const SAFETY_MARGIN = 0;
const CONTENT_WIDTH = 984;
const WRAP_FACTOR = 1.0;

const CHAR_EM = { inter: 0.56, oswald: 0.45 } as const;
type Face = keyof typeof CHAR_EM;

export interface EstimateOptions {
  /** Set to false to compute silently, e.g. when the height is only needed for a summary. */
  log?: boolean;
}

function textHeight(text: string, fontPx: number, lineHeight: number, widthPx: number, face: Face): number {
  const charsPerLine = Math.max(1, Math.floor(widthPx / (fontPx * CHAR_EM[face])));
  const lines = Math.max(1, Math.ceil((text.length * WRAP_FACTOR) / charsPerLine));
  return lines * fontPx * lineHeight;
}

export function estimateCanvasHeight(
  edition: Edition,
  template: TemplateName = "hero-led",
  options: EstimateOptions = {}
): number {
  const [medium, ...rest] = edition.secondary.slice(0, 3);
  const compact = rest.slice(0, 2);
  const stats = (edition.techByTheNumbers ?? []).slice(0, 3);
  const isText = template === "text-led";

  // Root padding (48px top + bottom) and the masthead.
  let total = 96 + 115;

  // Lead card.
  const leadInner = CONTENT_WIDTH - (isText ? 64 : 48);
  total += isText ? 68 : 48;
  if (!isText && edition.lead.imageDataUri) total += 120 + 12;
  if (edition.lead.tag) total += 24 + 7;

  const headlineSize = isText ? 44 : 33;
  const headlineLH = isText ? 1.12 : 1.18;
  const headlineGap = isText ? 14 : 10;
  total +=
    textHeight(truncate(edition.lead.headline, LIMITS.leadHeadline), headlineSize, headlineLH, leadInner, "oswald") +
    headlineGap;

  const summarySize = isText ? 21 : 19;
  const summaryLH = isText ? 1.42 : 1.4;
  total += textHeight(truncate(edition.lead.summary, LIMITS.leadSummary), summarySize, summaryLH, leadInner, "inter");
  total += 14;

  // Medium secondary card.
  if (medium) {
    const innerWidth = CONTENT_WIDTH - 50;
    total += 44 + 16;
    if (medium.imageDataUri) total += 120 + 14;
    if (medium.tag) total += 16 * 1.2 + 6;
    total += textHeight(truncate(medium.headline, LIMITS.secondaryHeadline), 28, 1.25, innerWidth, "oswald") + 8;
    total += textHeight(truncate(medium.summary, LIMITS.secondarySummary), 19, 1.4, innerWidth, "inter");
    total += 16;
  }

  // Compact pair row.
  if (compact.length > 0) {
    const colInner = (CONTENT_WIDTH - 20) / 2 - 32;
    const heights = compact.map((s) => {
      let h = 32;
      if (s.tag) h += 14 * 1.2 + 6;
      h += textHeight(truncate(s.headline, LIMITS.compactHeadline), 20, 1.25, colInner, "oswald") + 6;
      h += textHeight(truncate(s.summary, LIMITS.compactSummary), 16, 1.35, colInner, "inter");
      return h;
    });
    total += Math.max(...heights) + 16;
  }

  // Tech By The Numbers.
  if (stats.length > 0) {
    total += 40 + 16 * 1.2 + 14 + 32 + 4 + 14 * 1.3 + 16;
  }

  // Tech Explained.
  if (edition.techExplained) {
    const innerWidth = CONTENT_WIDTH - 46;
    total += 40 + 15 * 1.2 + 7;
    total += textHeight(truncate(edition.techExplained.title, LIMITS.techExplainedTitle), 22, 1.22, innerWidth, "oswald") + 7;
    total += textHeight(truncate(edition.techExplained.body, LIMITS.techExplainedBody), 17, 1.38, innerWidth, "inter");
    total += 14;
  }

  // Today's Tech Concept and Build Something.
  if (edition.learningContent) {
    const { concept, project } = edition.learningContent;
    const innerWidth = CONTENT_WIDTH - 46;

    total += 40 + 15 * 1.2 + 7;
    total += textHeight(truncate(concept.title, LIMITS.conceptTitle), 22, 1.22, innerWidth, "oswald") + 7;
    total += textHeight(truncate(concept.explanation, LIMITS.conceptBody), 17, 1.38, innerWidth, "inter");
    total += 14;

    total += 40 + 15 * 1.2 + 7;
    total += textHeight(truncate(project.name, LIMITS.projectName), 22, 1.22, innerWidth, "oswald") + 7;
    total += textHeight(truncate(project.description, LIMITS.projectDescription), 17, 1.38, innerWidth, "inter");
    total += 6;
    total += textHeight(truncate(project.startHere, LIMITS.projectStartHere), 15, 1.38, innerWidth, "inter");
    total += 14;
  }

  // Resource of the Day.
  if (edition.learningResource) {
    const innerWidth = CONTENT_WIDTH - 42;
    total += 36 + 14 * 1.2 + 6 + 22 * 1.2 + 4;
    total += textHeight(truncate(edition.learningResource.description, LIMITS.resourceDescription), 16, 1.35, innerWidth, "inter") + 4;
    total += 14 * 1.2 + 14;
  }

  // Footer.
  total += 1 + 12 + 15 * 1.2;

  const estimated = Math.ceil(total + SAFETY_MARGIN);
  const clamped = Math.min(MAX_CANVAS_HEIGHT, Math.max(MIN_CANVAS_HEIGHT, estimated));

  if (options.log !== false) {
    if (estimated > MAX_CANVAS_HEIGHT) {
      console.warn(`[layout] estimated height ${estimated}px exceeds maximum ${MAX_CANVAS_HEIGHT}px — content may clip`);
    }
    console.log(`[layout] canvas height ${clamped}px (estimated ${estimated}px, template ${template})`);
  }

  return clamped;
}