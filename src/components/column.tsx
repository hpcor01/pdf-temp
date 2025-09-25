import { Droppable } from "@hello-pangea/dnd";
import { Pencil, Trash2 } from "lucide-react";
import { type DragEvent, useEffect, useState } from "react";
import { ImageCard } from "@/components/image-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useKanban } from "@/providers/kanban-provider";
import type { ColumnProps } from "@/types/column";

export function ColumnComponent({ column, index }: ColumnProps) {
  const {
    removeColumn,
    renameColumn,
    removeImage,
    rotateImage,
    addImagesToColumn,
    selectedColumns,
    toggleColumnSelection,
    areAllColumnsSelected,
  } = useKanban();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedColumns[column.id] || false;

  // Sync individual column selection with "select all" state
  useEffect(() => {
    if (areAllColumnsSelected && !isSelected) {
      toggleColumnSelection(column.id, true);
    }
  }, [areAllColumnsSelected, isSelected, column.id, toggleColumnSelection]);

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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Add this to prevent event bubbling
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const url =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");

    if (url && /^https?:\/\//i.test(url)) {
      if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(url)) {
        const fileName =
          decodeURIComponent(
            new URL(url).pathname.split("/").pop() || "image",
          ) || "image";
        const newImage = {
          id: crypto.randomUUID(),
          src: url,
          fileName,
          rotation: 0,
          size: 0,
        };
        // Add image to this column
        addImagesToColumn(column.id, [newImage]);
        return;
      }
    }

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map((file) => ({
        id: crypto.randomUUID(),
        src: URL.createObjectURL(file),
        fileName: file.name,
        rotation: 0,
        size: file.size,
      }));
      // Add images to this column
      addImagesToColumn(column.id, newImages);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    toggleColumnSelection(column.id, checked);
  };

  return (
    <Droppable droppableId={column.id}>
      {(provided) => (
        <section
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex flex-col w-64 min-w-[16rem] rounded-lg shadow transition-all duration-200 ${
            isDragOver
              ? "bg-primary/10 border-2 border-dashed border-primary"
              : "bg-card"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label={`${column.title} column`}
        >
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={handleCheckboxChange}
                  className="cursor-pointer"
                />
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
        </section>
      )}
    </Droppable>
  );
}
