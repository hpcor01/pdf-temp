import { NextResponse } from "next/server";
import type { VersionResponse } from "@/types/api-update";

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
