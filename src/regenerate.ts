import fs from "node:fs";
import path from "node:path";
import { buildEdition } from "./pipeline/build-edition";
import { renderEdition } from "./image/render";
import { appendRun } from "./pipeline/run-log";

function timeStamp(): string {
  // e.g. 2026-11-18T10-22-33 (colons are not allowed in Windows file names)
  return new Date().toISOString().slice(0, 19).replace(/:/g, "-");
}

async function main() {
  const at = new Date().toISOString();

  try {
    const built = await buildEdition();
    if (!built) {
      const error = "neither the normal nor the educational edition could be built";
      appendRun({ at, command: "regenerate", status: "failed", error });
      console.error(`[regenerate] ${error}. Nothing written.`);
      process.exit(1);
    }

    const png = await renderEdition(built.edition, undefined, built.template);

    const outDir = path.join(process.cwd(), "data/output");
    fs.mkdirSync(outDir, { recursive: true });
    const dateStamp = new Date().toISOString().slice(0, 10);
    const outPath = path.join(outDir, `edition-${dateStamp}-regen-${timeStamp()}.png`);

    // "wx" fails if the file already exists, so a previous edition can never be overwritten.
    fs.writeFileSync(outPath, png, { flag: "wx" });

    appendRun({
      at,
      command: "regenerate",
      status: "success",
      source: built.source,
      template: built.template,
      canvasHeight: built.canvasHeight,
      outputFile: outPath,
    });

    console.log(`[regenerate] done — wrote ${outPath}`);
    console.log("[regenerate] earlier editions were kept; nothing was overwritten");
    process.exit(0);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    appendRun({ at, command: "regenerate", status: "failed", error });
    console.error(`[regenerate] failed: ${error}`);
    process.exit(1);
  }
}

main();