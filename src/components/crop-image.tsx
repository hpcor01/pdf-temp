"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageKey } from "@/hooks/use-i18n";

interface CropImageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CropImage({ isOpen, onClose }: CropImageProps) {
  const translations = useLanguageKey("crop-image");

  // Add safety check to prevent accessing properties of undefined
  if (!isOpen || !translations) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={translations["modal-label"] || "Crop image modal"}
      tabIndex={-1}
    >
      <div className="bg-background rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {translations.title || "Crop Image"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={translations.close || "Close"}
            className="cursor-pointer select-none"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-6">
          <p className="text-muted-foreground">
            {translations.description ||
              "Crop functionality will be implemented here."}
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} className="cursor-pointer select-none">
            {translations["close-button"] || "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
