import { useEffect } from "react";
import type { UseSaveLocationProps } from "@/types/save-location";

export function useSaveLocation({ showToast }: UseSaveLocationProps) {
  // Load save folder path from session storage on component mount
  useEffect(() => {
    const savedPath = sessionStorage.getItem("saveFolderPath");
    if (savedPath) {
      // Remove the saved folder path from session storage
      sessionStorage.removeItem("saveFolderPath");
      // Show toast notification when a saved folder path is found and removed
      showToast(
        "default",
        "Pasta de salvamento limpa",
        `A pasta "${savedPath}" foi removida da sessão atual.`,
      );
    }
  }, [showToast]);

  // Save folder path to session storage whenever it changes
  useEffect(() => {
    const savedPath = sessionStorage.getItem("saveFolderPath");
    if (savedPath) {
      sessionStorage.removeItem("saveFolderPath");
    }
  }, []);

  return {};
}
