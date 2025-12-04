import { type NextRequest, NextResponse } from "next/server";
import { fileToDataUrl, removeImageBackground } from "@/services/geminiService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const dataUrl = await fileToDataUrl(file);
    const result = await removeImageBackground(dataUrl);

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
    console.error("Error in remove-bg API:", error);
    return NextResponse.json(
      { error: "Erro ao remover fundo" },
      { status: 500 }
    );
  }
}
