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
    const testResponse = await fetch(imageSrc, { mode: "cors", credentials: "omit" }).catch(() => null);
    if (testResponse?.ok) {
      const blob = await testResponse.blob();
      return URL.createObjectURL(blob);
    }

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageSrc)}`;
    const proxyResponse = await fetch(proxyUrl);
    if (!proxyResponse.ok) throw new Error("Proxy failed");

    const blob = await proxyResponse.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(`Oracle Storage image failed: ${error}`);
  }
};

// Função para gerar imagem cortada
async function getCroppedImg(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number; unit: "px" | "%" },
  imageScale: { x: number; y: number },
  rotation: number = 0
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      let imageUrl = imageSrc;

      const tryFetchImage = async (url: string, useProxy = false) => {
        try {
          const finalUrl = useProxy
            ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
            : url;

          const res = await fetch(finalUrl, {
            mode: "cors",
            credentials: "omit",
            headers: useProxy ? {} : { Accept: "image/*", Origin: window.location.origin },
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();

          if (!blob.type.startsWith("image/")) throw new Error("Invalid image type");

          return URL.createObjectURL(blob);
        } catch {
          return null;
        }
      };

      if (imageSrc.includes("oraclecloud.com")) {
        imageUrl = await handleOracleStorageImage(imageSrc);
      } else if (imageSrc.startsWith("http")) {
        let blobUrl = await tryFetchImage(imageSrc, false);
        if (!blobUrl) blobUrl = await tryFetchImage(imageSrc, true);
        if (blobUrl) imageUrl = blobUrl;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));

      const img = typeof window !== "undefined" ? new window.Image() : ({} as HTMLImageElement);
      if (imageSrc.startsWith("http") && !imageUrl.startsWith("blob:")) img.crossOrigin = "anonymous";

      img.onload = () => {
        const scaleX = imageScale.x;
        const scaleY = imageScale.y;

        const sourceX = crop.x * scaleX;
        const sourceY = crop.y * scaleY;
        const sourceWidth = crop.width * scaleX;
        const sourceHeight = crop.height * scaleY;

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (rotation !== 0) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            -crop.width / 2,
            -crop.height / 2,
            crop.width,
            crop.height
          );
          ctx.restore();
        } else {
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
        }

        const result = canvas.toDataURL("image/jpeg", 0.95);
        if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
        resolve(result);
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
  const [crop, setCrop] = useState<PixelCrop>({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });

  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<ToastVariant>("default");
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");

  const imgRef = useRef<HTMLImageElement>(null);

  const previewerImageTranslations = useLanguageKey("previewer-image");
  const cropImageTranslations = useLanguageKey("crop-image");

  const { showToast } = useToast({
    setToastVariant,
    setToastTitle,
    setToastDescription,
    setToastOpen,
  });

  useEffect(() => {
    if (isPreviewerOpen && previewImage) {
      setZoomLevel(0.7);
      setPosition({ x: 0, y: 0 });
    }
  }, [previewImage, isPreviewerOpen]);

  const toggleCropMode = useCallback(() => {
    if (!isCropping) {
      // Reseta zoom e posição ao entrar no modo de recorte
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
    setIsCropping(!isCropping);

    if (!isCropping) {
      const img = imgRef.current;
      if (img) {
        const { width, height } = img;
        setCrop({
          unit: "px",
          x: width * 0.1,
          y: height * 0.1,
          width: width * 0.8,
          height: height * 0.8,
        });
      }
    }
  }, [isCropping]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    setImageScale({ x: naturalWidth / width, y: naturalHeight / height });
  }, []);

  const handleSaveCrop = useCallback(async () => {
    if (crop.width && crop.height && previewImage) {
      try {
        const croppedImage = await getCroppedImg(previewImage.src, crop, imageScale, previewImage.rotation);
        const updatedImage = { ...previewImage, src: croppedImage };
        updatePreviewImage(updatedImage);
        if (previewImageColumnId) updateImage(previewImageColumnId, updatedImage);
        setIsCropping(false);

        showToast("default", "Imagem cortada", "O recorte foi salvo com sucesso.");
      } catch {
        showToast("destructive", "Erro no recorte", "Não foi possível recortar a imagem.");
        setIsCropping(false);
      }
    }
  }, [crop, previewImage, previewImageColumnId, imageScale, updateImage, updatePreviewImage, showToast]);

  if (!isPreviewerOpen || !previewImage) return null;

  return (
    <>
      <div className="fixed inset-0 z-80 flex justify-end">
        <div className="w-[40%] h-full bg-background border-l shadow-lg flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold uppercase">
              {isCropping ? "Cortar imagem" : "Visualizar imagem"}
            </h2>
            <div className="flex gap-2">
              {isCropping ? (
                <>
                  <Button variant="outline" onClick={() => setIsCropping(false)}>Cancelar</Button>
                  <Button variant="default" onClick={handleSaveCrop}>Salvar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="icon" onClick={toggleCropMode}>
                    <Scissors className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={closePreviewer}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          {isCropping ? (
            <div className="flex-grow flex items-center justify-center overflow-auto p-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c as PixelCrop)}
                ruleOfThirds
                className="max-w-full max-h-full"
              >
                <img
                  src={previewImage.src}
                  alt={previewImage.fileName}
                  onLoad={onImageLoad}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxWidth: "none",
                    maxHeight: "none",
                    objectFit: "contain",
                  }}
                />
              </ReactCrop>
            </div>
          ) : (
            <div
              className="flex-grow flex items-center justify-center overflow-hidden bg-transparent"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.2s",
              }}
            >
              <Image
                src={previewImage.src}
                alt={previewImage.fileName}
                width={0}
                height={0}
                style={{
                  width: "auto",
                  height: "auto",
                  maxHeight: "100vh",
                  objectFit: "contain",
                }}
                className="rounded-lg"
              />
            </div>
          )}
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
