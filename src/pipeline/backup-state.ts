import fs from "node:fs";
import path from "node:path";

const STATE_PATH = path.join(process.cwd(), "data/state/backup-topic-state.json");

export interface BackupTopic {
  name: string;
  tag: string;
  category: string;
}

export const BACKUP_TOPICS: BackupTopic[] = [
  { name: "AI Concepts", tag: "AI Concepts", category: "AI" },
  { name: "Cybersecurity Awareness", tag: "Security", category: "Security" },
  { name: "Programming Concepts", tag: "Dev Tools", category: "Dev Tools" },
  { name: "Developer Tools", tag: "Dev Tools", category: "Dev Tools" },
  { name: "Technology History", tag: "Tech History", category: "History" },
  { name: "Scientific Discoveries", tag: "Science", category: "Science" },
  { name: "Robotics & Computing", tag: "Robotics", category: "Robotics" },
];

interface BackupState {
  lastTopicName: string;
}

function readState(): BackupState | null {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeState(state: BackupState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/** Picks a topic different from the last one used, and records the choice. */
export function pickNextBackupTopic(): BackupTopic {
  const prev = readState();
  const candidates = prev
    ? BACKUP_TOPICS.filter((t) => t.name !== prev.lastTopicName)
    : BACKUP_TOPICS;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  writeState({ lastTopicName: chosen.name });
  return chosen;
}