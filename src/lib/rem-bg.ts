import { removeImageBackground } from "@/services/geminiService";
import type { ImageItem } from "@/types/kanban";

export async function removeBackground(src: string): Promise<string> {
  try {
    // Call Gemini service directly with the data URL
    const result = await removeImageBackground(src);
    return result;
  } catch (error) {
    console.error("Error in removeBackground:", error);
    // Fallback to original image
    return src;
  }
}

export async function removeBackgroundBatch(
  items: ImageItem[]
): Promise<ImageItem[]> {
  return Promise.all(
    items.map(async (item) => {
      try {
        const newSrc = await removeBackground(item.src);
        const nameWithoutExtension = item.fileName.replace(/\.[^/.]+$/, "");
        return {
          ...item,
          src: newSrc,
          fileName: `${nameWithoutExtension}.png`,
        };
      } catch (error) {
        console.error(`Error processing image ${item.fileName}:`, error);
        return item;
      }
    })
  );
}
