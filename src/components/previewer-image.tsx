"use client";
import { removeBackground } from "@imgly/background-removal";
import { Check, Crop, Eraser, Loader2, X } from "lucide-react";
import Image from "next/image";
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
  const { previewImage, updatePreviewImage } = usePreviewer();

  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Estados do recorte
  const [openCrop, setOpenCrop] = useState(false);
  const [cropArea, setCropArea] = useState({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Estados do remover fundo
  const [openRemoveBg, setOpenRemoveBg] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Carrega imagem
  useEffect(() => {
    if (!previewImage?.src) return;
    const img = new window.Image() as HTMLImageElement;
    img.src = previewImage.src;
    img.onload = () => setImage(img);
  }, [previewImage]);

  // Controle de arrastar/redimensionar recorte
  const handleMouseDown = (
    e: React.MouseEvent,
    handle: string | null = null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStart({ x: e.clientX, y: e.clientY });
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setDragStart({ x: e.clientX, y: e.clientY });

      setCropArea((prev) => {
        const newArea = { ...prev };
        if (isDragging) {
          newArea.x += dx;
          newArea.y += dy;
        } else if (isResizing && resizeHandle) {
          if (resizeHandle.includes("e"))
            newArea.width = Math.max(50, prev.width + dx);
          if (resizeHandle.includes("s"))
            newArea.height = Math.max(50, prev.height + dy);
          if (resizeHandle.includes("w")) {
            newArea.x += dx;
            newArea.width = Math.max(50, prev.width - dx);
          }
          if (resizeHandle.includes("n")) {
            newArea.y += dy;
            newArea.height = Math.max(50, prev.height - dy);
          }
        }
        return newArea;
      });
    },
    [isDragging, isResizing, dragStart, resizeHandle]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Aplica recorte
  const handleCrop = () => {
    if (!image || !canvasRef.current || !previewImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = zoom / 100;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      image,
      cropArea.x / scale,
      cropArea.y / scale,
      cropArea.width / scale,
      cropArea.height / scale,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    const dataUrl = canvas.toDataURL("image/png");
    updatePreviewImage({ ...previewImage, src: dataUrl });
    setOpenCrop(false);
  };

  // Remove fundo via IA
  const handleRemoveBackground = async () => {
    if (!previewImage?.src) return;
    setOpenRemoveBg(true);
    setProcessing(true);
    setProgress(0);
    setProcessedImage(null);
    setOriginalImage(previewImage.src);

    try {
      const blob = await fetch(previewImage.src).then((r) => r.blob());
      const resultBlob = await removeBackground(blob, {
        progress: (_status: string, p: number) =>
          setProgress(Math.round(p * 100)),
      });
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
    } catch (err) {
      console.error("Erro ao remover fundo:", err);
    } finally {
      setProcessing(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#18181B] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex flex-col items-center gap-6">
          <Card className="bg-[#27272A] border-gray-800 w-full max-w-4xl flex items-center justify-center p-4 relative">
            {previewImage?.src ? (
              <Image
                src={previewImage.src}
                alt="Imagem"
                className="max-w-full max-h-[70vh] rounded-lg object-contain"
                style={{ transform: `scale(${zoom / 100})` }}
                draggable={false}
              />
            ) : (
              <p className="text-gray-400">Nenhuma imagem carregada</p>
            )}
          </Card>

          <div className="flex flex-wrap justify-center gap-4 w-full max-w-3xl">
            <div className="flex flex-col items-center w-64">
              <label
                htmlFor="zoom-slider"
                className="text-sm text-gray-400 mb-1"
              >
                Zoom: {zoom}%
              </label>
              <Slider
                id="zoom-slider"
                value={[zoom]}
                onValueChange={(v) => setZoom(v?.[0] ?? 100)}
                min={25}
                max={200}
                step={5}
              />
            </div>

            <Button
              onClick={() => setOpenCrop(true)}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-6 py-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Crop className="w-5 h-5" /> Recortar
            </Button>

            <Button
              onClick={handleRemoveBackground}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 px-6 py-5 rounded-xl flex items-center gap-2"
            >
              <Eraser className="w-5 h-5 text-emerald-400" /> Remover Fundo (IA)
            </Button>
          </div>
        </div>

        {/* Modal Recorte */}
        <Dialog open={openCrop} onOpenChange={setOpenCrop}>
          <DialogContent className="max-w-5xl h-[85vh] bg-zinc-900 border border-zinc-800 text-white p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Crop className="w-5 h-5 text-emerald-500" /> Recortar Imagem
              </DialogTitle>
              <Button
                variant="ghost"
                onClick={() => setOpenCrop(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogHeader>

            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
              {image ? (
                <div className="relative w-[90%] h-[80%] flex items-center justify-center">
                  <Image
                    src={image.src}
                    alt="Imagem"
                    className="max-w-full max-h-full object-contain select-none"
                    style={{ transform: `scale(${zoom / 100})` }}
                    draggable={false}
                  />
                  <button
                    className="absolute border-2 border-emerald-500 bg-black/10 cursor-move"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                    onMouseDown={(e) => handleMouseDown(e)}
                    type="button"
                  >
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      {[
                        "grid-0",
                        "grid-1",
                        "grid-2",
                        "grid-3",
                        "grid-4",
                        "grid-5",
                        "grid-6",
                        "grid-7",
                        "grid-8",
                      ].map((key) => (
                        <div
                          key={key}
                          className="border border-emerald-500/30"
                        />
                      ))}
                    </div>
                    {["nw", "n", "ne", "w", "e", "sw", "s", "se"].map(
                      (handle) => (
                        <button
                          key={handle}
                          className="absolute w-5 h-5 bg-emerald-500 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform"
                          style={{
                            top: handle.includes("n")
                              ? -10
                              : handle.includes("s")
                                ? "calc(100% - 10px)"
                                : "calc(50% - 10px)",
                            left: handle.includes("w")
                              ? -10
                              : handle.includes("e")
                                ? "calc(100% - 10px)"
                                : "calc(50% - 10px)",
                            cursor: `${handle}-resize`,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, handle)}
                          type="button"
                        />
                      )
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma imagem carregada</p>
              )}
            </div>

            <div className="flex justify-center gap-4 p-4 border-t border-zinc-800 bg-zinc-900">
              <Button
                onClick={handleCrop}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpenCrop(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal IA */}
        <Dialog open={openRemoveBg} onOpenChange={setOpenRemoveBg}>
          <DialogContent className="max-w-5xl h-[85vh] bg-zinc-900 border border-zinc-800 text-white p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Eraser className="w-5 h-5 text-emerald-500" /> Remover Fundo
              </DialogTitle>
              <Button
                variant="ghost"
                onClick={() => setOpenRemoveBg(false)}
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
                  onClick={() => {
                    if (processedImage && previewImage) {
                      updatePreviewImage({
                        ...previewImage,
                        src: processedImage,
                      });
                    }
                    setOpenRemoveBg(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Confirmar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpenRemoveBg(false)}
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
