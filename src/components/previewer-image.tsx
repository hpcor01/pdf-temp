"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PreviewerImageProps } from "@/types/previewer";
import { Button } from "./ui/button";

export function PreviewerImage({
  image,
  position,
  isClickPreview,
  onClose,
}: PreviewerImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (image) {
      setIsVisible(true);
      if (isClickPreview) {
        setZoomLevel(1);
      }
    } else {
      setIsVisible(false);
    }
  }, [image, isClickPreview]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isClickPreview && image) {
        e.preventDefault();
        setZoomLevel((prevZoom) => {
          const newZoom = e.deltaY < 0 ? prevZoom * 1.1 : prevZoom * 0.9;
          return Math.min(Math.max(0.5, newZoom), 3);
        });
      }
    };

    const previewElement = previewRef.current;
    if (previewElement && isClickPreview) {
      previewElement.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (previewElement) {
        previewElement.removeEventListener("wheel", handleWheel);
      }
    };
  }, [isClickPreview, image]);

  if (!image) return null;

  if (isClickPreview) {
    return (
      <div ref={previewRef} className="h-full bg-card flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">Image Preview</h2>
          <Button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
          <Image
            src={image.src}
            alt={image.fileName}
            width={0}
            height={0}
            sizes="100vw"
            style={{
              transform: `rotate(${image.rotation}deg) scale(${zoomLevel})`,
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              transition: "transform 0.2s ease",
            }}
            className="transition-transform duration-200"
          />
        </div>

        <div className="border-t border-border p-2 bg-card">
          <div className="text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <span className="truncate max-w-[30%]">{image.fileName}</span>
            <span>Rotation: {image.rotation}°</span>
            {image.size && image.size > 0 && (
              <span>Size: {(image.size / 1024).toFixed(2)} KB</span>
            )}
            <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (position) {
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
        className={`fixed z-50 bg-card border border-border rounded-lg shadow-2xl p-4 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
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
            className="text-muted-foreground hover:text-foreground ml-2"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={image.src}
            alt={image.fileName}
            width={0}
            height={0}
            sizes="100vw"
            style={{
              transform: `rotate(${image.rotation}deg)`,
              width: "100%",
              height: "auto",
              maxHeight: "400px",
              objectFit: "contain",
            }}
            className="transition-transform duration-200"
          />
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          <p>Position: {image.rotation}°</p>
          {image.size && image.size > 0 && (
            <p>Size: {(image.size / 1024).toFixed(2)} KB</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
