"use client";

import { Draggable } from "@hello-pangea/dnd";
import { RotateCw, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { MousePreviewerImage } from "@/components/mouse-previewer-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguageKey } from "@/hooks/use-i18n";
import { usePreview } from "@/providers/preview-provider";
import { usePreviewer } from "@/providers/previewer-provider";
import type { ImageCardProps } from "@/types/image-card";

export function ImageCard({
  item,
  index,
  columnId,
  onRemove,
  onRotate,
}: ImageCardProps) {
  const { setPreviewImage, isPreviewerImageChecked } = usePreview();
  const { openPreviewer } = usePreviewer();
  const [showMousePreview, setShowMousePreview] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Image card translations
  const imageCardTranslations = useLanguageKey("image-card");

  const handleRotate = (): void => {
    const newRotation = (item.rotation + 90) % 360;
    onRotate(columnId, item.id, newRotation);
  };

  const positionNumber = index + 1;

  const handleClick = () => {
    setPreviewImage(item, null, true);
  };

  const handleZoom = () => {
    openPreviewer(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isPreviewerImageChecked) {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setShowMousePreview(true);
    }
  };

  const handleMouseLeave = () => {
    setShowMousePreview(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPreviewerImageChecked && showMousePreview) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Add fallbacks for translations
  const getPreviewImageLabel = () => {
    if (!imageCardTranslations) return `Preview image ${item.fileName}`;
    return (
      imageCardTranslations["preview-image"]?.replace(
        "{{fileName}}",
        item.fileName
      ) || `Preview image ${item.fileName}`
    );
  };

  const getPositionNumberLabel = () => {
    if (!imageCardTranslations) return positionNumber.toString();
    return (
      imageCardTranslations["position-number"]?.replace(
        "{{number}}",
        positionNumber.toString()
      ) || positionNumber.toString()
    );
  };

  const getImageActionsLabel = () => {
    if (!imageCardTranslations) return "Image actions";
    return imageCardTranslations["image-actions"] || "Image actions";
  };

  const getRemoveImageLabel = () => {
    if (!imageCardTranslations) return `Remove image ${item.fileName}`;
    return (
      imageCardTranslations["remove-image"]?.replace(
        "{{fileName}}",
        item.fileName
      ) || `Remove image ${item.fileName}`
    );
  };

  const getRotateImageLabel = () => {
    if (!imageCardTranslations) return `Rotate image ${item.fileName}`;
    return (
      imageCardTranslations["rotate-image"]?.replace(
        "{{fileName}}",
        item.fileName
      ) || `Rotate image ${item.fileName}`
    );
  };

  const getZoomImageLabel = () => {
    if (!imageCardTranslations) return `Zoom image ${item.fileName}`;
    return (
      imageCardTranslations["zoom-image"]?.replace(
        "{{fileName}}",
        item.fileName
      ) || `Zoom image ${item.fileName}`
    );
  };

  return (
    <>
      <Draggable draggableId={item.id} index={index}>
        {(provided) => (
          <li
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          >
            <Card
              className="relative w-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              ref={cardRef}
            >
              <Button
                type="button"
                className="absolute inset-0 cursor-pointer bg-transparent border-none"
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                aria-label={getPreviewImageLabel()}
              />
              <div className="absolute top-2 left-2 z-20 bg-black/70 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center select-none cursor-default">
                {getPositionNumberLabel()}
              </div>

              <div
                className="
                  absolute top-0 left-0 w-full flex justify-center gap-2 py-2
                  bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100
                  transition-opacity duration-300 z-10
                "
                role="toolbar"
                aria-label={getImageActionsLabel()}
              >
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(columnId, item.id);
                  }}
                  className="
                    p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90
                    text-gray-900 dark:text-gray-100 hover:bg-red-500 hover:text-white
                    transition-all duration-200 shadow-md
                  "
                  aria-label={getRemoveImageLabel()}
                >
                  <X className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate();
                  }}
                  className="
                    p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90
                    text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white
                    transition-all duration-200 shadow-md
                  "
                  aria-label={getRotateImageLabel()}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoom();
                  }}
                  className="
                    p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90
                    text-gray-900 dark:text-gray-100 hover:bg-green-500 hover:text-white
                    transition-all duration-200 shadow-md
                  "
                  aria-label={getZoomImageLabel()}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <CardContent className="p-0">
                <Image
                  src={item.src}
                  alt={item.fileName}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{
                    transform: `rotate(${item.rotation}deg)`,
                    width: "100%",
                    height: "12rem",
                    objectFit: "cover",
                  }}
                  className="
                    transition-transform duration-500 ease-in-out
                  "
                />
              </CardContent>
            </Card>
          </li>
        )}
      </Draggable>

      {showMousePreview && isPreviewerImageChecked && (
        <MousePreviewerImage
          image={item}
          position={mousePosition}
          onClose={() => setShowMousePreview(false)}
        />
      )}
    </>
  );
}
