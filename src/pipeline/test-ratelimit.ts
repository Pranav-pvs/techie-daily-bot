import { runEditorialSelectionDetailed } from "./editorial";
import type { DedupedStory } from "./dedupe";

function fakeCandidates(): DedupedStory[] {
  return Array.from({ length: 5 }, (_, i) => {
    const article = {
      id: i,
      source_id: "test",
      source_name: "Test",
      title: `Test story ${i}`,
      link: `https://example.invalid/${i}`,
      category: null,
      published_at: null,
      fetched_at: "",
      image_url: null,
    };
    return { canonical: article, sources: [article] };
  });
}

async function check(status: number, expected: string): Promise<boolean> {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: { message: "test response" } }), { status })) as typeof fetch;
  process.env.GROQ_API_KEY = "test-key";

  try {
    const outcome = await runEditorialSelectionDetailed(fakeCandidates());
    const got = outcome.result === null ? outcome.failure : "unexpected success";
    const passed = got === expected;
    console.log(`${passed ? "PASS" : "FAIL"}  HTTP ${status} -> ${got} (expected ${expected})`);
    return passed;
  } finally {
    globalThis.fetch = realFetch;
  }
}

async function main() {
  console.log("[ratelimit-test] offline check, no Groq calls made\n");
  const results = [
    await check(429, "rate-limited"),
    await check(401, "editorial-failed"),
    await check(500, "editorial-failed"),
  ];
  const allPassed = results.every(Boolean);
  console.log(`\n${allPassed ? "ALL PASSED" : "SOME CHECKS FAILED"}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});