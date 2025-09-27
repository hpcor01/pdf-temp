"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import { useKanban } from "@/providers/kanban-provider";
import { usePreview } from "@/providers/preview-provider";
import { usePreviewer } from "@/providers/previewer-provider";
import type { ColumnProps } from "@/types/column";
import { BtnCreateColumn } from "./btn-create-column";
import { PreviewerImage } from "./previewer-image";

const ColumnComponent = dynamic<ColumnProps>(
  () => import("./column").then((mod) => mod.ColumnComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col w-64 min-w-[16rem] rounded-lg shadow bg-card animate-pulse">
        <div className="p-3 border-b border-border">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="p-2 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={`loading-skeleton-${Date.now()}-${i}`}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    ),
  },
);

export function Board() {
  const { columns, moveImage, addColumn } = useKanban();
  const { previewImage, isClickPreview, clearPreview } = usePreview();
  const { isPreviewerOpen } = usePreviewer();

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId, type } = result;

      if (!destination) return;

      if (type === "COLUMN") {
        if (source.index === destination.index) return;
        return;
      }

      if (source.droppableId === destination.droppableId) {
        if (source.index === destination.index) return;

        moveImage(
          source.droppableId,
          destination.droppableId,
          draggableId,
          destination.index,
        );
      } else {
        moveImage(
          source.droppableId,
          destination.droppableId,
          draggableId,
          destination.index,
        );
      }
    },
    [moveImage],
  );

  const handleAddColumn = (title?: string) => {
    addColumn(title || "");
  };

  // Handle escape key to close preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isClickPreview) {
        clearPreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClickPreview, clearPreview]);

  const showPreviewPanel = previewImage && isClickPreview;
  const showPreviewerPanel = isPreviewerOpen;

  return (
    <div className="flex h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className={`flex overflow-x-auto gap-4 p-4 flex-grow ${
            showPreviewPanel || showPreviewerPanel ? "w-3/5" : "w-full"
          }`}
        >
          {columns.map((column, index) => (
            <ColumnComponent key={column.id} column={column} index={index} />
          ))}
        </div>
      </DragDropContext>

      <BtnCreateColumn
        onClick={handleAddColumn}
        showPreviewPanel={showPreviewPanel || showPreviewerPanel}
      />

      <PreviewerImage />
    </div>
  );
}
