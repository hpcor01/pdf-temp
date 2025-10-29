"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Crop, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewer } from "@/providers/previewer-provider";
import { useKanban } from "@/providers/kanban-provider";
import { Toast } from "@/components/ui/toast";

export default function PreviewerImage() {
  const {
    previewImage,
    previewImageColumnId,
    isPreviewerOpen,
    closePreviewer,
    updatePreviewImage,
  } = usePreviewer();
  const { updateImage } = useKanban();

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

  if (!isPreviewerOpen || !previewImage) return null;

  return (
    <>
      <CropModal
        imageSrc={previewImage.src}
        onClose={closePreviewer}
        onSave={handleSaveCrop}
      />
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

  // Eventos globais
  useEffect(() => {
    const handleUp = () => {
      setDraggingImage(false);
      setDraggingSelection(false);
      setResizing(null);
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, []);

  // Mover ou redimensionar
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

  // Iniciar drag imagem
  const handleImageMouseDown = (e: React.MouseEvent) => {
    setDraggingImage(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartPosition(position);
  };

  // Iniciar drag seleção
  const handleSelectionMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingSelection(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSelection(selection);
  };

  // Iniciar resize
  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    setResizing(dir);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSelection(selection);
  };

  // Aplicar recorte
  const handleCrop = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const scale = zoom;

    canvas.width = selection.width;
    canvas.height = selection.height;

    const cropX = (selection.x - position.x) / scale;
    const cropY = (selection.y - position.y) / scale;
    const cropW = selection.width / scale;
    const cropH = selection.height / scale;

    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, selection.width, selection.height);
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
        onMouseUp={() => {
          setDraggingImage(false);
          setDraggingSelection(false);
          setResizing(null);
        }}
      >
        {/* IMAGEM */}
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

        {/* SELEÇÃO */}
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
          {/* Linhas de grade */}
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

        {/* MÁSCARA */}
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

        {/* CONTROLES */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-4 bg-black/70 rounded-full px-6 py-3 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
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