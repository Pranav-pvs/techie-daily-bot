import fs from "node:fs";
import path from "node:path";
import { renderEdition, Edition } from "../image/render";

const sample: Edition = {
  dateLabel: "Layout test",
  editionLabel: "Layout Test",
  lead: {
    headline: "Chinese AI labs train models on Nvidia Blackwell GPUs despite export controls",
    summary:
      "According to a former OpenAI engineer, several Chinese AI laboratories are using Nvidia's latest Blackwell GPUs to train large models, despite export restrictions on the technology.",
    category: "AI",
    tag: "AI",
  },
  secondary: [
    {
      headline: "Open-source protocol to curb LLM hallucinations",
      summary: "A developer introduced an open-source protocol that reduces hallucinations in model output.",
      category: "AI",
      tag: "AI",
    },
    {
      headline: "A new arXiv paper explains generative AI intuitively",
      summary: "Researchers published a short book on how generative models work, aimed at non-specialists.",
      category: "Science",
      tag: "Science",
    },
    {
      headline: "Microsoft Outlook outage disrupts users",
      summary: "A recent outage left many users unable to send or receive email for several hours.",
      category: "Security",
      tag: "Security",
    },
  ],
  techExplained: {
    title: "GPU export controls and AI research",
    body: "Export controls restrict the sale of advanced GPUs to certain countries to prevent military misuse. Researchers in affected regions must use older hardware or find other ways to train models.",
  },
  learningResource: {
    name: "MDN Web Docs",
    description: "Mozilla's reference and guides for HTML, CSS, and JavaScript.",
    difficulty: "Beginner",
    topic: "Web Development",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
  },
};

async function main() {
  const outDir = path.join(process.cwd(), "data/output");
  fs.mkdirSync(outDir, { recursive: true });

  for (const template of ["text-led", "hero-led"] as const) {
    const png = await renderEdition(sample, undefined, template);
    const outPath = path.join(outDir, `template-${template}.png`);
    fs.writeFileSync(outPath, png);
    console.log(`Wrote ${outPath}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});