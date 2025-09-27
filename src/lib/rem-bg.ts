import type { ImageItem } from "@/types/kanban";

export async function removeBackground(src: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;

  if (!apiKey) {
    console.warn(
      "NEXT_PUBLIC_REMOVE_BG_API_KEY not set, returning original image",
    );
    return src;
  }

  try {
    let imageBlob: Blob;

    if (src.startsWith("data:")) {
      const response = await fetch(src);
      imageBlob = await response.blob();
    } else {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
      }
      imageBlob = await response.blob();
    }

    const formData = new FormData();
    formData.append("image_file", imageBlob, "image.png");
    formData.append("size", "auto");

    const apiResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      throw new Error(
        `Remove.bg API error: ${apiResponse.status} ${apiResponse.statusText}`,
      );
    }

    const resultBlob = await apiResponse.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } catch (error) {
    console.error("Error removing background:", error);
    return src;
  }
}

export async function removeBackgroundBatch(
  items: ImageItem[],
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
    }),
  );
}
