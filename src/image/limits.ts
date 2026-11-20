export const LIMITS = {
  leadHeadline: 90,
  leadSummary: 160,
  secondaryHeadline: 55,
  secondarySummary: 100,
  secondaryTag: 20,
  techExplainedTitle: 55,
  techExplainedBody: 260,
  compactHeadline: 42,
  compactSummary: 65,
  statValue: 20,
  statLabel: 28,
  resourceName: 30,
  resourceDescription: 95,
  resourceUrl: 70,
  conceptTitle: 40,
  conceptBody: 240,
  projectName: 40,
  projectDescription: 150,
  projectStartHere: 120,
} as const;

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const sliced = value.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return safe.trimEnd() + "…";
}