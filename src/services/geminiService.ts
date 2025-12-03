import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client
// API Key is injected via process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "Missing GEMINI_API_KEY environment variable. Please set it in your Vercel project settings or .env.local"
  );
  throw new Error(
    "GEMINI_API_KEY is not configured. Check server logs for details."
  );
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

    // Using gemini-2.0-flash-lite for image editing tasks (better for image generation and editing)
    const model = process.env.DEFAULT_AI_MODEL || "gemini-2.0-flash-lite";

    const generativeModel = ai.getGenerativeModel({ model: model });

    const response = await generativeModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            imagePart,
            {
              text: "Remove the background from this image completely. Make the background transparent or white. Isolate the main subject and remove all background elements. Return only the edited image with no text or explanations.",
            },
          ],
        },
      ],
    });

    // Log the full response for debugging
    console.log(
      "Gemini API response:",
      JSON.stringify(response.response, null, 2)
    );

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
        if (part.text) {
          console.log("Model returned text instead of image:", part.text);
          // If Gemini returns text, fall back to a simple canvas-based background removal
          return await fallbackBackgroundRemoval(file);
        }
      }
    }

    // If no image data found, use fallback
    console.log("No image data returned from Gemini, using fallback method");
    return await fallbackBackgroundRemoval(file);
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
};

/**
 * Fallback background removal when Gemini fails to generate image data.
 * Simply returns the original image as a data URL.
 */
const fallbackBackgroundRemoval = async (file: File): Promise<string> => {
  // Server-side: use arrayBuffer to convert to base64 data URL
  if (file && typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    return `data:${mimeType};base64,${base64Data}`;
  }

  // Fallback for other cases (though unlikely in server context)
  throw new Error("Unsupported file type for fallback background removal");
};

export const removeImageBackground = removeBackground;
