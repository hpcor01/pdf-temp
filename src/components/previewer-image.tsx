"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { X, Scissors, RotateCcw, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePreviewer } from "@/providers/previewer-provider";
import { useKanban } from "@/providers/kanban-provider";
import { Toast } from "@/components/ui/toast";

/**
 * PreviewerImage integrado com ImageCropperWrapper (slider nativo)
 * - Substitui dependência de Slider por <input type="range">
 * - Mantém painel lateral e integração com updatePreviewImage/updateImage
 */

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
              <div className="flex items-center justify-center h-full p-4">
                <img
                  src={previewImage.src}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <ImageCropperWrapper
                imageSrc={previewImage.src}
                onCropFinish={(img) => setCroppedImage(img)}
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

function ImageCropperWrapper({
  imageSrc,
  onCropFinish,
}: {
  imageSrc: string;
  onCropFinish: (img: string | null) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 60, y: 40, width: 300, height: 200 });
  const [zoom, setZoom] = useState(100);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // carregar imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // ajusta crop inicial baseado nas dimensões naturais (manter dentro do container depois)
      setImage(img);

      // opcional: ajustar cropArea inicial dinamicamente com base no tamanho natural
      const defaultW = Math.min(400, img.width * 0.6);
      const defaultH = Math.min(300, img.height * 0.6);
      setCropArea({
        x: Math.max(20, (img.width - defaultW) / 2),
        y: Math.max(20, (img.height - defaultH) / 2),
        width: defaultW,
        height: defaultH,
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Função principal de crop (usa zoom como escala)
  const handleCrop = useCallback(() => {
    if (!image) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const scale = zoom / 100;

    // Consideramos que exibimos a imagem dentro do container com scale applied.
    // Para traduzir cropArea (em pixels do container visual), dividimos pela escala.
    const cropX = Math.round(cropArea.x / scale);
    const cropY = Math.round(cropArea.y / scale);
    const cropW = Math.round(cropArea.width / scale);
    const cropH = Math.round(cropArea.height / scale);

    // Limpa e define tamanho do canvas
    canvas.width = cropW;
    canvas.height = cropH;

    // Desenha a parte correta da imagem original no canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const result = canvas.toDataURL("image/png");
    setCroppedImage(result);
    onCropFinish(result);
  }, [image, cropArea, zoom, onCropFinish]);

  // Handler simples de drag do retângulo (click+drag para mover)
  const draggingRef = useRef<{ active: boolean; startX: number; startY: number; startArea?: typeof cropArea }>({
    active: false,
    startX: 0,
    startY: 0,
  });

  const handleMouseDownArea = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.nativeEvent.offsetX;
    const startY = e.nativeEvent.offsetY;
    draggingRef.current = { active: true, startX, startY, startArea: { ...cropArea } };
    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", onDocMouseUp);
  };

  const onDocMouseMove = (ev: MouseEvent) => {
    if (!draggingRef.current.active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = ev.clientX - rect.left;
    const clientY = ev.clientY - rect.top;
    const dx = clientX - (draggingRef.current.startX || 0);
    const dy = clientY - (draggingRef.current.startY || 0);
    const startArea = draggingRef.current.startArea!;
    setCropArea({
      ...startArea,
      x: Math.max(0, startArea.x + dx),
      y: Math.max(0, startArea.y + dy),
      width: startArea.width,
      height: startArea.height,
    });
  };

  const onDocMouseUp = () => {
    draggingRef.current.active = false;
    document.removeEventListener("mousemove", onDocMouseMove);
    document.removeEventListener("mouseup", onDocMouseUp);
  };

  // Pequeno helper para adaptar cropArea quando zoom muda (conserva centro)
  useEffect(() => {
    // opcional: você pode ajustar aqui se quiser que o crop "escale" com a imagem
    // Neste exemplo mantemos o cropArea em pixels da "visão" (portanto não alteramos automaticamente).
  }, [zoom]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-grow relative flex items-center justify-center bg-[#18181B] overflow-hidden"
        style={{ minHeight: 300 }}
      >
        {/* Imagem escalada */}
        {image && (
          <img
            src={image.src}
            alt="Crop"
            className="object-contain"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
              // para que a imagem seja posicionada no canto superior-esquerdo do container visual,
              // se preferir centralizar troque por posicionamento diferente.
              display: "block",
              maxWidth: "none",
            }}
          />
        )}

        {/* Overlay da área de crop */}
        <div
          className="absolute border-2 border-emerald-500 shadow-lg bg-transparent cursor-move"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
          }}
          onMouseDown={handleMouseDownArea}
        />

        {/* Máscara escura ao redor (opcional): */}
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
            <rect width="100%" height="100%" fill="black" opacity="0.5" mask="url(#maskCrop)" />
          </svg>
        </div>
      </div>

      {/* Controles */}
      <div className="p-4 border-t bg-[#27272A]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Zoom</span>
          <span className="text-white">{zoom}%</span>
        </div>

        {/* Slider nativo substituindo componente ausente */}
        <div className="mb-4">
          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom"
          />
        </div>

        <div className="flex gap-2">
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
