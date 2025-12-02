import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client
// API Key is injected via process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}
const ai = new GoogleGenerativeAI(apiKey);

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (
  file: File
): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = reader.result.split(",")[1];
        if (!base64Data) {
          reject(new Error("Invalid data URL format"));
          return;
        }
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file as string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sends the image to Gemini to remove the background.
 */
export const removeBackground = async (file: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    // Using gemini-2.0-flash-exp for image editing tasks
    const model = "gemini-2.0-flash-exp";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          imagePart,
          {
            text: "Identify the main subject in this image (it looks like an identification document). Create a new version of this image that extracts this subject perfectly and places it on a pure white background. Ensure text legibility is preserved.",
          },
        ],
      },
    });

    // Iterate through parts to find the image output
    if (
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content &&
      response.candidates[0].content.parts
    ) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || "image/png";
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from the model.");
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
};

export const removeImageBackground = removeBackground;
