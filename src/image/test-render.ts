import fs from "node:fs";
import path from "node:path";
import { renderEdition } from "./render";
import { resolveEditionImages } from "./prepare";

async function main() {
  const rawEdition = {
    dateLabel: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    lead: {
      headline: "Anthropic ships Claude Sonnet 5 with faster reasoning",
      summary:
        "The new model focuses on tool use and long conversations, with early benchmarks showing gains on coding tasks.",
      category: "AI",
    },
    secondary: [
      {
        tag: "Security",
        category: "Security",
        headline: "Critical flaw found in popular npm package",
        summary: "Maintainers pushed a patch within hours; update if you depend on it.",
      },
      {
        tag: "Dev Tools",
        headline: "New VS Code extension speeds up TypeScript checks",
        summary: "Early benchmarks show a 3x drop in project-wide type-check time.",
      },
      {
        tag: "AI",
        category: "AI",
        headline: "Open-source model matches GPT-4 on coding benchmarks",
        summary: "Released under a permissive license, runnable on consumer GPUs.",
      },
    ],
    techExplained: {
      title: "What's a Context Window?",
      body:
        "Every AI model can only 'remember' a limited stretch of text at once — that's its context window. A small one forgets what you said earlier in a long chat. Bigger windows, like the ones powering today's assistants, let you paste a whole codebase or document and get an answer that actually accounts for all of it, not just the last few lines.",
    },
  };

  console.log("Resolving images (this calls Pollinations.ai several times — may take 20-40s)...");
  const edition = await resolveEditionImages(rawEdition);

  const png = await renderEdition(edition);

  const outDir = path.join(process.cwd(), "data/output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "test-edition.png");
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});