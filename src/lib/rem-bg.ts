import { removeBackground as removeBgGemini } from "@/services/geminiService";
import type { ImageItem } from "@/types/kanban";

export async function removeBackground(src: string): Promise<string> {
  try {
    // Parse data URL
    if (!src.startsWith("data:")) {
      console.warn("Invalid data URL, returning original");
      return src;
    }

    const parts = src.split(",");
    if (parts.length !== 2) {
      console.warn("Invalid data URL format, returning original");
      return src;
    }
    const mimePart = parts[0];
    const base64Data = parts[1];
    if (!mimePart || !base64Data) {
      console.warn("Invalid data URL parts, returning original");
      return src;
    }
    const mimeType = mimePart.split(":")[1]?.split(";")[0];
    if (!mimeType) {
      console.warn("Invalid MIME type, returning original");
      return src;
    }

    // Create buffer from base64
    const buffer = Buffer.from(base64Data, "base64");

    // Create File object using Uint8Array for compatibility
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], "image.png", { type: mimeType });

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
