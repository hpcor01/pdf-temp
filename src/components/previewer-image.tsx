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
import type { ToastVariant } from "@/types/toast";

const ReactCrop = dynamic(() => import("react-image-crop").then((mod) => mod.default), {
  ssr: false,
});

// Função específica para lidar com Oracle Cloud Storage
const handleOracleStorageImage = async (imageSrc: string): Promise<string> => {
  try {
    // Tenta diretamente primeiro (pode funcionar em alguns casos)
    const testResponse = await fetch(imageSrc, {
      mode: 'cors',
      credentials: 'omit'
    }).catch(() => null);

    if (testResponse?.ok) {
      const blob = await testResponse.blob();
      return URL.createObjectURL(blob);
    }

    // Se direto falhar, usa proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageSrc)}`;
    const proxyResponse = await fetch(proxyUrl);
    
    if (!proxyResponse.ok) throw new Error('Proxy failed');
    
    const blob = await proxyResponse.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(`Oracle Storage image failed: ${error}`);
  }
};

// Função que tenta buscar a imagem de forma segura (CORS + proxy fallback)
async function getCroppedImg(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number; unit: "px" | "%" },
  imageScale: { x: number; y: number }
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      let imageUrl = imageSrc;

      // Função auxiliar para tentar carregar a imagem
      const tryFetchImage = async (url: string, useProxy = false) => {
        try {
          const finalUrl = useProxy 
            ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
            : url;

          const res = await fetch(finalUrl, { 
            mode: "cors", 
            credentials: "omit",
            headers: useProxy ? {} : {
              'Accept': 'image/*',
              'Origin': window.location.origin
            }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          
          // Verifica se o blob é uma imagem válida
          if (!blob.type.startsWith('image/')) {
            throw new Error('Invalid image type');
          }
          
          return URL.createObjectURL(blob);
        } catch (error) {
          console.warn(`Fetch attempt failed: ${error}`);
          return null;
        }
      };

      // Para URLs do Oracle Cloud Storage (tratamento específico)
      if (imageSrc.includes('oraclecloud.com')) {
        try {
          const blobUrl = await handleOracleStorageImage(imageSrc);
          imageUrl = blobUrl;
        } catch (error) {
          console.error('Oracle storage image loading failed:', error);
          throw new Error('Unable to load image from Oracle Cloud Storage');
        }
      } 
      // Para outras URLs HTTP
      else if (imageSrc.startsWith("http")) {
        let blobUrl = await tryFetchImage(imageSrc, false);
        if (!blobUrl) {
          blobUrl = await tryFetchImage(imageSrc, true);
        }
        if (blobUrl) imageUrl = blobUrl;
      }

      // Criação do canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));

      const img = new (window.Image as { new (): HTMLImageElement })();
      if (imageSrc.startsWith("http") && !imageUrl.startsWith("blob:")) {
        img.crossOrigin = "anonymous";
      }

      img.onload = () => {
        // Use the stored scale from the displayed image
        const scaleX = imageScale.x;
        const scaleY = imageScale.y;

        // Convert crop coordinates from displayed image to natural image
        const sourceX = crop.x * scaleX;
        const sourceY = crop.y * scaleY;
        const sourceWidth = crop.width * scaleX;
        const sourceHeight = crop.height * scaleY;

        canvas.width = crop.width;
        canvas.height = crop.height;

        // Configura qualidade do canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          crop.width,
          crop.height
        );

        try {
          // Tenta diferentes formatos
          let result: string | null = null;
          try {
            result = canvas.toDataURL("image/jpeg", 0.95);
          } catch {
            try {
              result = canvas.toDataURL("image/png");
            } catch {
              throw new Error("Unable to encode image");
            }
          }

          if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
          
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Failed to create image data URL"));
          }
        } catch {
          if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
          reject(new Error("Unable to crop image due to CORS restrictions."));
        }
      };

      img.onerror = () => {
        if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
        reject(new Error("Failed to load image for cropping."));
      };

      img.src = imageUrl;
    } catch {
      reject(new Error("Failed to process image for cropping."));
    }
  });
}

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
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });

  // Estado para Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("default");
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");

  const imageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const previewerImageTranslations = useLanguageKey("previewer-image");
  const cropImageTranslations = useLanguageKey("crop-image");

  const { showToast } = useToast({
    setToastVariant,
    setToastTitle,
    setToastDescription,
    setToastOpen,
  });

  // Reset ao abrir uma nova imagem
  useEffect(() => {
    if (isPreviewerOpen && previewImage) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [previewImage, isPreviewerOpen]);

  // Fecha com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewerOpen) closePreviewer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewerOpen, closePreviewer]);

  // Zoom
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
    if (!isCropping) setZoomLevel((prev) => Math.min(prev + 0.1, 5));
  }, [isCropping]);

  const handleZoomOut = useCallback(() => {
    if (!isCropping) setZoomLevel((prev) => Math.max(0.1, prev - 0.1));
  }, [isCropping]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCropping || zoomLevel <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [isCropping, zoomLevel, position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isCropping || !isDragging || zoomLevel <= 1) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isCropping, isDragging, zoomLevel, dragStart.x, dragStart.y]
  );

  const handleMouseUp = useCallback(() => {
    if (!isCropping) setIsDragging(false);
  }, [isCropping]);

  const handleResetZoom = useCallback(() => {
    if (!isCropping) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isCropping]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (isCropping) return;
      if (e.target === e.currentTarget) closePreviewer();
    },
    [isCropping, closePreviewer]
  );

  const toggleCropMode = useCallback(() => {
    setIsCropping(!isCropping);
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

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    setImageScale({ x: naturalWidth / width, y: naturalHeight / height });
    setCrop({
      unit: "px",
      x: 0,
      y: 0,
      width: width,
      height: height,
    } as PixelCrop);
  }, []);

  const handleSaveCrop = useCallback(async () => {
    if (crop.width && crop.height && previewImage) {
      try {
        const pixelCrop: PixelCrop = {
          x: Math.round(crop.x),
          y: Math.round(crop.y),
          width: Math.round(crop.width),
          height: Math.round(crop.height),
          unit: "px",
        };

        const croppedImage = await getCroppedImg(previewImage.src, pixelCrop, imageScale);
        const updatedImage = { ...previewImage, src: croppedImage };

        updatePreviewImage(updatedImage);
        if (previewImageColumnId) updateImage(previewImageColumnId, updatedImage);
        setIsCropping(false);

        showToast(
          "default",
          cropImageTranslations["success-title"] || "Image cropped",
          cropImageTranslations["success-description"] ||
            "The image was successfully cropped."
        );
      } catch (error) {
        console.error("Error cropping image:", error);
        
        showToast(
          "destructive",
          cropImageTranslations["error-title"] || "Cropping failed",
          cropImageTranslations["error-description"] ||
            "Unable to crop the image due to CORS restrictions."
        );
        
        setIsCropping(false); 
      }
    }
  }, [crop, previewImage, previewImageColumnId, updatePreviewImage, updateImage, showToast, cropImageTranslations]);

  const handleCancelCrop = useCallback(() => setIsCropping(false), []);

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

  if (!isPreviewerOpen || !previewImage) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end"
        onClick={handleOverlayClick}
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

PreviewerImage.displayName = "PreviewerImage";
export { PreviewerImage };