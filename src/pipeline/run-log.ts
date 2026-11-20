import fs from "node:fs";
import path from "node:path";

const LOG_PATH = path.join(process.cwd(), "data/state/run-log.json");
const MAX_ENTRIES = 200;

export interface RunEntry {
  at: string;
  command: "generate" | "preview" | "regenerate";
  status: "success" | "failed";
  source?: "normal" | "backup";
  template?: string;
  canvasHeight?: number;
  outputFile?: string;
  error?: string;
}

/** Returns the stored runs, or an empty list if the log is missing or unreadable. */
export function readRunLog(): RunEntry[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Appends one run. Never throws, so a logging problem cannot stop an edition from being produced. */
export function appendRun(entry: RunEntry): void {
  try {
    const runs = readRunLog();
    runs.push(entry);
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.writeFileSync(LOG_PATH, JSON.stringify(runs.slice(-MAX_ENTRIES), null, 2));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[log] could not record this run: ${reason}`);
  }
}