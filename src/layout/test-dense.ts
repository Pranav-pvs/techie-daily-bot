import fs from "node:fs";
import path from "node:path";
import { renderEdition, Edition } from "../image/render";
import { estimateCanvasHeight } from "./estimate-height";

// 1x1 solid-colour PNG, used only to measure layout. Never published.
const PLACEHOLDER_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const dense: Edition = {
  dateLabel: "Dense test",
  editionLabel: "Layout Test (dense)",
  lead: {
    headline:
      "Chinese AI labs train models on Nvidia Blackwell GPUs despite export controls and rising international tensions",
    summary:
      "According to a former OpenAI engineer, several Chinese AI laboratories are using Nvidia's latest Blackwell GPUs to train large language models, raising new questions about how export controls can be enforced in practice.",
    category: "AI",
    tag: "AI",
    imageDataUri: PLACEHOLDER_PHOTO,
  },
  secondary: [
    {
      headline:
        "Open-source protocol promises to curb hallucinations in large language models across production systems",
      summary:
        "A developer released a protocol that checks model outputs against retrieved sources, reducing invented details in real-world deployments. Early users report fewer errors on support tasks.",
      category: "AI",
      tag: "AI",
      imageDataUri: PLACEHOLDER_PHOTO,
    },
    {
      headline:
        "Microsoft Outlook outage disrupts users for hours while engineers work through a series of failed fixes",
      summary:
        "A recent outage left many users unable to send or receive email for several hours, with repeated fixes failing before service returned to normal.",
      category: "Security",
      tag: "Security",
    },
    {
      headline:
        "A new arXiv paper explains generative AI intuitively, with diagrams for readers who are not specialists",
      summary:
        "Researchers published a short book on how generative models work, aimed at non-specialists, with worked examples and plain-language explanations of the core ideas.",
      category: "Science",
      tag: "Science",
    },
  ],
  techByTheNumbers: [
    { value: "$1.4 trillion", label: "IPO valuation target", sourceName: "The Verge" },
    { value: "12 hours", label: "outage duration", sourceName: "The Register" },
    { value: "3.8", label: "model version", sourceName: "Alibaba" },
  ],
  techExplained: {
    title: "Why export controls are hard to enforce on AI chips",
    body:
      "Export controls restrict the sale of advanced chips to certain countries. Enforcement is hard because chips can be resold, rented through cloud services, or moved through third-party distributors, so a rule on paper does not always stop use in practice.",
  },
  learningContent: {
    concept: {
      title: "What is a hash table?",
      explanation:
        "A hash table stores key-value pairs. A hash function turns each key into a storage position, so lookups are usually very fast. For example, a phone app can find a contact by name without checking every entry one by one, even with thousands stored.",
    },
    project: {
      name: "Website status checker with retries",
      description:
        "A script that requests a list of websites, prints the HTTP status code for each one, and retries failed requests with a short wait between attempts.",
      startHere:
        "Fetch one URL and print the response status, then loop over a list of URLs and add a retry counter.",
    },
  },
  learningResource: {
    name: "Google ML Crash Course",
    description: "Google's free, self-paced course on core machine learning concepts, with short videos and exercises.",
    difficulty: "Beginner",
    topic: "Machine Learning",
    url: "https://developers.google.com/machine-learning/crash-course",
  },
};

async function main() {
  const height = estimateCanvasHeight(dense, "hero-led", { log: false });
  console.log(`[dense-test] estimated height ${height}px (cap is 2100px)`);

  const png = await renderEdition(dense, undefined, "hero-led");

  const outDir = path.join(process.cwd(), "data/output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "dense-test.png");
  fs.writeFileSync(outPath, png);
  console.log(`[dense-test] wrote ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});