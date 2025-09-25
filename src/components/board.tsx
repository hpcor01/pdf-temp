import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useCallback } from "react";
import { useKanban } from "@/providers/kanban-provider";
import { BtnCreateColumn } from "./btn-create-column";
import { ColumnComponent } from "./column";

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
