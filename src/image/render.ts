import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { Theme, isGradient } from "./themes";
import { pickNextTheme } from "./theme-state";
import { LIMITS, truncate } from "./limits";
import { categoryColor } from "./category-colors";
import type { LearningResource } from "../learning/resources";
import type { LearningContent } from "../learning/daily-content";
import { estimateCanvasHeight } from "../layout/estimate-height";
import type { TemplateName } from "../layout/select-layout";

const WIDTH = 1080;
const PAGE_PADDING = 48;
const CONTENT_WIDTH = WIDTH - PAGE_PADDING * 2;
const GRID_GAP = 20;
const COMPACT_COLUMN_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;

export interface EditionStory {
  headline: string;
  summary: string;
  tag?: string;
  category?: string;
  sourceImageUrl?: string | null;
  imageDataUri?: string;
  sourceLink?: string;
  sourceName?: string;
  whyItMatters?: string;
}

export interface TechExplained {
  title: string;
  body: string;
}

export interface TechByNumbersStat {
  value: string;
  label: string;
  sourceName: string;
}

export interface Edition {
  dateLabel: string;
  editionLabel?: string;
  lead: EditionStory;
  secondary: EditionStory[];
  techExplained?: TechExplained;
  techByTheNumbers?: TechByNumbersStat[];
  learningResource?: LearningResource;
  learningContent?: LearningContent;
}

function loadFont(filename: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "src/image/fonts", filename));
}

function backgroundStyle(value: string): Record<string, string> {
  return isGradient(value) ? { backgroundImage: value } : { backgroundColor: value };
}

function cardBorderStyle(theme: Theme): Record<string, string> {
  return { border: `1px solid ${theme.cardBorder ?? theme.textMuted + "33"}` };
}

// ---------- Page shell ----------

function pageShell(canvasHeight: number, theme: Theme, children: unknown[]) {
  return {
    type: "div",
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${canvasHeight}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        ...backgroundStyle(theme.pageBackground),
        padding: `${PAGE_PADDING}px`,
        color: theme.textPrimary,
        fontFamily: "Inter",
      },
      children,
    },
  };
}

// ---------- Masthead ----------

function masthead(edition: Edition, theme: Theme) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `4px solid ${theme.accent}`,
        paddingBottom: "16px",
        marginBottom: "20px",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Oswald",
                    fontSize: "42px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: theme.textPrimary,
                  },
                  children: "TECHIE DAILY",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: "15px",
                    color: theme.textMuted,
                    marginTop: "2px",
                  },
                  children: edition.editionLabel ?? "Daily Edition",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { fontFamily: "Inter", fontSize: "20px", color: theme.textMuted },
            children: edition.dateLabel,
          },
        },
      ],
    },
  };
}

// ---------- Lead story ----------

/**
 * hero-led: photo banner, then headline at 33px.
 * text-led: no photo, headline at 44px, summary at 21px, extra padding and
 * a category-coloured top rule so the text-only card still reads as the lead.
 */
function leadCard(story: EditionStory, theme: Theme, template: TemplateName) {
  const leadAccent = categoryColor(story.category, theme.accent);
  const isText = template === "text-led";
  const showImage = !isText && Boolean(story.imageDataUri);

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        ...(isText ? { borderTop: `4px solid ${leadAccent}` } : {}),
        borderRadius: "10px",
        padding: isText ? "32px" : "24px",
        marginBottom: "14px",
      },
      children: [
        ...(showImage
          ? [
              {
                type: "img",
                props: {
                  src: story.imageDataUri,
                  style: {
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "12px",
                  },
                },
              },
            ]
          : []),
        ...(story.tag
          ? [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: leadAccent,
                    marginBottom: "7px",
                    letterSpacing: "1px",
                  },
                  children: truncate(story.tag, LIMITS.secondaryTag).toUpperCase(),
                },
              },
            ]
          : []),
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: isText ? "44px" : "33px",
              fontWeight: 700,
              lineHeight: isText ? 1.12 : 1.18,
              marginBottom: isText ? "14px" : "10px",
              color: theme.textPrimary,
            },
            children: truncate(story.headline, LIMITS.leadHeadline),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: isText ? "21px" : "19px",
              color: theme.textSecondary,
              lineHeight: isText ? 1.42 : 1.4,
            },
            children: truncate(story.summary, LIMITS.leadSummary),
          },
        },
      ],
    },
  };
}

// ---------- Secondary stories ----------

function mediumSecondaryCard(story: EditionStory, theme: Theme) {
  const accent = categoryColor(story.category, theme.accent);

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderLeft: `6px solid ${accent}`,
        borderRadius: "8px",
        padding: "22px",
        marginBottom: "16px",
      },
      children: [
        ...(story.imageDataUri
          ? [
              {
                type: "img",
                props: {
                  src: story.imageDataUri,
                  style: {
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "14px",
                  },
                },
              },
            ]
          : []),
        ...(story.tag
          ? [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: accent,
                    marginBottom: "6px",
                    letterSpacing: "1px",
                  },
                  children: truncate(story.tag, LIMITS.secondaryTag).toUpperCase(),
                },
              },
            ]
          : []),
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: "28px",
              fontWeight: 700,
              lineHeight: 1.25,
              color: theme.textPrimary,
              marginBottom: "8px",
            },
            children: truncate(story.headline, LIMITS.secondaryHeadline),
          },
        },
        {
          type: "div",
          props: {
            style: { fontFamily: "Inter", fontSize: "19px", color: theme.textSecondary, lineHeight: 1.4 },
            children: truncate(story.summary, LIMITS.secondarySummary),
          },
        },
      ],
    },
  };
}

function compactSecondaryCard(story: EditionStory, theme: Theme) {
  const accent = categoryColor(story.category, theme.accent);

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${COMPACT_COLUMN_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderTop: `4px solid ${accent}`,
        borderRadius: "6px",
        padding: "16px",
      },
      children: [
        ...(story.tag
          ? [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Inter",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: accent,
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  },
                  children: truncate(story.tag, LIMITS.secondaryTag).toUpperCase(),
                },
              },
            ]
          : []),
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: 1.25,
              color: theme.textPrimary,
              marginBottom: "6px",
            },
            children: truncate(story.headline, LIMITS.compactHeadline),
          },
        },
        {
          type: "div",
          props: {
            style: { fontFamily: "Inter", fontSize: "16px", color: theme.textSecondary, lineHeight: 1.35 },
            children: truncate(story.summary, LIMITS.compactSummary),
          },
        },
      ],
    },
  };
}

/** Medium block for the first secondary story, then a two-column row for the next two. */
function secondaryGrid(secondary: EditionStory[], theme: Theme): unknown[] {
  const [featuredSecondary, ...restSecondary] = secondary.slice(0, 3);
  const compactPair = restSecondary.slice(0, 2);

  return [
    ...(featuredSecondary ? [mediumSecondaryCard(featuredSecondary, theme)] : []),
    ...(compactPair.length > 0
      ? [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: `${CONTENT_WIDTH}px`,
                marginBottom: "16px",
              },
              children: compactPair.map((s) => compactSecondaryCard(s, theme)),
            },
          },
        ]
      : []),
  ];
}

// ---------- Tech By The Numbers ----------

function statBlock(stat: TechByNumbersStat, theme: Theme, width: number) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${width}px`,
        alignItems: "flex-start",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: "32px",
              fontWeight: 700,
              color: theme.accent,
              lineHeight: 1,
              marginBottom: "4px",
            },
            children: truncate(stat.value, LIMITS.statValue),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "14px",
              color: theme.textSecondary,
              lineHeight: 1.3,
            },
            children: truncate(stat.label, LIMITS.statLabel),
          },
        },
      ],
    },
  };
}

function techByTheNumbersSection(stats: TechByNumbersStat[], theme: Theme) {
  const columnWidth = (CONTENT_WIDTH - GRID_GAP * (stats.length - 1)) / stats.length;

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "16px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "16px",
              fontWeight: 700,
              color: theme.accent,
              marginBottom: "14px",
              letterSpacing: "1px",
            },
            children: "TECH BY THE NUMBERS",
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "row", justifyContent: "space-between" },
            children: stats.map((s) => statBlock(s, theme, columnWidth)),
          },
        },
      ],
    },
  };
}

// ---------- Tech Explained ----------

function techExplainedCard(section: TechExplained, theme: Theme) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderLeft: `6px solid ${theme.accent}`,
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "14px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "15px",
              fontWeight: 700,
              color: theme.accent,
              marginBottom: "7px",
              letterSpacing: "1px",
            },
            children: "TECH EXPLAINED",
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: "22px",
              fontWeight: 700,
              lineHeight: 1.22,
              color: theme.textPrimary,
              marginBottom: "7px",
            },
            children: truncate(section.title, LIMITS.techExplainedTitle),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "17px",
              color: theme.textSecondary,
              lineHeight: 1.38,
            },
            children: truncate(section.body, LIMITS.techExplainedBody),
          },
        },
      ],
    },
  };
}

// ---------- Today's Tech Concept and Build Something ----------

function techConceptCard(content: LearningContent, theme: Theme) {
  const { concept } = content;

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderLeft: `6px solid ${theme.accent}`,
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "14px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "15px",
              fontWeight: 700,
              color: theme.accent,
              marginBottom: "7px",
              letterSpacing: "1px",
            },
            children: "TODAY'S TECH CONCEPT",
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: "22px",
              fontWeight: 700,
              lineHeight: 1.22,
              color: theme.textPrimary,
              marginBottom: "7px",
            },
            children: truncate(concept.title, LIMITS.conceptTitle),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "17px",
              color: theme.textSecondary,
              lineHeight: 1.38,
            },
            children: truncate(concept.explanation, LIMITS.conceptBody),
          },
        },
      ],
    },
  };
}

function buildProjectCard(content: LearningContent, theme: Theme) {
  const { project } = content;

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderLeft: `6px solid ${theme.accent}`,
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "14px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "15px",
              fontWeight: 700,
              color: theme.accent,
              marginBottom: "7px",
              letterSpacing: "1px",
            },
            children: "BUILD SOMETHING",
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Oswald",
              fontSize: "22px",
              fontWeight: 700,
              lineHeight: 1.22,
              color: theme.textPrimary,
              marginBottom: "7px",
            },
            children: truncate(project.name, LIMITS.projectName),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "17px",
              color: theme.textSecondary,
              lineHeight: 1.38,
            },
            children: truncate(project.description, LIMITS.projectDescription),
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "15px",
              color: theme.textMuted,
              lineHeight: 1.38,
              marginTop: "6px",
            },
            children: `Start here: ${truncate(project.startHere, LIMITS.projectStartHere)}`,
          },
        },
      ],
    },
  };
}

// ---------- Resource of the Day ----------

function resourceCard(resource: LearningResource, theme: Theme) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        ...backgroundStyle(theme.cardBackground),
        ...cardBorderStyle(theme),
        borderLeft: `6px solid ${theme.accent}`,
        borderRadius: "8px",
        padding: "18px",
        marginBottom: "14px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "14px",
              fontWeight: 700,
              color: theme.accent,
              letterSpacing: "1px",
              marginBottom: "6px",
            },
            children: "RESOURCE OF THE DAY",
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Oswald",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: theme.textPrimary,
                    marginRight: "12px",
                  },
                  children: truncate(resource.name, LIMITS.resourceName),
                },
              },
              {
                type: "div",
                props: {
                  style: { fontFamily: "Inter", fontSize: "14px", color: theme.textMuted },
                  children: `${resource.difficulty} · ${resource.topic}`,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "16px",
              color: theme.textSecondary,
              lineHeight: 1.35,
              marginBottom: "4px",
            },
            children: truncate(resource.description, LIMITS.resourceDescription),
          },
        },
        {
          type: "div",
          props: {
            style: { fontFamily: "Inter", fontSize: "14px", color: theme.textMuted },
            children: truncate(resource.url, LIMITS.resourceUrl),
          },
        },
      ],
    },
  };
}

// ---------- Footer ----------

function footer(theme: Theme) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        boxSizing: "border-box",
        width: `${CONTENT_WIDTH}px`,
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${theme.textMuted}33`,
        paddingTop: "12px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontFamily: "Inter",
              fontSize: "15px",
              fontWeight: 700,
              color: theme.textMuted,
            },
            children: "TECHIE DAILY",
          },
        },
        {
          type: "div",
          props: {
            style: { fontFamily: "Inter", fontSize: "15px", color: theme.textMuted },
            children: "The Future, Explained Today.",
          },
        },
      ],
    },
  };
}

// ---------- Entry point ----------

export async function renderEdition(
  edition: Edition,
  theme?: Theme,
  template: TemplateName = "hero-led"
): Promise<Buffer> {
  const activeTheme = theme ?? pickNextTheme();
  const canvasHeight = estimateCanvasHeight(edition, template);

  const fontRegular = loadFont("Inter-Regular.ttf");
  const fontBold = loadFont("Inter-Bold.ttf");
  const fontOswaldBold = loadFont("Oswald-Bold.ttf");

  const stats = (edition.techByTheNumbers ?? []).slice(0, 3);

  const element = pageShell(canvasHeight, activeTheme, [
    masthead(edition, activeTheme),
    leadCard(edition.lead, activeTheme, template),
    ...secondaryGrid(edition.secondary, activeTheme),
    ...(stats.length > 0 ? [techByTheNumbersSection(stats, activeTheme)] : []),
    ...(edition.techExplained ? [techExplainedCard(edition.techExplained, activeTheme)] : []),
    ...(edition.learningContent ? [techConceptCard(edition.learningContent, activeTheme)] : []),
    ...(edition.learningContent ? [buildProjectCard(edition.learningContent, activeTheme)] : []),
    ...(edition.learningResource ? [resourceCard(edition.learningResource, activeTheme)] : []),
    footer(activeTheme),
  ]);

  const svg = await satori(element as any, {
    width: WIDTH,
    height: canvasHeight,
    fonts: [
      { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
      { name: "Inter", data: fontBold, weight: 700, style: "normal" },
      { name: "Oswald", data: fontOswaldBold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  const pngData = resvg.render();
  return pngData.asPng();
}