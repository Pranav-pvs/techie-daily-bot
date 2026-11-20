import { denylistReason } from "./image/denylist";

const story = {
  headline: "OpenAI launches security products",
  summary: "test",
  sourceName: "The Register",
  category: "Security",
  sourceImageUrl: "https://image.theregister.com/?imageId=241526&width=800",
};

const reason = denylistReason(story);
console.log(reason ? `BLOCKED: ${reason}` : "NOT BLOCKED: denylist did not match");
process.exit(0);