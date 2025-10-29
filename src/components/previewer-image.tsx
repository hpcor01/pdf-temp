"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { X, Scissors, Download, RotateCcw, ZoomIn, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { usePreviewer } from "@/providers/previewer-provider";
import { useKanban } from "@/providers/kanban-provider";
import { Toast } from "@/components/ui/toast";

export const PreviewerImage = memo(() => {
  const {
    previewImage,
    previewImageColumnId,
    isPreviewerOpen,
    closePreviewer,
    updatePreviewImage,
  } = usePreviewer();
  const { updateImage } = useKanban();

  const [isCropping, setIsCropping] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");

  const showToast = (variant: "default" | "destructive", title: string, desc: string) => {
    setToastVariant(variant);
    setToastTitle(title);
    setToastDescription(desc);
    setToastOpen(true);
  };

  const handleSaveCrop = useCallback(() => {
    if (croppedImage && previewImage) {
      const updatedImage = { ...previewImage, src: croppedImage };
      updatePreviewImage(updatedImage);
      if (previewImageColumnId) updateImage(previewImageColumnId, updatedImage);
      setIsCropping(false);
      showToast("default", "Imagem cortada", "O recorte foi salvo com sucesso.");
    }
  }, [croppedImage, previewImage, previewImageColumnId, updateImage, updatePreviewImage]);

  if (!isPreviewerOpen || !previewImage) return null;

  return (
    <>
      <div className="fixed inset-0 z-80 flex justify-end">
        <div className="w-[45%] h-full bg-background border-l shadow-lg flex flex-col">
          {/* Header */}
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
                  <Button variant="outline" size="icon" onClick={() => setIsCropping(true)}>
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
          <div className="flex-grow overflow-hidden bg-[#18181B]">
            {!isCropping ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={previewImage.src}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <ImageCropperWrapper
                imageSrc={previewImage.src}
                onCropFinish={setCroppedImage}
              />
            )}
          </div>
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

// ===========================================================
// =============== COMPONENTE DE CROP ADAPTADO ===============
// ===========================================================

function ImageCropperWrapper({ imageSrc, onCropFinish }: { imageSrc: string; onCropFinish: (img: string | null) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [zoom, setZoom] = useState(100);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  const handleCrop = () => {
    if (!image) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const scale = zoom / 100;

    const displayWidth = image.width * scale;
    const displayHeight = image.height * scale;
    const cropX = cropArea.x / scale;
    const cropY = cropArea.y / scale;
    const cropW = cropArea.width / scale;
    const cropH = cropArea.height / scale;

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const result = canvas.toDataURL("image/png");
    setCroppedImage(result);
    onCropFinish(result);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={containerRef} className="flex-grow relative flex items-center justify-center bg-[#18181B]">
        {image && (
          <img
            src={image.src}
            alt="Crop"
            className="max-w-[80%] max-h-[80%] object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        )}
        <div
          className="absolute border-2 border-emerald-500 shadow-lg"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
          }}
        />
      </div>

      <div className="p-4 border-t bg-[#27272A]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-300">Zoom</span>
          <span className="text-white">{zoom}%</span>
        </div>
        <Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={50} max={200} step={5} />
        <div className="mt-4 flex gap-2">
          <Button onClick={handleCrop} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
            <Crop className="w-4 h-4 mr-2" /> Recortar
          </Button>
          <Button onClick={() => setZoom(100)} variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}