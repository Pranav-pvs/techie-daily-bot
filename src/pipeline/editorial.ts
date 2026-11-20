import "dotenv/config";
import { DedupedStory } from "./dedupe";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

export interface SelectedStory {
  headline: string;
  summary: string;
  whyItMatters: string;
  tag: string;
  category: string;
  organization: string; // the company/org this story is primarily about — for diversity tracking
  sourceLink: string;
  sourceName: string;
  imageUrl: string | null;
}

export interface TechExplainedTopic {
  title: string;
  body: string;
}

export interface StatOfTheDay {
  value: string;
  label: string;
  sourceName: string;
}

interface RawSelectedStory {
  headline: string;
  summary: string;
  whyItMatters: string;
  tag: string;
  category: string;
  organization: string;
  sourceLink: string;
  sourceName: string;
}

export interface EditorialResult {
  lead: SelectedStory;
  secondary: SelectedStory[];
  techExplained: TechExplainedTopic | null;
  techByTheNumbers: StatOfTheDay[];
}

function buildPrompt(candidates: DedupedStory[]): string {
  const candidateList = candidates
    .slice(0, 30)
    .map((c, i) => {
      const sources = c.sources.map((s) => s.source_name).join(", ");
      return `${i + 1}. "${c.canonical.title}" — covered by: ${sources} — link: ${c.canonical.link}`;
    })
    .join("\n");

  return `You are editing a technology newspaper for college students called Techie Daily.

Below is a list of real, verified news items collected today. You may ONLY use information present in this list — do not invent facts, statistics, quotes, or details not shown here.

EDITORIAL RELEVANCE FILTER — apply this before considering any story:
Do not select a story merely because it mentions ChatGPT, Gemini, Claude, or another AI product by name. The story must have genuine, meaningful relevance to technology development, AI research, cybersecurity, robotics, or the technology industry itself.

- INCLUDE: new AI research, AI company announcements/product launches, AI-related cybersecurity incidents, genuine technology industry developments.
- REVIEW CAREFULLY: AI misuse stories — only include if the story's core subject is a significant technological or security issue, not merely "a crime happened and an AI tool was mentioned."
- REJECT: random crime stories that merely involve an AI tool, celebrity controversies involving AI, unrelated lawsuits, and clickbait headlines that lead with shock value rather than technological substance — even if accurately reported and genuinely on your candidate list.

DUPLICATE-EVENT CHECK — apply this across ALL candidates before selecting:
Some candidates may describe the exact same real-world announcement or event using different wording (e.g. "OpenAI unveils a cybersecurity model" and "OpenAI introduces a new AI security model" are the SAME event). Treat these as one story — select at most one of them, choosing whichever candidate has the clearer headline and more sources backing it.

COMPANY/ORGANIZATION DIVERSITY — apply this when choosing your final 4 stories:
Do not select more than 2 stories primarily about the same company or organization, unless there is a genuinely exceptional, dominant news event that justifies it. Prefer representing a mix of different organizations and technology categories across the 4 selected stories over picking 4 stories about the same company. Do not sacrifice genuine relevance just to force variety — if there truly aren't 4 diverse qualifying stories today, that's fine.

Prioritize informational value over shock value. A reader should finish each story thinking "I learned something about technology today," not "what crime story am I reading in a tech newspaper?"

CANDIDATES:
${candidateList}

Your task:
1. Select exactly 1 LEAD story (the most important/impactful) and exactly 3 SECONDARY stories, all genuinely different events (per the duplicate-event check above), favoring stories covered by multiple sources, genuine relevance to a computer science student audience, and organizational diversity (per the rule above).
2. For each selected story, write: a clean headline (can lightly rephrase the original title for clarity, but must not change its meaning), a 1-2 sentence summary, a 1-sentence "why it matters to students" line, a short category tag (choose one: AI, Security, Dev Tools, Robotics, Startups, Science), the primary company/organization the story is about (e.g. "OpenAI", "NVIDIA", "Independent/Research" if no single company applies), and copy the exact source link and source name from the list.
3. Write ONE "Tech Explained" section: a short educational explanation (50-65 words) of a technology concept connected to one of today's selected stories — explain it in simple, beginner-friendly English, include one practical example, and do NOT repeat that story's headline or summary. If nothing in today's selected stories connects to a genuinely explainable concept, set "techExplained" to null rather than forcing an unrelated topic.
4. Extract "Tech By The Numbers": look ONLY at the titles of the 4 stories you just selected (lead + 3 secondary). For each one that contains a clear, specific number (a dollar figure, a percentage, a count, a date, etc.), extract that exact number as "value", a short 3-6 word label giving context, and the story's sourceName. Do NOT look up or recall any number from outside what's already in those 4 selected titles. Include at most 3 — if fewer than 3 of the selected stories contain a clear number, return fewer, or an empty array if none do. Never estimate, round unnaturally, or supply a number that isn't explicitly present in the title.

Respond with ONLY valid JSON in exactly this shape, no other text:
{
  "lead": { "headline": "", "summary": "", "whyItMatters": "", "tag": "", "category": "", "organization": "", "sourceLink": "", "sourceName": "" },
  "secondary": [
    { "headline": "", "summary": "", "whyItMatters": "", "tag": "", "category": "", "organization": "", "sourceLink": "", "sourceName": "" }
  ],
  "techExplained": { "title": "", "body": "" } | null,
  "techByTheNumbers": [
    { "value": "", "label": "", "sourceName": "" }
  ]
}`;
}

function lookupImageUrl(sourceLink: string, candidates: DedupedStory[]): string | null {
  const match = candidates.find((c) => c.canonical.link === sourceLink);
  if (!match) {
    console.warn(`[editorial] no candidate matched sourceLink exactly: ${sourceLink}`);
    return null;
  }
  if (!match.canonical.image_url) {
    console.log(`[editorial] matched candidate for "${sourceLink}" but it has no image_url`);
    return null;
  }
  console.log(`[editorial] matched real image for: ${sourceLink}`);
  return match.canonical.image_url;
}

function attachImages(raw: RawSelectedStory, candidates: DedupedStory[]): SelectedStory {
  return { ...raw, imageUrl: lookupImageUrl(raw.sourceLink, candidates) };
}

export async function runEditorialSelection(
  candidates: DedupedStory[]
): Promise<EditorialResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[editorial] GROQ_API_KEY is not set — check your .env file");
    return null;
  }

  if (candidates.length < 4) {
    console.warn(`[editorial] only ${candidates.length} candidates available — too few for a normal edition`);
    return null;
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: buildPrompt(candidates) }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[editorial] Groq API error: HTTP ${res.status} — ${text}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[editorial] no content in Groq response");
      return null;
    }

    const parsed = JSON.parse(content) as {
      lead: RawSelectedStory;
      secondary: RawSelectedStory[];
      techExplained: TechExplainedTopic | null;
      techByTheNumbers: StatOfTheDay[] | null;
    };

    if (!parsed.lead || !Array.isArray(parsed.secondary) || parsed.secondary.length < 1) {
      console.error("[editorial] response JSON didn't match the expected shape");
      return null;
    }

    const lead = attachImages(parsed.lead, candidates);
    const secondary = parsed.secondary.map((s) => attachImages(s, candidates));

    const orgCounts = new Map<string, number>();
    for (const s of [lead, ...secondary]) {
      orgCounts.set(s.organization, (orgCounts.get(s.organization) ?? 0) + 1);
    }
    const orgSummary = [...orgCounts.entries()].map(([org, count]) => `${org}: ${count}`).join(", ");
    console.log(`[editorial] organization mix today — ${orgSummary}`);
    for (const [org, count] of orgCounts) {
      if (count > 2) {
        console.warn(`[editorial] diversity cap exceeded — "${org}" appears ${count} times (cap is 2)`);
      }
    }

    return {
      lead,
      secondary,
      techExplained: parsed.techExplained,
      techByTheNumbers: Array.isArray(parsed.techByTheNumbers) ? parsed.techByTheNumbers.slice(0, 3) : [],
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[editorial] failed: ${reason}`);
    return null;
  }
}