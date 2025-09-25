import { Droppable } from "@hello-pangea/dnd";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { ImageCard } from "@/components/image-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKanban } from "@/providers/kanban-provider";
import type { Column as ColumnType } from "@/types/kanban";

interface ColumnProps {
  column: ColumnType;
  index: number;
}

export function ColumnComponent({ column, index }: ColumnProps) {
  const { removeColumn, renameColumn, removeImage, rotateImage } = useKanban();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const handleSaveTitle = () => {
    if (title.trim()) {
      renameColumn(column.id, title.trim());
    }
    setIsEditing(false);
  };

  const handleRemoveColumn = () => {
    // Prevent removing the first column
    if (index === 0) return;
    removeColumn(column.id);
  };

  return (
    <Droppable droppableId={column.id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex flex-col w-64 min-w-[16rem] bg-gray-100 dark:bg-gray-800 rounded-lg shadow"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") {
                        setTitle(column.title);
                        setIsEditing(false);
                      }
                    }}
                    autoFocus
                    className="h-7 text-sm"
                  />
                ) : (
                  <p className="font-medium truncate">{column.title}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 w-7 p-0 cursor-pointer"
                  aria-label="Editar coluna"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveColumn}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 cursor-pointer"
                    aria-label="Remover coluna"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto max-h-[calc(100vh-200px)] p-2">
            {column.items.map((item, itemIndex) => (
              <ImageCard
                key={item.id}
                item={item}
                index={itemIndex}
                columnId={column.id}
                onRemove={removeImage}
                onRotate={rotateImage}
              />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
