import fs from "node:fs";
import path from "node:path";
import { THEMES, Theme } from "./themes";

const STATE_PATH = path.join(process.cwd(), "data/state/theme-state.json");

interface ThemeState {
  lastThemeKey: string;
}

function readState(): ThemeState | null {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    return JSON.parse(raw) as ThemeState;
  } catch {
    return null; // no state file yet — first run
  }
}

function writeState(state: ThemeState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/** Picks a theme different from the last one used, and records the choice. */
export function pickNextTheme(): Theme {
  const prev = readState();
  const candidates = prev
    ? THEMES.filter((t) => t.key !== prev.lastThemeKey)
    : THEMES;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  writeState({ lastThemeKey: chosen.key });
  return chosen;
}