import { type NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@/services/geminiService";

export async function POST(request: NextRequest) {
  try {
    console.log("API Route: Starting background removal process");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("API Route: No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("API Route: File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const result = await removeBackground(file);
    console.log("API Route: removeBackground result type:", typeof result);
    console.log("API Route: removeBackground result length:", result ? result.length : "null");
    console.log("API Route: removeBackground result starts with:", result ? result.substring(0, 50) : "null");

    if (!result) {
      console.error("API Route: No result from removeBackground");
      return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
    }

    // Check if result is a data URL
    if (!result.startsWith("data:")) {
      console.error("API Route: Result is not a valid data URL:", result.substring(0, 100));
      return NextResponse.json({ error: "Invalid image format returned" }, { status: 500 });
    }

    // Convert base64 data URL to buffer
    const base64Data = result.split(",")[1];
    if (!base64Data) {
      console.error("API Route: No base64 data found in result");
      return NextResponse.json({ error: "Invalid image data" }, { status: 500 });
    }

    const buffer = Buffer.from(base64Data, "base64");
    console.log("API Route: Buffer length:", buffer.length);

    // Verify buffer is valid image data
    if (buffer.length < 100) {
      console.error("API Route: Buffer too small, likely invalid image data");
      return NextResponse.json({ error: "Generated image data is invalid" }, { status: 500 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in gemini/remove-bg API:", errorMessage);
    console.error("Full error object:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Erro ao remover fundo", details: errorMessage },
      { status: 500 }
    );
  }
}
