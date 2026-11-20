import fs from "node:fs";
import path from "node:path";
import { buildEdition } from "./pipeline/build-edition";
import { renderEdition } from "./image/render";
import { appendRun } from "./pipeline/run-log";

async function main() {
  const at = new Date().toISOString();
  console.log("[generate] building edition...");

  try {
    const built = await buildEdition();

    if (!built) {
      const error = "both the normal edition and the educational edition failed to generate";
      appendRun({ at, command: "generate", status: "failed", error });
      console.error(
        "[generate] both the normal edition and the educational edition failed to generate. Stopping rather than publishing nothing or something broken."
      );
      process.exit(1);
    }

    const { edition, source, template, canvasHeight } = built;
    if (source === "backup") {
      console.log("[generate] published as Educational Edition (no normal edition available today)");
    }

    console.log("[generate] rendering newspaper image...");
    const png = await renderEdition(edition, undefined, template);

    const outDir = path.join(process.cwd(), "data/output");
    fs.mkdirSync(outDir, { recursive: true });
    const dateStamp = new Date().toISOString().slice(0, 10);
    const outPath = path.join(outDir, `edition-${dateStamp}.png`);
    fs.writeFileSync(outPath, png);

    appendRun({
      at,
      command: "generate",
      status: "success",
      source,
      template,
      canvasHeight,
      outputFile: outPath,
    });

    console.log(`[generate] done — wrote ${outPath}`);
    process.exit(0);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    appendRun({ at, command: "generate", status: "failed", error });
    console.error(err);
    process.exit(1);
  }
}

main();