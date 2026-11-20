export interface Theme {
  key: string;
  name: string;
  /** Solid hex OR a Satori-supported linear-gradient() string */
  pageBackground: string;
  cardBackground: string;
  /** Optional 1px border for cards on light backgrounds (contrast) */
  cardBorder?: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Subtle glow on the accent divider — skipped on quiet themes */
  glow?: boolean;
}

export const THEMES: Theme[] = [
  {
    key: "dark-futuristic",
    name: "Dark Futuristic",
    pageBackground: "#0F0F1A",
    cardBackground: "#1A1A2E",
    accent: "#7C5CFF",
    textPrimary: "#FFFFFF",
    textSecondary: "#C8C8E0",
    textMuted: "#A0A0C0",
  },
  {
    key: "electric-blue",
    name: "Electric Blue",
    pageBackground: "linear-gradient(160deg, #04101F 0%, #0B2545 100%)",
    cardBackground: "#0F2A4A",
    accent: "#2FB8FF",
    textPrimary: "#FFFFFF",
    textSecondary: "#BFE4FF",
    textMuted: "#7FB8E0",
    glow: true,
  },
  {
    key: "neon-purple",
    name: "Neon Purple",
    pageBackground: "linear-gradient(160deg, #130A1F 0%, #2B0B3F 100%)",
    cardBackground: "#241136",
    accent: "#D946EF",
    textPrimary: "#FFFFFF",
    textSecondary: "#E9C9FF",
    textMuted: "#B48FD1",
    glow: true,
  },
  {
    key: "vibrant-orange",
    name: "Vibrant Orange",
    pageBackground: "linear-gradient(160deg, #1A0F08 0%, #3A1708 100%)",
    cardBackground: "#2A1510",
    accent: "#FF7A1A",
    textPrimary: "#FFF7F0",
    textSecondary: "#FFD4AE",
    textMuted: "#D9A379",
  },
  {
    key: "pastel-editorial",
    name: "Pastel Editorial",
    pageBackground: "#FBF6F0",
    cardBackground: "#FFFFFF",
    cardBorder: "#F0E4DA",
    accent: "#FF8FA3",
    textPrimary: "#2B2B33",
    textSecondary: "#55555E",
    textMuted: "#8A8A93",
  },
  {
    key: "cyberpunk",
    name: "Cyberpunk",
    pageBackground: "linear-gradient(160deg, #0D0221 0%, #1A0A3D 100%)",
    cardBackground: "#170B33",
    accent: "#00F5D4",
    textPrimary: "#F5F5FF",
    textSecondary: "#C9FFF2",
    textMuted: "#9D8FD9",
    glow: true,
  },
  {
    key: "minimalist-premium",
    name: "Minimalist Premium",
    pageBackground: "#111214",
    cardBackground: "#1C1D21",
    accent: "#D4AF37",
    textPrimary: "#F5F5F0",
    textSecondary: "#C9C9BE",
    textMuted: "#8E8E85",
  },
];

export function getThemeByKey(key: string): Theme | undefined {
  return THEMES.find((t) => t.key === key);
}

/** True if the value is a gradient string rather than a plain hex colour */
export function isGradient(value: string): boolean {
  return value.startsWith("linear-gradient(");
}