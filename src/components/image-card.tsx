"use client";

import { Draggable } from "@hello-pangea/dnd";
import { RotateCw, X, ZoomIn } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguageKey } from "@/hooks/use-i18n";
import { usePreview } from "@/providers/preview-provider";
import { usePreviewer } from "@/providers/previewer-provider";
import type { ImageCardProps } from "@/types/image-card";

// Dynamically import MousePreviewerImage for better performance
const MousePreviewerImage = dynamic(
  () =>
    import("@/components/mouse-previewer-image").then(
      (mod) => mod.MousePreviewerImage
    ),
  {
    ssr: false,
  }
);

// Memoize the ImageCard component to prevent unnecessary re-renders
const ImageCard = memo(
  ({ item, index, columnId, onRemove, onRotate }: ImageCardProps) => {
    const { setPreviewImage, isPreviewerImageChecked } = usePreview();
    const { openPreviewer } = usePreviewer();
    const [showMousePreview, setShowMousePreview] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    // Image card translations
    const imageCardTranslations = useLanguageKey("image-card");

    const handleRotate = useCallback((): void => {
      const newRotation = (item.rotation + 90) % 360;
      onRotate(columnId, item.id, newRotation);
    }, [item.rotation, onRotate, columnId, item.id]);

    const positionNumber = useMemo(() => index + 1, [index]);

    const handleClick = useCallback(() => {
      setPreviewImage(item, null, true);
    }, [item, setPreviewImage]);

    const handleZoom = useCallback(() => {
      openPreviewer(item, columnId);
    }, [item, columnId, openPreviewer]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        if (isPreviewerImageChecked) {
          setMousePosition({ x: e.clientX, y: e.clientY });
          setShowMousePreview(true);
        }
      },
      [isPreviewerImageChecked]
    );

    const handleMouseLeave = useCallback(() => {
      setShowMousePreview(false);
    }, []);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isPreviewerImageChecked && showMousePreview) {
          setMousePosition({ x: e.clientX, y: e.clientY });
        }
      },
      [isPreviewerImageChecked, showMousePreview]
    );

    // Memoize translation functions to prevent recreation on each render
    const getPreviewImageLabel = useMemo(() => {
      if (!imageCardTranslations) return `Preview image ${item.fileName}`;
      return (
        imageCardTranslations["preview-image"]?.replace(
          "{{fileName}}",
          item.fileName
        ) || `Preview image ${item.fileName}`
      );
    }, [imageCardTranslations, item.fileName]);

    const getPositionNumberLabel = useMemo(() => {
      if (!imageCardTranslations) return positionNumber.toString();
      return (
        imageCardTranslations["position-number"]?.replace(
          "{{number}}",
          positionNumber.toString()
        ) || positionNumber.toString()
      );
    }, [imageCardTranslations, positionNumber]);

    const getImageActionsLabel = useMemo(() => {
      if (!imageCardTranslations) return "Image actions";
      return imageCardTranslations["image-actions"] || "Image actions";
    }, [imageCardTranslations]);

    const getRemoveImageLabel = useMemo(() => {
      if (!imageCardTranslations) return `Remove image ${item.fileName}`;
      return (
        imageCardTranslations["remove-image"]?.replace(
          "{{fileName}}",
          item.fileName
        ) || `Remove image ${item.fileName}`
      );
    }, [imageCardTranslations, item.fileName]);

    const getRotateImageLabel = useMemo(() => {
      if (!imageCardTranslations) return `Rotate image ${item.fileName}`;
      return (
        imageCardTranslations["rotate-image"]?.replace(
          "{{fileName}}",
          item.fileName
        ) || `Rotate image ${item.fileName}`
      );
    }, [imageCardTranslations, item.fileName]);

    const getZoomImageLabel = useMemo(() => {
      if (!imageCardTranslations) return `Zoom image ${item.fileName}`;
      return (
        imageCardTranslations["zoom-image"]?.replace(
          "{{fileName}}",
          item.fileName
        ) || `Zoom image ${item.fileName}`
      );
    }, [imageCardTranslations, item.fileName]);

    // Memoize button configurations to reduce duplication
    const actionButtons = useMemo(
      () => [
        {
          id: "remove",
          icon: X,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove(columnId, item.id);
          },
          ariaLabel: getRemoveImageLabel,
          className:
            "p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 hover:bg-red-500 hover:text-white transition-all duration-200 shadow-md",
        },
        {
          id: "rotate",
          icon: RotateCw,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            handleRotate();
          },
          ariaLabel: getRotateImageLabel,
          className:
            "p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white transition-all duration-200 shadow-md",
        },
        {
          id: "zoom",
          icon: ZoomIn,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            handleZoom();
          },
          ariaLabel: getZoomImageLabel,
          className:
            "p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 hover:bg-green-500 hover:text-white transition-all duration-200 shadow-md",
        },
      ],
      [
        onRemove,
        columnId,
        item.id,
        getRemoveImageLabel,
        handleRotate,
        getRotateImageLabel,
        handleZoom,
        getZoomImageLabel,
      ]
    );

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
                  aria-label={getPreviewImageLabel}
                />
                <span className="absolute top-2 left-2 z-20 bg-black/70 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center select-none cursor-default">
                  {getPositionNumberLabel}
                </span>

                <div
                  className="
                  absolute top-0 left-0 w-full flex justify-center gap-2 py-2
                  bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100
                  transition-opacity duration-300 z-10
                "
                  role="toolbar"
                  aria-label={getImageActionsLabel}
                >
                  {actionButtons.map((button) => {
                    const Icon = button.icon;
                    return (
                      <Button
                        key={button.id}
                        type="button"
                        onClick={button.onClick}
                        className={button.className}
                        aria-label={button.ariaLabel}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    );
                  })}
                </div>

                <CardContent className="p-0">
                  <Image
                    src={item.src}
                    alt={item.fileName}
                    width={0}
                    height={0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{
                      transform: `rotate(${item.rotation}deg)`,
                      width: "100%",
                      height: "12rem",
                      objectFit: "cover",
                    }}
                    className="
                    transition-transform duration-500 ease-in-out
                  "
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
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
);

// Add display name for debugging
ImageCard.displayName = "ImageCard";

export { ImageCard };
