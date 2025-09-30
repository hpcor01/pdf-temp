"use client";

import { Minus, Plus, Scissors, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useKanban } from "@/providers/kanban-provider";
import { usePreviewer } from "@/providers/previewer-provider";
import "react-image-crop/dist/ReactCrop.css";

// Function to convert crop to canvas and return data URL
function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return canvas.toDataURL("image/jpeg");
}

export function PreviewerImage() {
  const {
    previewImage,
    previewImageColumnId,
    isPreviewerOpen,
    closePreviewer,
    updatePreviewImage,
  } = usePreviewer();
  const { updateImage } = useKanban();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const imageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Previewer image translations
  const previewerImageTranslations = useLanguageKey("previewer-image");
  // Crop image translations
  const cropImageTranslations = useLanguageKey("crop-image");

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
    if (isCropping) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(0.1, Math.min(prev + delta, 5)));
  };

  const handleZoomIn = () => {
    if (isCropping) return;
    setZoomLevel((prev) => Math.min(prev + 0.1, 5));
  };

  const handleZoomOut = () => {
    if (isCropping) return;
    setZoomLevel((prev) => Math.max(0.1, prev - 0.1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCropping) return;
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isCropping) return;
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    if (isCropping) return;
    setIsDragging(false);
  };

  // Reset zoom
  const handleResetZoom = () => {
    if (isCropping) return;
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle click outside to close preview
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Se estiver no modo crop, ignora clique fora
    if (isCropping) return;

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

  const toggleCropMode = () => {
    setIsCropping(!isCropping);
    // Reset crop when entering crop mode to cover most of the image
    if (!isCropping) {
      setCrop({
        unit: "%",
        x: 10,
        y: 10,
        width: 80,
        height: 80,
      });
    }
  };

  // Handle image load for cropping
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    imgRef.current = e.currentTarget;

    setCrop({
      unit: "px",
      x: 0,
      y: 0,
      width: naturalWidth,
      height: naturalHeight,
    });
  };

  // Perform the actual cropping
  const handleSaveCrop = () => {
    if (imgRef.current && crop.width && crop.height && previewImage) {
      try {
        // Convert Crop to PixelCrop for the function
        const pixelCrop: PixelCrop = {
          x: Math.round(crop.x),
          y: Math.round(crop.y),
          width: Math.round(crop.width),
          height: Math.round(crop.height),
          unit: "px",
        };
        const croppedImage = getCroppedImg(imgRef.current, pixelCrop);

        // Update the preview image with the cropped version
        const updatedImage = {
          ...previewImage,
          src: croppedImage,
        };

        // Update in the previewer context
        updatePreviewImage(updatedImage);

        // Update in the kanban context (this will update the image in the image card)
        if (previewImageColumnId) {
          updateImage(previewImageColumnId, updatedImage);
        }

        // Exit crop mode
        setIsCropping(false);
      } catch (error) {
        console.error("Error cropping image:", error);
      }
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
  };

  // Define button configurations to reduce duplication
  const previewButtons = [
    {
      id: "crop",
      icon: Scissors,
      onClick: toggleCropMode,
      ariaLabel: previewerImageTranslations["crop-image"],
      variant: "outline" as const,
      size: "icon" as const,
    },
    {
      id: "zoom-out",
      icon: Minus,
      onClick: handleZoomOut,
      ariaLabel: previewerImageTranslations["zoom-out"],
      disabled: zoomLevel <= 0.1,
      variant: "outline" as const,
      size: "icon" as const,
    },
    {
      id: "reset-zoom",
      label: previewerImageTranslations["zoom-level"].replace(
        "{{percentage}}",
        Math.round(zoomLevel * 100).toString(),
      ),
      onClick: handleResetZoom,
      ariaLabel: previewerImageTranslations["reset-zoom"],
      variant: "outline" as const,
      size: "sm" as const,
    },
    {
      id: "zoom-in",
      icon: Plus,
      onClick: handleZoomIn,
      ariaLabel: previewerImageTranslations["zoom-in"],
      disabled: zoomLevel >= 5,
      variant: "outline" as const,
      size: "icon" as const,
    },
    {
      id: "close",
      icon: X,
      onClick: closePreviewer,
      ariaLabel: previewerImageTranslations["close-preview"],
      variant: "ghost" as const,
      size: "icon" as const,
    },
  ];

  const cropButtons = [
    {
      id: "cancel",
      label: cropImageTranslations.cancel || "Cancel",
      onClick: handleCancelCrop,
      ariaLabel: cropImageTranslations.cancel || "Cancel",
      variant: "outline" as const,
    },
    {
      id: "save",
      label: cropImageTranslations.save || "Save",
      onClick: handleSaveCrop,
      ariaLabel: cropImageTranslations.save || "Save",
      variant: "default" as const,
    },
  ];

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
      aria-label={previewerImageTranslations["modal-label"]}
      tabIndex={-1}
    >
      <div
        ref={previewRef}
        className="w-[30%] h-full bg-background border-l shadow-lg flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center">
          {isCropping ? (
            <>
              <h2 className="text-lg font-semibold uppercase cursor-default select-none">
                {cropImageTranslations["crop-title"] || "Crop Image"}
              </h2>
              <div className="flex gap-2 items-center">
                {cropButtons.map((button) => (
                  <Button
                    key={button.id}
                    className="cursor-pointer"
                    variant={button.variant}
                    onClick={button.onClick}
                    aria-label={button.ariaLabel}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold uppercase cursor-default select-none">
                {previewerImageTranslations["preview-title"]}
              </h2>
              <div className="flex gap-2 items-center">
                {previewButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <Button
                      key={button.id}
                      className="cursor-pointer"
                      variant={button.variant}
                      size={button.size}
                      onClick={button.onClick}
                      aria-label={button.ariaLabel}
                      disabled={button.disabled}
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : button.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
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
          aria-label={previewerImageTranslations["preview-container"]}
        >
          <div
            ref={imageRef}
            className="cursor-move"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.2s",
              width: "100%",
              height: "100%",
            }}
          >
            {isCropping ? (
              <div className="w-full h-full flex items-center justify-center relative">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  className="w-full h-full"
                  ruleOfThirds
                  minWidth={20}
                  minHeight={20}
                >
                  {/* biome-ignore lint/performance/noImgElement: ReactCrop requires img element */}
                  <img
                    src={previewImage.src}
                    alt={previewImage.fileName}
                    onLoad={onImageLoad}
                    className="rounded-lg"
                    draggable={false}
                    style={{
                      transform: `rotate(${previewImage.rotation}deg)`,
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </ReactCrop>
              </div>
            ) : (
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
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}
