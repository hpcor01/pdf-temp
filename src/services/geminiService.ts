import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client
// API Key is injected via process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}
const ai = new GoogleGenerativeAI(apiKey);

/**
 * Converts a File/Blob/Buffer to the shape expected by the Gemini generative API.
 * Works both in browser (File) and server (Blob/Buffer) contexts.
 */
export const fileToGenerativePart = async (
  file: any
): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  // Server-side: objects from `formData.get('file')` usually have `arrayBuffer()`
  if (file && typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    return {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
  }

  // Client-side fallback: FileReader
  if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
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
  }

  // Buffer fallback
  if (Buffer.isBuffer(file)) {
    const base64Data = file.toString("base64");
    return {
      inlineData: { data: base64Data, mimeType: "image/png" },
    };
  }

  throw new Error("Unsupported file type for conversion to generative part");
};

/**
 * Sends the image to Gemini to remove the background.
 */
export const removeBackground = async (file: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    // Using gemini-2.0-flash-exp for image editing tasks
    const model = "gemini-2.0-flash-exp";

    const generativeModel = ai.getGenerativeModel({ model: model });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            imagePart,
            {
              text: "Identify the main subject in this image (it looks like an identification document). Create a new version of this image that extracts this subject perfectly and places it on a pure white background. Ensure text legibility is preserved.",
            },
          ],
        },
      ],
    });

    // Iterate through parts to find the image output
    if (
      response.response.candidates &&
      response.response.candidates[0] &&
      response.response.candidates[0].content &&
      response.response.candidates[0].content.parts
    ) {
      for (const part of response.response.candidates[0].content.parts) {
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
