import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { readRunLog, RunEntry } from "./pipeline/run-log";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data/output");
const STATE_DIR = path.join(ROOT, "data/state");
const FONT_DIR = path.join(ROOT, "src/image/fonts");
const DB_PATH = path.join(ROOT, "data/techie-daily.db");
const REQUIRED_FONTS = ["Inter-Regular.ttf", "Inter-Bold.ttf", "Oswald-Bold.ttf"];

// File names use the UTC date (toISOString), so "today" uses the same convention.
function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

const REASON_TEXT: Record<string, string> = {
  "rate-limited": "rate-limited by Groq (daily or per-minute limit)",
  "editorial-failed": "editorial selection failed (see the terminal output for the error)",
  "too-few-stories": "too few eligible stories",
};

function describeRun(entry: RunEntry | undefined): string[] {
  if (!entry) return ["  none recorded"];

  const lines = [`  at: ${entry.at}`, `  command: ${entry.command}`];

  if (entry.status === "failed") {
    lines.push(`  error: ${entry.error ?? "unknown"}`);
    return lines;
  }

  lines.push(
    `  edition: ${entry.source ?? "-"} | template: ${entry.template ?? "-"} | canvas: ${entry.canvasHeight ?? "-"}px`
  );

  if (entry.source === "backup") {
    const reason = entry.fallbackReason
      ? REASON_TEXT[entry.fallbackReason] ?? entry.fallbackReason
      : "not recorded (logged before fallback reasons were added)";
    lines.push(`  fallback reason: ${reason}`);
  }

  if (entry.outputFile) {
    const present = fs.existsSync(entry.outputFile);
    lines.push(`  file: ${path.basename(entry.outputFile)} (${present ? "present" : "MISSING"})`);
  }
  return lines;
}

function checkJsonFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return "not created yet (normal on a first run)";
  try {
    JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return "readable";
  } catch {
    return "UNREADABLE: file exists but is not valid JSON";
  }
}

function todaysFiles(): string[] {
  if (!fs.existsSync(OUTPUT_DIR)) return ["  output folder missing"];

  const stamp = todayStamp();
  const files = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.includes(stamp) && (name.endsWith(".png") || name.endsWith(".txt")))
    .sort();

  if (files.length === 0) return ["  none yet"];
  return files.map((name) => `  ${name}`);
}

function fontChecks(): string[] {
  return REQUIRED_FONTS.map(
    (font) => `  ${font}: ${fs.existsSync(path.join(FONT_DIR, font)) ? "present" : "MISSING"}`
  );
}

function main(): void {
  const runs = readRunLog();
  const lastSuccess = [...runs].reverse().find((r) => r.status === "success");
  const lastFailure = [...runs].reverse().find((r) => r.status === "failed");
  const lastFallback = [...runs].reverse().find((r) => r.status === "success" && r.source === "backup");

  const report = [
    "TECHIE DAILY — STATUS (local checks only, nothing was changed)",
    `Checked at: ${new Date().toISOString()}`,
    "",
    "LAST SUCCESSFUL RUN:",
    ...describeRun(lastSuccess),
    "",
    "LAST FAILED RUN:",
    ...describeRun(lastFailure),
    "",
    "LAST EDUCATIONAL-EDITION FALLBACK:",
    ...describeRun(lastFallback),
    "",
    `RUN LOG: ${runs.length} entries (generate, preview, and regenerate are all logged).`,
    "",
    `TODAY'S FILES (${todayStamp()}, UTC date used in file names):`,
    ...todaysFiles(),
    "",
    "FILES AND STATE:",
    ...fontChecks(),
    `  database: ${fs.existsSync(DB_PATH) ? "present" : "MISSING"}`,
    `  theme state: ${checkJsonFile(path.join(STATE_DIR, "theme-state.json"))}`,
    `  backup topic state: ${checkJsonFile(path.join(STATE_DIR, "backup-topic-state.json"))}`,
    `  run log: ${checkJsonFile(path.join(STATE_DIR, "run-log.json"))}`,
    "",
    "CONFIGURATION:",
    `  GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "set (value not shown)" : "NOT SET: check your .env file"}`,
    "  WhatsApp delivery: NOT IMPLEMENTED. The delivery method has not been decided (Architecture.md section 3.1).",
  ];

  console.log(report.join("\n"));
}

main();