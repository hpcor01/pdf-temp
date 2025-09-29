"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguageKey } from "@/hooks/use-i18n";

interface CropImageProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

export function CropImage({
  isOpen,
  imageSrc,
  onClose,
  onSave,
}: CropImageProps) {
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  // Crop image translations
  const cropImageTranslations = useLanguageKey("crop-image");

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle crop area movement
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropAreaRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCropX = cropArea.x;
    const startCropY = cropArea.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newX = startCropX + deltaX;
      let newY = startCropY + deltaY;

      // Boundary checks
      newX = Math.max(0, Math.min(newX, containerRect.width - cropArea.width));
      newY = Math.max(
        0,
        Math.min(newY, containerRect.height - cropArea.height)
      );

      setCropArea((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle resize handles
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startCrop = { ...cropArea };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newCrop = { ...startCrop };

      // Minimum crop area size
      const minSize = 50;

      switch (direction) {
        case "nw": // Top-left
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaX,
              startCrop.x + startCrop.width - minSize
            )
          );
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaY,
              startCrop.y + startCrop.height - minSize
            )
          );
          newCrop.width = Math.max(minSize, startCrop.width - deltaX);
          newCrop.height = Math.max(minSize, startCrop.height - deltaY);
          break;
        case "ne": // Top-right
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaY,
              startCrop.y + startCrop.height - minSize
            )
          );
          newCrop.width = Math.max(minSize, startCrop.width + deltaX);
          newCrop.height = Math.max(minSize, startCrop.height - deltaY);
          break;
        case "sw": // Bottom-left
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaX,
              startCrop.x + startCrop.width - minSize
            )
          );
          newCrop.width = Math.max(minSize, startCrop.width - deltaX);
          newCrop.height = Math.max(minSize, startCrop.height + deltaY);
          break;
        case "se": // Bottom-right
          newCrop.width = Math.max(minSize, startCrop.width + deltaX);
          newCrop.height = Math.max(minSize, startCrop.height + deltaY);
          break;
        case "n": // Top
          newCrop.y = Math.max(
            0,
            Math.min(
              startCrop.y + deltaY,
              startCrop.y + startCrop.height - minSize
            )
          );
          newCrop.height = Math.max(minSize, startCrop.height - deltaY);
          break;
        case "s": // Bottom
          newCrop.height = Math.max(minSize, startCrop.height + deltaY);
          break;
        case "w": // Left
          newCrop.x = Math.max(
            0,
            Math.min(
              startCrop.x + deltaX,
              startCrop.x + startCrop.width - minSize
            )
          );
          newCrop.width = Math.max(minSize, startCrop.width - deltaX);
          break;
        case "e": // Right
          newCrop.width = Math.max(minSize, startCrop.width + deltaX);
          break;
      }

      // Boundary checks
      if (newCrop.x < 0) {
        newCrop.width += newCrop.x;
        newCrop.x = 0;
      }

      if (newCrop.y < 0) {
        newCrop.height += newCrop.y;
        newCrop.y = 0;
      }

      if (newCrop.x + newCrop.width > containerRect.width) {
        newCrop.width = containerRect.width - newCrop.x;
      }

      if (newCrop.y + newCrop.height > containerRect.height) {
        newCrop.height = containerRect.height - newCrop.y;
      }

      setCropArea(newCrop);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Perform the actual cropping
  const handleSave = () => {
    if (!imageRef.current) return;

    const image = imageRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Calculate crop area relative to the actual image dimensions
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedImage = canvas.toDataURL("image/jpeg");
    onSave(croppedImage);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-4xl max-h-[80vh] bg-background rounded-lg shadow-lg flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold select-none">
            {cropImageTranslations["crop-title"] || "Crop Image"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={cropImageTranslations["close-crop"] || "Close crop"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-grow relative overflow-hidden flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-3xl max-h-[60vh]">
            <Image
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              fill
              sizes="100vw"
              style={{
                objectFit: "contain",
              }}
              className="rounded-lg"
              draggable={false}
            />

            <div
              className="absolute inset-0 bg-black/50"
              style={{
                cursor: isResizing ? "grabbing" : "default",
              }}
            >
              <div
                ref={cropAreaRef}
                className="absolute border-2 border-white cursor-move"
                style={{
                  left: `${cropArea.x}px`,
                  top: `${cropArea.y}px`,
                  width: `${cropArea.width}px`,
                  height: `${cropArea.height}px`,
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-0 bg-transparent"></div>

                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-nw-resize -top-1 -left-1"
                  onMouseDown={(e) => handleResizeStart(e, "nw")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-ne-resize -top-1 -right-1"
                  onMouseDown={(e) => handleResizeStart(e, "ne")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-sw-resize -bottom-1 -left-1"
                  onMouseDown={(e) => handleResizeStart(e, "sw")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-se-resize -bottom-1 -right-1"
                  onMouseDown={(e) => handleResizeStart(e, "se")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-n-resize -top-1 left-1/2 -translate-x-1/2"
                  onMouseDown={(e) => handleResizeStart(e, "n")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-s-resize -bottom-1 left-1/2 -translate-x-1/2"
                  onMouseDown={(e) => handleResizeStart(e, "s")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-w-resize -left-1 top-1/2 -translate-y-1/2"
                  onMouseDown={(e) => handleResizeStart(e, "w")}
                ></div>
                <div
                  className="absolute w-3 h-3 bg-white border border-gray-800 cursor-e-resize -right-1 top-1/2 -translate-y-1/2"
                  onMouseDown={(e) => handleResizeStart(e, "e")}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            {cropImageTranslations["cancel"] || "Cancel"}
          </Button>
          <Button onClick={handleSave} className="cursor-pointer">
            {cropImageTranslations["save"] || "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
