const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;
const ALLOWED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Downloads an image from a URL and converts it to a base64 data: URI,
 * the only form Satori can actually render. Returns null on any failure —
 * never throws — so the pipeline can always fall back to no image.
 */
export async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[image] fetch failed: HTTP ${res.status} ${res.statusText} — ${url}`);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const mime = contentType.split(";")[0].trim();
    if (!ALLOWED_CONTENT_TYPES.includes(mime)) {
      console.warn(`[image] unexpected content-type "${contentType}" — ${url}`);
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) {
      console.warn(`[image] empty response body — ${url}`);
      return null;
    }
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      console.warn(`[image] image too large (${buf.byteLength} bytes) — ${url}`);
      return null;
    }

    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[image] fetch error (${reason}) — ${url}`);
    return null;
  }
}

/**
 * Real-photo-only policy: only ever tries the known source image URL.
 * No AI-generated fallback of any kind. Returns null if no real image is
 * available — the renderer must handle that cleanly (no image, not a
 * misleading one), per TECHIE DAILY's strict real-photography requirement.
 */
export async function resolveStoryImage(story: {
  sourceImageUrl?: string | null;
}): Promise<string | null> {
  if (!story.sourceImageUrl) return null;
  return fetchImageAsDataUri(story.sourceImageUrl);
}