"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Crop, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewer } from "@/providers/previewer-provider";
import { useKanban } from "@/providers/kanban-provider";
import { Toast } from "@/components/ui/toast";
import { layoutAnalyzer, TextRegion } from "@/lib/layout-analysis";
import { createWorker } from 'tesseract.js';

export function PreviewerImage() {
  const {
    previewImage,
    previewImageColumnId,
    isPreviewerOpen,
    closePreviewer,
    updatePreviewImage,
  } = usePreviewer();
  const { updateImage, isRemoveBgChecked } = useKanban();

  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");

  const showToast = (title: string, desc: string) => {
    setToastTitle(title);
    setToastDescription(desc);
    setToastOpen(true);
  };

  const handleSaveCrop = useCallback(
    (cropped: string) => {
      if (previewImage) {
        const updated = { ...previewImage, src: cropped };
        updatePreviewImage(updated);
        if (previewImageColumnId) updateImage(previewImageColumnId, updated);
        showToast("Imagem cortada", "O recorte foi salvo com sucesso.");
      }
    },
    [previewImage, previewImageColumnId, updateImage, updatePreviewImage]
  );

  const handleSaveBackgroundRemoval = useCallback(
    (processed: string) => {
      if (previewImage) {
        const updated = { ...previewImage, src: processed };
        updatePreviewImage(updated);
        if (previewImageColumnId) updateImage(previewImageColumnId, updated);
        showToast("Fundo removido", "O fundo foi removido com sucesso.");
      }
    },
    [previewImage, previewImageColumnId, updateImage, updatePreviewImage]
  );

  if (!isPreviewerOpen || !previewImage) return null;

  return (
    <>
      {isRemoveBgChecked ? (
        <BackgroundRemovalModal
          imageSrc={previewImage.src}
          onClose={closePreviewer}
          onSave={handleSaveBackgroundRemoval}
        />
      ) : (
        <CropModal
          imageSrc={previewImage.src}
          onClose={closePreviewer}
          onSave={handleSaveCrop}
        />
      )}
      <Toast
        title={toastTitle}
        description={toastDescription}
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant="default"
      />
    </>
  );
}

function BackgroundRemovalModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string;
  onClose: () => void;
  onSave: (processed: string) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [draggingImage, setDraggingImage] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState(position);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carregar imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  // Reset handlers
  useEffect(() => {
    const handleUp = () => {
      setDraggingImage(false);
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingImage) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      setPosition({
        x: startPosition.x + dx,
        y: startPosition.y + dy,
      });
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    setDraggingImage(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartPosition(position);
  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    try {
      const { removeBackground } = await import("@imgly/background-removal");

      const response = await fetch(image.src);
      const blob = await response.blob();

      // Use the default model which is more conservative for documents
      const processedBlob = await removeBackground(blob, {
        model: 'isnet', // Default model - more conservative for preserving details
        output: {
          format: 'image/png',
          quality: 1.0,
        },
        progress: (key: string, current: number, total: number) => {
          setProgress(Math.round((current / total) * 100));
        },
      });

      setProgress(100);

      // Convert to white background
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const whiteBgUrl = canvas.toDataURL("image/png");
          setProcessedImage(whiteBgUrl);
        };
        img.src = URL.createObjectURL(processedBlob);
      } else {
        const processedUrl = URL.createObjectURL(processedBlob);
        setProcessedImage(processedUrl);
      }
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Helper function to apply text preservation
  async function applyTextPreservation(segmentedBlob: Blob, maskCanvas: HTMLCanvasElement, originalImage: HTMLImageElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      // Load the segmented image
      const segmentedImg = new Image();
      segmentedImg.onload = () => {
        // Draw the segmented image
        ctx.drawImage(segmentedImg, 0, 0);

        // Get mask data
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) {
          reject(new Error('Could not get mask canvas context'));
          return;
        }

        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

        // Create image data for the result
        const resultData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Apply mask: where mask is black (text areas), keep original image
        for (let i = 0; i < resultData.data.length; i += 4) {
          const maskIndex = Math.floor(i / 4) * 4;
          const maskValue = maskData.data[maskIndex] || 0; // Use red channel as mask

          if (maskValue < 128) { // Text area (black in mask)
            // Keep original image pixels
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            const originalPixel = (originalImage.width > x && originalImage.height > y ?
              getImagePixel(originalImage, x, y) : [255, 255, 255, 255]) as [number, number, number, number];

            const [r, g, b, a] = originalPixel;
            resultData.data[i] = r;     // R
            resultData.data[i + 1] = g; // G
            resultData.data[i + 2] = b; // B
            resultData.data[i + 3] = 255; // A (fully opaque)
          }
          // Non-text areas keep the segmented result
        }

        ctx.putImageData(resultData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create blob'));
          }
        }, 'image/png');
      };
      segmentedImg.onerror = () => reject(new Error('Could not load segmented image'));
      segmentedImg.src = URL.createObjectURL(segmentedBlob);
    });
  }

  // Helper function to get pixel data from image
  function getImagePixel(img: HTMLImageElement, x: number, y: number): [number, number, number, number] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [255, 255, 255, 255];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(x, y, 1, 1).data;
    return [data[0], data[1], data[2], data[3]] as [number, number, number, number];
  }

  const handleSave = () => {
    if (processedImage) {
      onSave(processedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center select-none">
      <div
        className="relative w-[95%] h-[90%] bg-[#18181B] overflow-hidden rounded-2xl border border-gray-700 flex flex-col"
        onMouseMove={handleMouseMove}
      >
        {/* Imagem */}
        <div className="flex-1 flex items-center justify-center p-4">
          {processedImage ? (
            <img
              src={processedImage}
              alt="Background removed"
              className="absolute top-1/2 left-1/2 object-contain cursor-grab"
              draggable={false}
              onMouseDown={handleImageMouseDown}
              style={{
                transform: `translate(-50%, -50%) scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
              }}
            />
          ) : image ? (
            <img
              src={image.src}
              alt="Original"
              className="absolute top-1/2 left-1/2 object-contain cursor-grab"
              draggable={false}
              onMouseDown={handleImageMouseDown}
              style={{
                transform: `translate(-50%, -50%) scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
              }}
            />
          ) : (
            <div className="text-white">Carregando imagem...</div>
          )}
        </div>

        {/* Controles */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-4 bg-black/70 rounded-full px-6 py-3 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          {!processedImage && (
            <Button
              size="sm"
              onClick={handleRemoveBackground}
              disabled={isProcessing}
            >
              {isProcessing ? `Processando... ${progress}%` : "Remover Fundo"}
            </Button>
          )}
          {processedImage && (
            <Button size="sm" onClick={handleSave}>
              Salvar
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

function CropModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string;
  onClose: () => void;
  onSave: (cropped: string) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [draggingImage, setDraggingImage] = useState(false);
  const [selection, setSelection] = useState({
    x: 200,
    y: 100,
    width: 400,
    height: 300,
  });
  const [draggingSelection, setDraggingSelection] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSelection, setStartSelection] = useState(selection);
  const [startPosition, setStartPosition] = useState(position);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carregar imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  // Reset handlers
  useEffect(() => {
    const handleUp = () => {
      setDraggingImage(false);
      setDraggingSelection(false);
      setResizing(null);
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    if (draggingImage) {
      setPosition({
        x: startPosition.x + dx,
        y: startPosition.y + dy,
      });
    }

    if (draggingSelection) {
      setSelection({
        ...startSelection,
        x: startSelection.x + dx,
        y: startSelection.y + dy,
      });
    }

    if (resizing) {
      let newSel = { ...startSelection };
      if (resizing.includes("e")) newSel.width = Math.max(50, startSelection.width + dx);
      if (resizing.includes("s")) newSel.height = Math.max(50, startSelection.height + dy);
      if (resizing.includes("w")) {
        newSel.width = Math.max(50, startSelection.width - dx);
        newSel.x = startSelection.x + dx;
      }
      if (resizing.includes("n")) {
        newSel.height = Math.max(50, startSelection.height - dy);
        newSel.y = startSelection.y + dy;
      }
      setSelection(newSel);
    }
  };

  // Drag imagem
  const handleImageMouseDown = (e: React.MouseEvent) => {
    setDraggingImage(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartPosition(position);
  };

  const handleSelectionMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingSelection(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSelection(selection);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    setResizing(dir);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSelection(selection);
  };

  // Aplicar recorte (corrigido)
  const handleCrop = () => {
    if (!image || !canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const container = containerRef.current.getBoundingClientRect();
    const imgDisplayWidth = image.width * zoom;
    const imgDisplayHeight = image.height * zoom;

    const imgCenterX = container.width / 2 + position.x;
    const imgCenterY = container.height / 2 + position.y;

    const imgX = imgCenterX - imgDisplayWidth / 2;
    const imgY = imgCenterY - imgDisplayHeight / 2;

    const sx = (selection.x - imgX) / zoom;
    const sy = (selection.y - imgY) / zoom;
    const sw = selection.width / zoom;
    const sh = selection.height / zoom;

    canvas.width = selection.width;
    canvas.height = selection.height;

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, selection.width, selection.height);

    const result = canvas.toDataURL("image/png");
    onSave(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center select-none">
      <div
        ref={containerRef}
        className="relative w-[95%] h-[90%] bg-[#18181B] overflow-hidden rounded-2xl border border-gray-700"
        onMouseMove={handleMouseMove}
      >
        {/* Imagem */}
        {image && (
          <img
            src={image.src}
            alt="Crop"
            draggable={false}
            onMouseDown={handleImageMouseDown}
            className="absolute top-1/2 left-1/2 object-contain cursor-grab"
            style={{
              transform: `translate(-50%, -50%) scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
          />
        )}

        {/* Seleção */}
        <div
          className="absolute border-2 border-emerald-500 bg-transparent cursor-move"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
          onMouseDown={handleSelectionMouseDown}
        >
          {/* Grade */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-emerald-500/30" />
            ))}
          </div>

          {/* Alças */}
          {["nw", "n", "ne", "w", "e", "sw", "s", "se"].map((handle) => (
            <div
              key={handle}
              className="absolute w-4 h-4 bg-emerald-500 rounded-full border-2 border-white cursor-pointer z-10"
              style={{
                top: handle.includes("n")
                  ? -6
                  : handle.includes("s")
                  ? "calc(100% - 6px)"
                  : "calc(50% - 6px)",
                left: handle.includes("w")
                  ? -6
                  : handle.includes("e")
                  ? "calc(100% - 6px)"
                  : "calc(50% - 6px)",
                cursor: `${handle}-resize`,
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            />
          ))}
        </div>

        {/* Máscara */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <mask id="cropMask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={selection.x}
                  y={selection.y}
                  width={selection.width}
                  height={selection.height}
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="black" opacity="0.6" mask="url(#cropMask)" />
          </svg>
        </div>

        {/* Controles */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-4 bg-black/70 rounded-full px-6 py-3 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleCrop}>
            <Crop className="w-4 h-4 mr-1" /> Salvar
          </Button>
          <Button variant="destructive" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
