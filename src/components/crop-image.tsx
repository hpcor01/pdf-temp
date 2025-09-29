"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import { Button } from "@/components/ui/button";
import { useLanguageKey } from "@/hooks/use-i18n";
import "react-image-crop/dist/ReactCrop.css";

interface CropImageProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

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

export function CropImage({
  isOpen,
  imageSrc,
  onClose,
  onSave,
}: CropImageProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const imgRef = useRef<HTMLImageElement>(null);

  // Crop image translations
  const cropImageTranslations = useLanguageKey("crop-image");

  // Handle image load
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
  };

  // Perform the actual cropping
  const handleSave = () => {
    if (imgRef.current && crop.width && crop.height) {
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
        onSave(croppedImage);
      } catch (error) {
        console.error("Error cropping image:", error);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] bg-background rounded-lg shadow-lg flex flex-col">
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
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              className="w-full h-full"
              ruleOfThirds
            >
              <img
                src={imageSrc}
                alt="Crop target"
                onLoad={onImageLoad}
                className="max-w-full max-h-full object-contain rounded-lg"
                draggable={false}
              />
            </ReactCrop>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            {cropImageTranslations.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSave} className="cursor-pointer">
            {cropImageTranslations.save || "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
