import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useKanban } from "@/providers/kanban-provider";
import type { ColumnProps } from "@/types/column";
import { BtnCreateColumn } from "./btn-create-column";

// Dynamically import ColumnComponent for code splitting
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
  }
);

export function Board() {
  const { columns, moveImage, addColumn } = useKanban();

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId, type } = result;

      // Dropped outside the list
      if (!destination) return;

      // If dragging a column
      if (type === "COLUMN") {
        if (source.index === destination.index) return;
        // We could implement column reordering here if needed
        return;
      }

      // If dragging an image
      if (source.droppableId === destination.droppableId) {
        // Same column, but position changed
        if (source.index === destination.index) return;

        moveImage(
          source.droppableId,
          destination.droppableId,
          draggableId,
          destination.index
        );
      } else {
        // Different column
        moveImage(
          source.droppableId,
          destination.droppableId,
          draggableId,
          destination.index
        );
      }
    },
    [moveImage]
  );

  const handleAddColumn = (title?: string) => {
    addColumn(title || "");
  };

  return (
    <div className="flex flex-col h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex overflow-x-auto gap-4 p-4 flex-grow">
          {columns.map((column, index) => (
            <ColumnComponent key={column.id} column={column} index={index} />
          ))}
        </div>
      </DragDropContext>
      <BtnCreateColumn onClick={handleAddColumn} />
    </div>
  );
}
