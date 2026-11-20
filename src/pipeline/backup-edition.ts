import "dotenv/config";
import { Edition, EditionStory } from "../image/render";
import { pickNextBackupTopic } from "./backup-state";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

interface BackupItem {
  headline: string;
  summary: string;
  whyItMatters: string;
}

function buildBackupPrompt(topicName: string): string {
  return `You are writing the educational "backup edition" of Techie Daily, a technology newspaper for college students, used on days when there isn't enough fresh, verified news.

Today's topic area: ${topicName}

Write ONLY about well-established, broadly accurate technology knowledge — concepts, history, and practical facts that remain true regardless of today's date. Do NOT invent specific statistics, recent events, company announcements, or anything that could be mistaken for breaking news. This edition must read as clearly educational, never as news.

Write:
1. One LEAD feature: an interesting, well-known concept or fact within "${topicName}", explained engagingly for a college CS audience.
2. Three SECONDARY items: three different smaller facts, concepts, or practical tips within "${topicName}" (or closely related technology areas), each genuinely distinct from the lead and from each other.

For each of the 4 items, write: a short engaging headline, a 2-3 sentence explanation in simple English, and a 1-sentence "why it matters" line for a student.

Respond with ONLY valid JSON in exactly this shape, no other text:
{
  "lead": { "headline": "", "summary": "", "whyItMatters": "" },
  "secondary": [
    { "headline": "", "summary": "", "whyItMatters": "" }
  ]
}`;
}

/** Returns null on any failure — the caller must never publish a broken edition. */
export async function generateBackupEdition(dateLabel: string): Promise<Edition | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[backup] GROQ_API_KEY is not set — check your .env file");
    return null;
  }

  const topic = pickNextBackupTopic();
  console.log(`[backup] generating educational edition for topic: "${topic.name}"`);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: buildBackupPrompt(topic.name) }],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error(`[backup] Groq API error: HTTP ${res.status} — ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[backup] no content in Groq response");
      return null;
    }

    const parsed = JSON.parse(content) as { lead: BackupItem; secondary: BackupItem[] };

    if (!parsed.lead || !Array.isArray(parsed.secondary) || parsed.secondary.length < 1) {
      console.error("[backup] response JSON didn't match the expected shape");
      return null;
    }

    const toStory = (item: BackupItem): EditionStory => ({
      headline: item.headline,
      summary: item.summary,
      whyItMatters: item.whyItMatters,
      tag: topic.tag,
      category: topic.category,
    });

    return {
      dateLabel,
      editionLabel: "Educational Edition",
      lead: toStory(parsed.lead),
      secondary: parsed.secondary.slice(0, 3).map(toStory),
      // techExplained intentionally omitted — the whole edition is already educational
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[backup] failed: ${reason}`);
    return null;
  }
}