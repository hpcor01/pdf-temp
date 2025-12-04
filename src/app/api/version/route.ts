import { NextResponse } from "next/server";
import { removeImageBackground } from "@/services/geminiService";
import type { VersionResponse } from "@/types/api-update.d";

/**
 * GET /api/version
 * Returns the current build version of the application
 * This endpoint is used by the frontend to check for updates
 */
export async function GET(): Promise<NextResponse<VersionResponse>> {
  // Get the commit SHA from environment variables
  // Vercel automatically sets VERCEL_GIT_COMMIT_SHA during builds
  const version = process.env.VERCEL_GIT_COMMIT_SHA || "development";

  // Return the version with no-cache headers
  return NextResponse.json(
    { version },
    {
      headers: {
        // Prevent caching of this response
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export const dynamic = "force-dynamic"; // Ensure this route is never cached

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Chama o Gemini no servidor
    const dataUrl = await fileToDataUrl(file);
    const result = await removeImageBackground(dataUrl);

    // Retorna a imagem já com fundo removido
    return new NextResponse(result, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return NextResponse.json(
      { error: "Erro ao remover fundo" },
      { status: 500 }
    );
  }
}
