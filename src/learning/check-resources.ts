import { LEARNING_RESOURCES } from "./resources";

async function checkUrl(url: string): Promise<string> {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    // Some sites reject HEAD requests; retry once with GET before calling it broken.
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000) });
    }
    return res.ok ? `OK (${res.status})` : `HTTP ${res.status}`;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return `ERROR: ${reason}`;
  }
}

async function main() {
  for (const resource of LEARNING_RESOURCES) {
    const status = await checkUrl(resource.url);
    console.log(`${status.startsWith("OK") ? "✅" : "❌"} ${resource.name} — ${status} — ${resource.url}`);
  }
  process.exit(0);
}

main();