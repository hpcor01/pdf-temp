"use client";

import { RefreshCw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PreviewerImageProps } from "@/types/previewer";
import { Button } from "./ui/button";

export function PreviewerImage({
  image,
  isClickPreview,
  onClose,
}: PreviewerImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [_initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (image) {
      setIsVisible(true);
      setZoomLevel(1);
      setRotation(image.rotation || 0);
      setImagePosition({ x: 0, y: 0 });
      setInitialPosition({ x: 0, y: 0 });
    } else {
      setIsVisible(false);
    }
  }, [image]);

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
          return Math.min(Math.max(0.1, newZoom), 5);
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

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.1));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
    setInitialPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setImagePosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setInitialPosition(imagePosition);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, imagePosition]);

  if (!image) return null;

  // Only render for click/zoom previews, not hover previews
  if (isClickPreview) {
    return (
      <div ref={previewRef} className="h-[80vh] bg-card flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">Image Preview</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleZoomOut}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              onClick={handleZoomIn}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              onClick={handleRotate}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Rotate image"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Reset view"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          className="flex-grow flex items-center justify-center p-4 overflow-hidden cursor-grab active:cursor-grabbing bg-transparent border-none"
          onMouseDown={handleMouseDown}
          aria-label="Pan image"
        >
          <div
            ref={imageRef}
            style={{
              transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
            }}
          >
            <Image
              src={image.src}
              alt={image.fileName}
              width={0}
              height={0}
              sizes="100vw"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transition: isDragging ? "none" : "transform 0.2s ease",
              }}
              className="transition-transform duration-200 max-h-full max-w-full"
              draggable={false}
            />
          </div>
        </Button>

        <div className="border-t border-border p-2 bg-card">
          <div className="text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <span className="truncate max-w-[30%]">{image.fileName}</span>
            <span>Rotation: {rotation}°</span>
            {image.size && image.size > 0 && (
              <span>Size: {(image.size / 1024).toFixed(2)} KB</span>
            )}
            <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything for hover previews in this component
  return null;
}
