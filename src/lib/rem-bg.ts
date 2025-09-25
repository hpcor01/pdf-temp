import type { ImageItem } from "@/types/kanban";

/**
 * Remove background from an image using remove.bg API
 * @param src - Image URL or dataURL
 * @returns Promise resolving to PNG dataURL with transparent background
 */
export async function removeBackground(src: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY;

  // If no API key, return original image as fallback
  if (!apiKey) {
    console.warn(
      "NEXT_PUBLIC_REMOVE_BG_API_KEY not set, returning original image",
    );
    return src;
  }

  try {
    // If src is already a dataURL, we need to convert it to a blob for the API
    let imageBlob: Blob;

    if (src.startsWith("data:")) {
      // Convert dataURL to blob
      const response = await fetch(src);
      imageBlob = await response.blob();
    } else {
      // Fetch the image as blob
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
      }
      imageBlob = await response.blob();
    }

    // Create FormData for the API request
    const formData = new FormData();
    formData.append("image_file", imageBlob, "image.png");
    formData.append("size", "auto");

    // Call remove.bg API
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

    // Get the result as blob
    const resultBlob = await apiResponse.blob();

    // Convert blob to dataURL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } catch (error) {
    console.error("Error removing background:", error);
    // Return original image as fallback
    return src;
  }
}

/**
 * Process a batch of images to remove backgrounds
 * @param items - Array of ImageItem objects
 * @returns Promise resolving to array of ImageItem objects with backgrounds removed
 */
export async function removeBackgroundBatch(
  items: ImageItem[],
): Promise<ImageItem[]> {
  return Promise.all(
    items.map(async (item) => {
      try {
        const newSrc = await removeBackground(item.src);
        // Update fileName to have .png extension while preserving the name part
        const nameWithoutExtension = item.fileName.replace(/\.[^/.]+$/, "");
        return {
          ...item,
          src: newSrc,
          fileName: `${nameWithoutExtension}.png`,
        };
      } catch (error) {
        console.error(`Error processing image ${item.fileName}:`, error);
        // Return original item if processing fails
        return item;
      }
    }),
  );
}
