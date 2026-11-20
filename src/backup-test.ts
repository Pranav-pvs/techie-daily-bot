import fs from "node:fs";
import path from "node:path";
import { generateBackupEdition } from "./pipeline/backup-edition";
import { resolveEditionImages } from "./image/prepare";
import { renderEdition } from "./image/render";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function main() {
  console.log("[backup-test] forcing a backup/educational edition directly...");
  const rawEdition = await generateBackupEdition(todayLabel());

  if (!rawEdition) {
    console.error("[backup-test] backup edition generation failed — see error above.");
    process.exit(1);
  }

  const edition = await resolveEditionImages(rawEdition);
  const png = await renderEdition(edition);

  const outDir = path.join(process.cwd(), "data/output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "backup-edition-test.png");
  fs.writeFileSync(outPath, png);
  console.log(`[backup-test] wrote ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});