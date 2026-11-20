import "dotenv/config";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY not found — check your .env file");
    return;
  }

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    return;
  }

  const data = await res.json();
  const ids = data.data.map((m: any) => m.id).sort();
  console.log(ids.join("\n"));
}

main();