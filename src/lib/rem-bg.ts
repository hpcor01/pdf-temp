import type { ImageItem } from "@/types/kanban";

export async function removeBackground(src: string): Promise<string> {
  // Disabled: Using Gemini for background removal instead
  console.warn(
    "Remove.bg service is disabled. Using Gemini for background removal."
  );
  return src;
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
