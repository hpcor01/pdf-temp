"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePreviewer } from "@/providers/previewer-provider";

export function PreviewerImage() {
  const { previewImage, isPreviewerOpen, closePreviewer } = usePreviewer();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

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

  if (!isPreviewerOpen || !previewImage) {
    return null;
  }

  return (
    <div className="fixed right-0 w-[30%] h-[80vh] bg-background border-l shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold uppercase cursor-default select-none">
          Image Preview
        </h2>
        <div className="flex gap-2 items-center">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            disabled={zoomLevel <= 0.1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            disabled={zoomLevel >= 5}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="icon"
            onClick={closePreviewer}
            aria-label="Close preview"
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
        aria-label="Image preview container. Use mouse wheel to zoom, click and drag to pan"
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
  );
}
