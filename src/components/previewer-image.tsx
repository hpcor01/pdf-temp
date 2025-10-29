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

// ======== TRATAMENTO DE IMAGEM PARA RECORTE ========
async function getCroppedImg(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number; unit: "px" | "%" },
  imageScale: { x: number; y: number },
  rotation: number = 0
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      let imageUrl = imageSrc;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));

      const img = typeof window !== "undefined" ? new window.Image() : ({} as HTMLImageElement);
      if (imageSrc.startsWith("http") && !imageUrl.startsWith("blob:")) {
        img.crossOrigin = "anonymous";
      }

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

        const result = canvas.toDataURL("image/jpeg", 0.95);
        resolve(result);
      };

      img.onerror = () => reject(new Error("Failed to load image for cropping."));
      img.src = imageUrl;
    } catch (error) {
      reject(new Error("Failed to process image for cropping."));
    }
  });
}

// ======== COMPONENTE PRINCIPAL ========
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

  const { showToast } = useToast({
    setToastVariant,
    setToastTitle,
    setToastDescription,
    setToastOpen,
  });

  const previewerImageTranslations = useLanguageKey("previewer-image");
  const cropImageTranslations = useLanguageKey("crop-image");

  // Resetar zoom quando abrir
  useEffect(() => {
    if (isPreviewerOpen && previewImage) {
      setZoomLevel(0.7);
      setPosition({ x: 0, y: 0 });
    }
  }, [previewImage, isPreviewerOpen]);

  // Resetar zoom e posição ao entrar no modo crop
  const toggleCropMode = useCallback(() => {
    if (!isCropping) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
    setIsCropping(!isCropping);

    if (!isCropping) {
      const img = imgRef.current;
      if (img) {
        setCrop({
          unit: "px",
          x: img.width * 0.1,
          y: img.height * 0.1,
          width: img.width * 0.8,
          height: img.height * 0.8,
        });
      }
    }
  }, [isCropping]);

  // Corrigir cálculo de escala real
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      imgRef.current = img;

      setImageScale({
        x: img.naturalWidth / img.width,
        y: img.naturalHeight / img.height,
      });

      if (!isCropping) {
        setCrop({
          unit: "px",
          x: img.width * 0.1,
          y: img.height * 0.1,
          width: img.width * 0.8,
          height: img.height * 0.8,
        });
      }
    },
    [isCropping]
  );

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
        {/* Painel lateral */}
        <div className="w-[40%] h-full bg-background border-l shadow-lg flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold uppercase">
              {isCropping ? "CORTAR IMAGEM" : "VISUALIZAR IMAGEM"}
            </h2>
            <div className="flex gap-2">
              {isCropping ? (
                <>
                  <Button variant="outline" onClick={() => setIsCropping(false)}>
                    Cancelar
                  </Button>
                  <Button variant="default" onClick={handleSaveCrop}>
                    Salvar
                  </Button>
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

          {/* Conteúdo principal */}
          {isCropping ? (
            <div className="flex-grow flex items-center justify-center overflow-auto p-4 bg-black/10">
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
                  className="rounded-lg"
                  draggable={true}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
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
