"use client";

import { Minus, Plus, Scissors, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { useKanban } from "@/providers/kanban-provider";
import { usePreviewer } from "@/providers/previewer-provider";
import type { ToastVariant } from "@/types/toast"; // Import the ToastVariant type

// Dynamically import ReactCrop to reduce initial bundle size
const ReactCrop = dynamic(
  () => import("react-image-crop").then((mod) => mod.default),
  {
    ssr: false,
  }
);

// Function to convert crop to canvas and return data URL
function getCroppedImg(
  image: HTMLImageElement,
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit: "px" | "%";
  }
): string {
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
    crop.height
  );

  return canvas.toDataURL("image/jpeg");
}

// Memoize the PreviewerImage component to prevent unnecessary re-renders
const PreviewerImage = memo(() => {
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
  const [crop, setCrop] = useState<PixelCrop>({
    unit: "px",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  // Add toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("default"); // Use the correct type
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");

  const imageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Previewer image translations
  const previewerImageTranslations = useLanguageKey("previewer-image");
  // Crop image translations
  const cropImageTranslations = useLanguageKey("crop-image");

  // Add toast hook
  const { showToast } = useToast({
    setToastVariant,
    setToastTitle,
    setToastDescription,
    setToastOpen,
  });

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
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isCropping) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel((prev) => Math.max(0.1, Math.min(prev + delta, 5)));
    },
    [isCropping]
  );

  const handleZoomIn = useCallback(() => {
    if (isCropping) return;
    setZoomLevel((prev) => Math.min(prev + 0.1, 5));
  }, [isCropping]);

  const handleZoomOut = useCallback(() => {
    if (isCropping) return;
    setZoomLevel((prev) => Math.max(0.1, prev - 0.1));
  }, [isCropping]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCropping) return;
      if (zoomLevel <= 1) return;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [isCropping, zoomLevel, position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isCropping) return;
      if (!isDragging || zoomLevel <= 1) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isCropping, isDragging, zoomLevel, dragStart.x, dragStart.y]
  );

  const handleMouseUp = useCallback(() => {
    if (isCropping) return;
    setIsDragging(false);
  }, [isCropping]);

  // Reset zoom
  const handleResetZoom = useCallback(() => {
    if (isCropping) return;
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [isCropping]);

  // Handle click outside to close preview
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Se estiver no modo crop, ignora clique fora
      if (isCropping) return;

      if (e.target === e.currentTarget) {
        closePreviewer();
      }
    },
    [isCropping, closePreviewer]
  );

  // Handle keyboard events for accessibility
  const handleOverlayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closePreviewer();
      }
    },
    [closePreviewer]
  );

  const toggleCropMode = useCallback(() => {
    setIsCropping(!isCropping);
    // Reset crop when entering crop mode to cover most of the image
    if (!isCropping) {
      setCrop({
        unit: "px",
        x: 10,
        y: 10,
        width: 80,
        height: 80,
      } as PixelCrop);
    }
  }, [isCropping]);

  // Handle image load for cropping
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      imgRef.current = e.currentTarget;

      setCrop({
        unit: "px",
        x: 0,
        y: 0,
        width: naturalWidth,
        height: naturalHeight,
      } as PixelCrop);
    },
    []
  );

  // Perform the actual cropping
  const handleSaveCrop = useCallback(() => {
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

        // Show success toast
        showToast(
          "default", // Use "default" instead of "success" to match the type
          cropImageTranslations["success-title"] || "Image cropped",
          cropImageTranslations["success-description"] ||
            "The image was successfully cropped."
        );
      } catch (error) {
        console.error("Error cropping image:", error);
      }
    }
  }, [
    crop,
    previewImage,
    previewImageColumnId,
    updatePreviewImage,
    updateImage,
    showToast,
    cropImageTranslations,
  ]);

  const handleCancelCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  // Memoize button configurations to reduce duplication
  const previewButtons = useMemo(
    () => [
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
          Math.round(zoomLevel * 100).toString()
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
    ],
    [
      previewerImageTranslations,
      zoomLevel,
      toggleCropMode,
      handleZoomOut,
      handleResetZoom,
      handleZoomIn,
      closePreviewer,
    ]
  );

  const cropButtons = useMemo(
    () => [
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
    ],
    [cropImageTranslations, handleCancelCrop, handleSaveCrop]
  );

  if (!isPreviewerOpen || !previewImage) {
    return null;
  }

  return (
    <>
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
                    onChange={(c) => setCrop(c as PixelCrop)}
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                />
              )}
            </div>
          </Button>
        </div>
      </div>
      {/* Add Toast component */}
      <Toast
        title={toastTitle}
        description={toastDescription}
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastVariant}
      />
    </>
  );
});

// Add display name for debugging
PreviewerImage.displayName = "PreviewerImage";

export { PreviewerImage };
