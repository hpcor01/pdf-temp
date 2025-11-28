import { removeBackground as removeBackgroundGemini } from "@/services/geminiService";
import type { ImageItem } from "@/types/kanban";

export async function removeBackground(src: string): Promise<string> {
  try {
    let imageBlob: Blob;

    if (src.startsWith("data:")) {
      const response = await fetch(src);
      imageBlob = await response.blob();
    } else {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }
      imageBlob = await response.blob();
    }

    // Convert blob to File object for Gemini service
    const file = new File([imageBlob], "image.png", { type: imageBlob.type });

    // Use Gemini AI for background removal
    return await removeBackgroundGemini(file);
  } catch (error) {
    console.error("Error removing background:", error);
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
