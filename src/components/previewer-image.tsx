"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguageKey } from "@/hooks/use-i18n";
import { usePreviewer } from "@/providers/previewer-provider";

export function PreviewerImage() {
  const { previewImage, isPreviewerOpen, closePreviewer } = usePreviewer();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Previewer image translations
  const previewerImageTranslations = useLanguageKey("previewerImage");

  // Reset zoom and position when a new image is opened
  useEffect(() => {
    if (isPreviewerOpen && previewImage) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [previewImage, isPreviewerOpen]);

  // Close previewer when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewerOpen) {
        closePreviewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewerOpen, closePreviewer]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(0.1, Math.min(prev + delta, 5)));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.1, prev - 0.1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle click outside to close preview
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePreviewer();
    }
  };

  // Handle keyboard events for accessibility
  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closePreviewer();
    }
  };

  if (!isPreviewerOpen || !previewImage) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={previewerImageTranslations.modalLabel}
      tabIndex={-1}
    >
      <div
        ref={previewRef}
        className="w-[30%] h-full bg-background border-l shadow-lg flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold uppercase cursor-default select-none">
            {previewerImageTranslations.previewTitle}
          </h2>
          <div className="flex gap-2 items-center">
            <Button
              className="cursor-pointer"
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              aria-label={previewerImageTranslations.zoomOut}
              disabled={zoomLevel <= 0.1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              className="cursor-pointer"
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              aria-label={previewerImageTranslations.resetZoom}
            >
              {previewerImageTranslations.zoomLevel.replace(
                "{{percentage}}",
                Math.round(zoomLevel * 100).toString(),
              )}
            </Button>
            <Button
              className="cursor-pointer"
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              aria-label={previewerImageTranslations.zoomIn}
              disabled={zoomLevel >= 5}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="icon"
              onClick={closePreviewer}
              aria-label={previewerImageTranslations.closePreview}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          className="flex-grow flex items-center justify-center p-4 overflow-hidden relative bg-transparent hover:bg-transparent"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onKeyDown={(e) => {
            if (e.key === "Escape") closePreviewer();
          }}
          tabIndex={0}
          aria-label={previewerImageTranslations.previewContainer}
        >
          <div
            ref={imageRef}
            className="cursor-move"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.2s",
            }}
          >
            <Image
              src={previewImage.src}
              alt={previewImage.fileName}
              width={0}
              height={0}
              sizes="100vw"
              style={{
                transform: `rotate(${previewImage.rotation}deg)`,
                width: "auto",
                height: "auto",
                maxHeight: "100vh",
                maxWidth: "100%",
                objectFit: "contain",
              }}
              className="rounded-lg shadow-lg"
              draggable={false}
            />
          </div>
        </Button>
      </div>
    </div>
  );
}
