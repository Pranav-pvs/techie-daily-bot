import { Edition, EditionStory } from "./render";
import { resolveStoryImage } from "./images";
import { denylistReason } from "./denylist";

export interface ResolveImagesOptions {
  includeSecondaryImages?: boolean;
}

async function resolveOneStory(story: EditionStory): Promise<EditionStory> {
  if (!story.sourceImageUrl) return story;

  const reason = denylistReason(story);
  if (reason) {
    console.warn(`[image] blocked by ${reason} — ${story.headline}`);
    return story;
  }

  const imageDataUri = await resolveStoryImage({ sourceImageUrl: story.sourceImageUrl });
  if (!imageDataUri) return story;
  return { ...story, imageDataUri };
}

export async function resolveEditionImages(
  edition: Edition,
  options: ResolveImagesOptions = {}
): Promise<Edition> {
  const { includeSecondaryImages = true } = options;

  const lead = await resolveOneStory(edition.lead);

  const secondary: EditionStory[] = includeSecondaryImages
    ? await Promise.all(edition.secondary.map(resolveOneStory))
    : [...edition.secondary];

  return { ...edition, lead, secondary };
}