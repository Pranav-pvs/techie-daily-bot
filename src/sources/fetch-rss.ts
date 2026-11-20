import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

export interface FetchedArticle {
  title: string;
  link: string;
  publishedAt: string | null;
  imageUrl: string | null;
}

function sanitizeXmlEntities(xml: string): string {
  return xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, "&amp;");
}

/** Finds the first <img src="..."> inside an HTML string, if any. */
function extractFirstImgSrc(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Tries, in order: <enclosure>, <media:thumbnail>, <media:content>, then
 * finally an inline <img> tag inside the content/description HTML — the
 * pattern many WordPress-based feeds (TechCrunch, The Verge, dev.to) use
 * instead of a dedicated media field. Never throws.
 */
function extractImageUrl(item: any): string | null {
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image/"))) {
    return item.enclosure.url;
  }

  const thumb = item.mediaThumbnail;
  if (thumb) {
    const thumbUrl = Array.isArray(thumb) ? thumb[0]?.$?.url : thumb?.$?.url;
    if (thumbUrl) return thumbUrl;
  }

  const content = item.mediaContent;
  if (content) {
    const entries = Array.isArray(content) ? content : [content];
    for (const entry of entries) {
      const url = entry?.$?.url;
      const medium = entry?.$?.medium;
      if (url && (!medium || medium === "image")) return url;
    }
  }

  const fromContentEncoded = extractFirstImgSrc(item.contentEncoded);
  if (fromContentEncoded) return fromContentEncoded;

  const fromContent = extractFirstImgSrc(item.content);
  if (fromContent) return fromContent;

  const fromDescription = extractFirstImgSrc(item.description ?? item.contentSnippet);
  if (fromDescription) return fromDescription;

  return null;
}

function mapItems(items: Parser.Item[]): FetchedArticle[] {
  return items
    .filter((item) => item.link && item.title)
    .map((item) => ({
      title: item.title!.trim(),
      link: item.link!.trim(),
      publishedAt: item.isoDate ?? item.pubDate ?? null,
      imageUrl: extractImageUrl(item),
    }));
}

export async function fetchRssSource(feedUrl: string): Promise<FetchedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return mapItems(feed.items ?? []);
  } catch (firstErr) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const rawXml = await res.text();
      const feed = await parser.parseString(sanitizeXmlEntities(rawXml));
      console.log(`[sources] recovered ${feedUrl} after sanitizing malformed XML`);
      return mapItems(feed.items ?? []);
    } catch (secondErr) {
      const reason = secondErr instanceof Error ? secondErr.message : String(secondErr);
      console.warn(`[sources] failed to fetch ${feedUrl}: ${reason}`);
      return [];
    }
  }
}