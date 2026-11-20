import fs from "node:fs";
import path from "node:path";
import { buildEdition } from "./build-edition";
import { renderEdition } from "../image/render";

const GROQ_HOST = "api.groq.com";

const stubEducationalJson = JSON.stringify({
  lead: {
    headline: "Test educational lead story",
    summary: "A test summary for the educational lead, used only to check the fallback path.",
    whyItMatters: "Test only.",
  },
  secondary: [
    { headline: "Test secondary one", summary: "Test summary one.", whyItMatters: "Test only." },
    { headline: "Test secondary two", summary: "Test summary two.", whyItMatters: "Test only." },
    { headline: "Test secondary three", summary: "Test summary three.", whyItMatters: "Test only." },
  ],
});

async function main() {
  const realFetch = globalThis.fetch;

  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes(GROQ_HOST)) {
      const body = JSON.parse(init?.body ?? "{}");
      const prompt: string = body.messages?.[0]?.content ?? "";
      if (prompt.includes("EDITORIAL RELEVANCE FILTER")) {
        // The news editorial call: simulate Groq's rate limit.
        return new Response(JSON.stringify({ error: { message: "simulated rate limit" } }), { status: 429 });
      }
      // The educational-edition call: return a valid stub.
      return new Response(
        JSON.stringify({ choices: [{ message: { content: stubEducationalJson } }] }),
        { status: 200 }
      );
    }
    // Everything else (article images) uses the real network.
    return realFetch(input, init);
  }) as typeof fetch;

  let built;
  try {
    built = await buildEdition();
  } finally {
    globalThis.fetch = realFetch;
  }

  if (!built) {
    console.log("FAIL  buildEdition returned nothing");
    process.exit(1);
  }

  const passed = built.source === "backup" && built.fallbackReason === "rate-limited";
  console.log(
    `${passed ? "PASS" : "FAIL"}  source=${built.source}, fallbackReason=${built.fallbackReason ?? "none"} (expected backup / rate-limited)`
  );

  const png = await renderEdition(built.edition, undefined, built.template);
  const outDir = path.join(process.cwd(), "data/output");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "fallback-test.png");
  fs.writeFileSync(outPath, png);
  console.log(`[fallback-test] wrote ${outPath}`);

  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});