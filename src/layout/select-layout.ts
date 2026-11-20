export type TemplateName = "hero-led" | "text-led";

export interface LayoutConfig {
  template: TemplateName;
  reasons: string[];
}

export interface LayoutInput {
  lead: { imageDataUri?: string; category?: string };
  secondary: { imageDataUri?: string; category?: string }[];
}

/**
 * Chooses the editorial template. Pure function: no network calls, no rendering.
 * The only deciding input is whether the lead has a real photo from its own
 * source. Category is deliberately ignored.
 */
export function selectLayout(input: LayoutInput): LayoutConfig {
  const leadHasPhoto = Boolean(input.lead.imageDataUri);
  const secondaryWithPhotos = input.secondary.filter((s) => s.imageDataUri).length;

  const template: TemplateName = leadHasPhoto ? "hero-led" : "text-led";

  const reasons = [
    `lead real photo: ${leadHasPhoto ? "yes" : "no"}`,
    `secondary photos: ${secondaryWithPhotos}/${input.secondary.length}`,
    "template chosen by lead photo only",
  ];

  console.log(`[layout] template=${template} | ${reasons.join(" | ")}`);
  return { template, reasons };
}