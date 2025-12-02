import { type NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@/services/geminiService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await removeBackground(file);

    // Convert base64 data URL to buffer
    const base64Data = result.split(",")[1];
    if (!base64Data) {
      throw new Error("Invalid base64 data");
    }
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
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
