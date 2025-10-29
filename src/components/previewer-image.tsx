"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { X, Scissors, Crop, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewer } from "@/providers/previewer-provider";
import { useKanban } from "@/providers/kanban-provider";
import { Toast } from "@/components/ui/toast";

// ==========================================
// ======== COMPONENTE PRINCIPAL ============
// ==========================================
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

  const handleSaveCrop = useCallback(
    (cropped: string) => {
      if (previewImage) {
        const updatedImage = { ...previewImage, src: cropped };
        updatePreviewImage(updatedImage);
        if (previewImageColumnId) updateImage(previewImageColumnId, updatedImage);
        showToast("default", "Imagem cortada", "O recorte foi salvo com sucesso.");
      }
    },
    [previewImage, previewImageColumnId, updateImage, updatePreviewImage]
  );

  if (!isPreviewerOpen || !previewImage) return null;

  return (
    <>
      {/* Painel lateral */}
      <div className="fixed inset-0 z-80 flex justify-end">
        <div className="w-[45%] h-full bg-background border-l shadow-lg flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold uppercase">Visualizar Imagem</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsCropping(true)}>
                <Scissors className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={closePreviewer}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center bg-[#18181B] p-4">
            <img
              src={previewImage.src}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Modal de recorte */}
      {isCropping && (
        <ImageCropModal
          imageSrc={previewImage.src}
          onClose={() => setIsCropping(false)}
          onSave={(cropped) => {
            handleSaveCrop(cropped);
            setIsCropping(false);
          }}
        />
      )}

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

// ==========================================
// ======== MODAL DE RECORTE ================
// ==========================================
function ImageCropModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string;
  onClose: () => void;
  onSave: (cropped: string) => void;
}) {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181B] rounded-2xl shadow-2xl w-[90%] max-w-5xl max-h-[90%] flex flex-col overflow-hidden border border-gray-700">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg text-white font-semibold">Recortar Imagem</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-auto p-4">
          <ImageCropper imageSrc={imageSrc} onCropFinish={setCroppedImage} />
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!croppedImage}
            onClick={() => {
              if (croppedImage) onSave(croppedImage);
            }}
          >
            Salvar recorte
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ======== IMAGE CROPPER ===================
// ==========================================
function ImageCropper({
  imageSrc,
  onCropFinish,
}: {
  imageSrc: string;
  onCropFinish: (img: string | null) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 150, y: 100, width: 400, height: 250 });
  const [zoom, setZoom] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // carregar imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  // mover área
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    setCropArea((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setDragging(false);

  // função de recorte
  const handleCrop = useCallback(() => {
    if (!image) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const scale = zoom / 100;

    const cropX = cropArea.x / scale;
    const cropY = cropArea.y / scale;
    const cropW = cropArea.width / scale;
    const cropH = cropArea.height / scale;

    canvas.width = cropW;
    canvas.height = cropH;

    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const result = canvas.toDataURL("image/png");
    onCropFinish(result);
  }, [image, cropArea, zoom, onCropFinish]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[70vh] bg-[#0f0f0f] flex items-center justify-center overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Imagem */}
      {image && (
        <img
          src={image.src}
          alt="Crop"
          className="object-contain max-w-none"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Overlay de recorte */}
      <div
        className="absolute border-2 border-emerald-500 shadow-lg bg-transparent cursor-move"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
        }}
        onMouseDown={handleMouseDown}
      />

      {/* Máscara escura */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <mask id="maskCrop">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={cropArea.x}
                y={cropArea.y}
                width={cropArea.width}
                height={cropArea.height}
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="black" opacity="0.6" mask="url(#maskCrop)" />
        </svg>
      </div>

      {/* Controles de zoom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 rounded-full px-4 py-2 flex items-center gap-3">
        <label className="text-white text-sm">Zoom: {zoom}%</label>
        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-40"
        />
        <Button variant="outline" size="sm" onClick={() => setZoom(100)}>
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
        <Button size="sm" onClick={handleCrop}>
          <Crop className="w-4 h-4 mr-1" /> Aplicar
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}