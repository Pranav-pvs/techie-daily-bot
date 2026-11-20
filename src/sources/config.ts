export interface SourceConfig {
  id: string;
  name: string;
  feedUrl: string;
  category?: string;
}

export const RSS_SOURCES: SourceConfig[] = [
  { id: "devto", name: "dev.to", feedUrl: "https://dev.to/feed", category: "Dev Tools" },
  { id: "techcrunch", name: "TechCrunch", feedUrl: "https://techcrunch.com/feed/" },
  { id: "theverge", name: "The Verge", feedUrl: "https://www.theverge.com/rss/index.xml" },
  { id: "wired", name: "WIRED", feedUrl: "https://www.wired.com/feed/rss" },
  { id: "lobsters", name: "Lobsters", feedUrl: "https://lobste.rs/rss", category: "Dev Tools" },
  { id: "arstechnica", name: "Ars Technica", feedUrl: "https://feeds.arstechnica.com/arstechnica/index" },
  { id: "theregister", name: "The Register", feedUrl: "https://www.theregister.com/headlines.atom" },
  { id: "mit-tech-review", name: "MIT Technology Review", feedUrl: "https://www.technologyreview.com/feed/" },
  {
    id: "google-news-ai",
    name: "Google News (AI companies)",
    feedUrl:
      "https://news.google.com/rss/search?q=Anthropic+OR+OpenAI+OR+%22Google+Gemini%22+OR+Claude+OR+ChatGPT&hl=en-US&gl=US&ceid=US:en",
    category: "AI",
  },
  // Added for broader AI/industry coverage (Part 3):
  { id: "nvidia-blog", name: "NVIDIA Blog", feedUrl: "https://blogs.nvidia.com/feed/" },
  { id: "github-blog", name: "GitHub Blog", feedUrl: "https://github.blog/feed/", category: "Dev Tools" },
  { id: "deepmind-blog", name: "Google DeepMind", feedUrl: "https://deepmind.google/blog/rss.xml", category: "AI" },
  { id: "openai-news", name: "OpenAI News", feedUrl: "https://openai.com/news/rss.xml", category: "AI" },
  { id: "huggingface-blog", name: "Hugging Face Blog", feedUrl: "https://huggingface.co/blog/feed.xml", category: "AI" },
  { id: "mistral-news", name: "Mistral AI News", feedUrl: "https://mistral.ai/news/rss", category: "AI" },
  { id: "microsoft-ai", name: "Microsoft AI News", feedUrl: "https://news.microsoft.com/source/topics/ai/feed/", category: "AI" },
];