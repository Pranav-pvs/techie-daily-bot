import fs from "node:fs";
import path from "node:path";
import { renderEdition } from "./render";
import { THEMES } from "./themes";

async function main() {
  const outDir = path.join(process.cwd(), "data/output/themes");
  fs.mkdirSync(outDir, { recursive: true });

  const sampleEdition = {
    dateLabel: "Nov 6, 2026",
    lead: {
      headline: "Anthropic ships Claude Sonnet 5 with faster reasoning",
      summary:
        "The new model focuses on tool use and long conversations, with early benchmarks showing gains on coding tasks.",
    },
    secondary: [],
  };

  for (const theme of THEMES) {
    const png = await renderEdition(sampleEdition, theme);
    const outPath = path.join(outDir, `${theme.key}.png`);
    fs.writeFileSync(outPath, png);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});