import { removeBackground as removeBgGemini } from "@/services/geminiService";
import type { ImageItem } from "@/types/kanban";

export async function removeBackground(src: string): Promise<string> {
  try {
    // Parse data URL
    if (!src.startsWith("data:")) {
      console.warn("Invalid data URL, returning original");
      return src;
    }

    const [mimePart, base64Data] = src.split(",");
    const mimeType = mimePart.split(":")[1].split(";")[0];

    // Create buffer from base64
    const buffer = Buffer.from(base64Data, "base64");

    // Create File object
    const file = new File([buffer], "image.png", { type: mimeType });

    // Call Gemini service
    const result = await removeBgGemini(file);
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
