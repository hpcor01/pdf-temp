"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLanguageKey } from "@/hooks/use-i18n";
import type { MousePreviewerImageProps } from "@/types/previewer";
import { Button } from "./ui/button";

export function MousePreviewerImage({
  image,
  position,
  onClose,
}: MousePreviewerImageProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Mouse previewer translations
  const mousePreviewerTranslations = useLanguageKey("mouse-previewer");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        previewRef.current &&
        !previewRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!image || !position) return null;

  // Calculate position to avoid going off-screen
  const calculatePosition = () => {
    if (!previewRef.current) return { top: position.y, left: position.x };

    const previewWidth = 400; // Approximate width of preview
    const previewHeight = 300; // Approximate height of preview
    const margin = 20;

    let left = position.x + 20; // Default to right of cursor
    let top = position.y - previewHeight / 2; // Center vertically on cursor

    // Adjust if preview would go off right edge
    if (left + previewWidth > window.innerWidth - margin) {
      left = position.x - previewWidth - 20; // Show to left of cursor
    }

    // Adjust if preview would go off bottom edge
    if (top + previewHeight > window.innerHeight - margin) {
      top = window.innerHeight - previewHeight - margin;
    }

    // Adjust if preview would go off top edge
    if (top < margin) {
      top = margin;
    }

    return { top, left };
  };

  const { top, left } = calculatePosition();

  return (
    <div
      ref={previewRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-2xl p-4 transition-opacity duration-200 max-h-[90vh] overflow-hidden"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        minWidth: "400px",
        maxWidth: "500px",
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm truncate">{image.fileName}</h3>
        <Button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-muted-foreground hover:text-foreground ml-2 bg-transparent border-none"
          aria-label={mousePreviewerTranslations["close-preview"]}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-0.5 bg-current rotate-45 absolute"></div>
            <div className="w-4 h-0.5 bg-current -rotate-45 absolute"></div>
          </div>
        </Button>
      </div>

      <div className="relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 max-h-[70vh]">
        <Image
          src={image.src}
          alt={image.fileName}
          width={0}
          height={0}
          sizes="100vw"
          style={{
            transform: `rotate(${image.rotation || 0}deg)`,
            width: "100%",
            height: "auto",
            maxHeight: "400px",
            objectFit: "contain",
          }}
          className="transition-transform duration-200 max-h-full w-full object-contain"
        />
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        <p>
          {mousePreviewerTranslations.rotation.replace(
            "{{degrees}}",
            (image.rotation || 0).toString()
          )}
        </p>
        {image.size && image.size > 0 && (
          <p>
            {mousePreviewerTranslations.size.replace(
              "{{size}}",
              (image.size / 1024).toFixed(2)
            )}
          </p>
        )}
      </div>
    </div>
  );
}
