import fs from "node:fs";
import path from "node:path";
import { buildEdition } from "./pipeline/build-edition";
import { renderEdition, Edition, EditionStory } from "./image/render";
import { appendRun } from "./pipeline/run-log";

function describeStory(label: string, s: EditionStory): string[] {
  return [
    `${label}: ${s.headline}`,
    `  category: ${s.category ?? "-"} | real photo: ${s.imageDataUri ? "yes" : "no"}`,
    `  source: ${s.sourceName ?? "-"} | ${s.sourceLink ?? "-"}`,
  ];
}

function buildSummary(
  edition: Edition,
  source: "normal" | "backup",
  template: string,
  reasons: string[],
  canvasHeight: number
): string {
  const lines = [
    "TECHIE DAILY — EDITION PREVIEW (for admin review, nothing has been sent)",
    `Date: ${edition.dateLabel}`,
    `Edition type: ${source === "normal" ? "Daily Edition (real news)" : "Educational Edition (backup)"}`,
    `Layout template: ${template}`,
    `Layout reasons: ${reasons.join(" | ")}`,
    `Canvas height: ${canvasHeight}px`,
    "",
    ...describeStory("LEAD", edition.lead),
    "",
    ...edition.secondary.slice(0, 3).flatMap((s, i) => [...describeStory(`SECONDARY ${i + 1}`, s), ""]),
    `Tech By The Numbers: ${(edition.techByTheNumbers ?? []).map((s) => `${s.value} (${s.sourceName})`).join(", ") || "none"}`,
    `Tech Explained: ${edition.techExplained?.title ?? "none"}`,
    `Today's Tech Concept: ${edition.learningContent?.concept.title ?? "none"}`,
    `Build Something: ${edition.learningContent?.project.name ?? "none"}`,
    `Resource of the Day: ${edition.learningResource?.name ?? "none"}`,
    "",
    ...(source === "backup"
      ? ["NOTE: Educational Edition has no source links. Check each fact against an official reference before forwarding.", ""]
      : []),
    "CHECK BEFORE FORWARDING:",
    "- Does each photo match its story? (The code only checks that the photo came from the story's own source.)",
    "- Are headlines accurate, and do summaries match the source?",
    "- Are the numbers in Tech By The Numbers present in the headlines?",
  ];
  return lines.join("\n");
}

async function main() {
  const at = new Date().toISOString();
  console.log("[preview] building edition (no delivery, files only)...");

  try {
    const built = await buildEdition();

    if (!built) {
      const error = "both the normal edition and the educational edition failed to generate";
      appendRun({ at, command: "preview", status: "failed", error });
      console.error("[preview] could not build a normal or educational edition. Nothing written.");
      process.exit(1);
    }

    const { edition, source, template, reasons, canvasHeight } = built;
    const png = await renderEdition(edition, undefined, template);

    const outDir = path.join(process.cwd(), "data/output");
    fs.mkdirSync(outDir, { recursive: true });
    const dateStamp = new Date().toISOString().slice(0, 10);

    const pngPath = path.join(outDir, `preview-${dateStamp}.png`);
    const txtPath = path.join(outDir, `preview-${dateStamp}.txt`);
    fs.writeFileSync(pngPath, png);
    fs.writeFileSync(txtPath, buildSummary(edition, source, template, reasons, canvasHeight));

    appendRun({
      at,
      command: "preview",
      status: "success",
      source,
      template,
      canvasHeight,
      outputFile: pngPath,
    });

    console.log(`[preview] wrote ${pngPath}`);
    console.log(`[preview] wrote ${txtPath}`);
    process.exit(0);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    appendRun({ at, command: "preview", status: "failed", error });
    console.error(err);
    process.exit(1);
  }
}

main();