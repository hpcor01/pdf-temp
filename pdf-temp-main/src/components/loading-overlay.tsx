"use client";

import { Loader2 } from "lucide-react";
import type { LoadingOverlayProps } from "@/types/loading-overlay";

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 sm:p-10 flex flex-col items-center shadow-2xl border border-gray-200 dark:border-neutral-700">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 dark:text-blue-400 mb-6" />
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100 text-center">
          {message}
        </p>
      </div>
    </div>
  );
}
