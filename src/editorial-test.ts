import { buildShortlist } from "./pipeline/shortlist";
import { runEditorialSelection } from "./pipeline/editorial";

async function main() {
  const { stories } = buildShortlist();
  console.log(`Shortlist has ${stories.length} candidates — sending top 30 to Groq...`);

  const result = await runEditorialSelection(stories);

  if (!result) {
    console.log("Editorial selection failed or returned nothing — see error above.");
    return;
  }

  console.log("\n=== LEAD ===");
  console.log(result.lead);

  console.log("\n=== SECONDARY ===");
  for (const s of result.secondary) {
    console.log(s);
  }

  console.log("\n=== TECH EXPLAINED ===");
  console.log(result.techExplained ?? "(none selected)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});