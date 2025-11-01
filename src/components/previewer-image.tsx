"use client";

import { removeBackground } from "@imgly/background-removal";
import { Check, Crop, Eraser, Loader2, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { usePreviewer } from "@/providers/previewer-provider";

export default function PreviewerImage() {
  const { previewImage, updatePreviewImage, isPreviewerOpen } = usePreviewer();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(100);
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [_croppedImage, setCroppedImage] = useState<string | null>(null);

  // 🔹 Controle do modal de IA
  const [openRemoveBg, setOpenRemoveBg] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // 🔹 Inicializa imagem
  useEffect(() => {
    if (!previewImage?.src) return;
    const img = new Image();
    img.src = previewImage.src;
    img.onload = () => setImage(img);
  }, [previewImage?.src]);

  // Eventos de arraste para área de recorte
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setCropArea((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart.x, dragStart.y]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Função de recorte
  const handleCrop = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = zoom / 100;
    const sx = cropArea.x / scale;
    const sy = cropArea.y / scale;
    const sw = cropArea.width / scale;
    const sh = cropArea.height / scale;
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, cropArea.width, cropArea.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCroppedImage(dataUrl);
    updatePreviewImage({
      src: dataUrl,
      fileName: previewImage?.fileName || "cropped.png",
    });
  };

  // 🔹 Função de IA (usando @imgly/background-removal)
  const handleRemoveBackground = useCallback(async () => {
    if (!previewImage?.src) return;
    setOpenRemoveBg(true);
    setProcessing(true);
    setProgress(0);
    setProcessedImage(null);
    setOriginalImage(previewImage.src);

    try {
      const blob = await fetch(previewImage.src).then((r) => r.blob());
      const resultBlob = await removeBackground(blob, {
        progress: (p: number) => setProgress(Math.round(p * 100)),
      });
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
    } catch (err) {
      console.error("Erro ao remover fundo:", err);
    } finally {
      setProcessing(false);
    }
  }, [previewImage?.src]);

  // Ativa automaticamente quando toggle “Remover fundo” estiver ligado
  useEffect(() => {
    if (isPreviewerOpen) handleRemoveBackground();
  }, [isPreviewerOpen, handleRemoveBackground]);

  const handleConfirm = () => {
    if (processedImage)
      updatePreviewImage({
        src: processedImage,
        fileName: previewImage?.fileName || "processed.png",
      });
    setOpenRemoveBg(false);
  };

  const handleCancel = () => {
    setOpenRemoveBg(false);
  };

  return (
    <div className="min-h-screen bg-[#18181B] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Área principal */}
          <Card className="bg-[#27272A] border-gray-800 flex-1 overflow-hidden">
            <div className="relative p-6 flex items-center justify-center">
              {previewImage?.src ? (
                <div
                  ref={containerRef}
                  className="relative cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  role="img"
                  aria-label="Imagem para edição"
                >
                  <img
                    ref={imageRef}
                    src={previewImage.src}
                    alt="Imagem"
                    className="max-w-full max-h-[70vh] rounded-lg select-none"
                    style={{ transform: `scale(${zoom / 100})` }}
                    draggable={false}
                  />
                  <div
                    className="absolute border-2 border-emerald-500 pointer-events-none"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-center w-full">
                  Nenhuma imagem carregada
                </p>
              )}
            </div>
          </Card>

          {/* Controles laterais */}
          <div className="space-y-6 w-full lg:w-96">
            <Card className="bg-[#27272A] border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ZoomIn className="w-5 h-5 text-emerald-500" /> Controles
              </h3>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="zoom-slider"
                    className="text-sm text-gray-400"
                  >
                    Zoom: {zoom}%
                  </label>
                  <Slider
                    id="zoom-slider"
                    value={[zoom]}
                    onValueChange={(v) => setZoom(v[0] || 100)}
                    min={50}
                    max={200}
                    step={5}
                  />
                </div>

                <Button
                  onClick={handleCrop}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white py-6 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <Crop className="w-5 h-5 mr-2" /> Recortar
                </Button>

                <Button
                  onClick={handleRemoveBackground}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 py-6 rounded-xl flex items-center gap-2"
                >
                  <Eraser className="w-5 h-5 text-emerald-400" /> Remover fundo
                  (IA)
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Canvas oculto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 🔹 Modal de IA */}
        <Dialog open={openRemoveBg} onOpenChange={setOpenRemoveBg}>
          <DialogContent className="max-w-5xl h-[85vh] bg-zinc-900 border border-zinc-800 text-white p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Eraser className="w-5 h-5 text-emerald-500" /> Remover fundo
              </DialogTitle>
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogHeader>

            <div className="flex flex-col md:flex-row items-center justify-center h-full w-full bg-zinc-950">
              {processing ? (
                <div className="flex flex-col items-center justify-center h-full w-full text-center">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                  <p className="text-gray-400 text-sm mb-2">
                    Removendo fundo...
                  </p>
                  <p className="text-gray-500 text-xs">{progress}%</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 p-6 w-full h-full place-items-center">
                  {originalImage && (
                    <div className="flex flex-col items-center justify-center">
                      <p className="mb-2 text-gray-400 text-sm">Antes</p>
                      <Image
                        src={originalImage}
                        alt="Original"
                        width={400}
                        height={400}
                        className="rounded-lg border border-zinc-800 object-contain max-h-[60vh]"
                      />
                    </div>
                  )}
                  {processedImage && (
                    <div className="flex flex-col items-center justify-center">
                      <p className="mb-2 text-gray-400 text-sm">Depois</p>
                      <Image
                        src={processedImage}
                        alt="Sem fundo"
                        width={400}
                        height={400}
                        className="rounded-lg border border-emerald-700 object-contain max-h-[60vh] bg-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {!processing && processedImage && (
              <div className="flex justify-center gap-4 p-4 border-t border-zinc-800 bg-zinc-900">
                <Button
                  onClick={handleConfirm}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Confirmar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancelar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
