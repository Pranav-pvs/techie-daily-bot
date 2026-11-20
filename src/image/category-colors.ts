export const CATEGORY_COLORS: Record<string, string> = {
  AI: "#6D28D9",         // purple
  "Dev Tools": "#087E8B", // teal — mapped from the spec's "Technology"
  Startups: "#D97706",    // amber
  Security: "#BE123C",    // red (cybersecurity)
  Science: "#2563EB",     // blue
  Robotics: "#15803D",    // green
};

/** Returns the fixed category color, or the theme's accent as a fallback
 * for any category not in the list (e.g. a new one the editorial AI invents). */
export function categoryColor(category: string | undefined, themeAccent: string): string {
  if (!category) return themeAccent;
  return CATEGORY_COLORS[category] ?? themeAccent;
}