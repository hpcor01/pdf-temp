"use client";

import { Loader2 } from "lucide-react";
import type { LoadingOverlayProps } from "@/types/loading-overlay";

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center shadow-xl">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg text-center text-gray-700 dark:text-gray-300">
          {message}
        </p>
      </div>
    </div>
  );
}
