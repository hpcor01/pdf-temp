"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import {
  type DragEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useKanban } from "@/providers/kanban-provider";
import type { Column, ImageItem } from "@/types/kanban";

// Dynamically import ImageCard for better performance
const ImageCard = dynamic(
  () => import("@/components/image-card").then((mod) => mod.ImageCard),
  {
    ssr: false,
  }
);

// Memoize the ColumnComponent to prevent unnecessary re-renders
const ColumnComponent = memo(
  ({ column, index }: { column: Column; index: number }) => {
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

    // Column translations
    const columnTranslations = useLanguageKey("column");

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

    const handleSaveTitle = useCallback(() => {
      if (title.trim()) {
        renameColumn(column.id, title.trim());
      }
      setIsEditing(false);
    }, [title, column.id, renameColumn]);

    const handleRemoveColumn = useCallback(() => {
      // Prevent removing the first column
      if (index === 0) return;
      removeColumn(column.id);
    }, [index, column.id, removeColumn]);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.stopPropagation();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
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
                new URL(url).pathname.split("/").pop() || "image"
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
      },
      [column.id, addImagesToColumn]
    );

    const handleCheckboxChange = useCallback(
      (checked: boolean) => {
        toggleColumnSelection(column.id, checked);
      },
      [column.id, toggleColumnSelection]
    );

    // Calculate total images in this column
    const totalImages = useMemo(
      () => column.items.length,
      [column.items.length]
    );

    // Memoize translation functions to prevent recreation on each render
    const getColumnLabel = useMemo(() => {
      if (!columnTranslations) return `Column ${column.title}`;
      return (
        columnTranslations["column-label"]?.replace(
          "{{title}}",
          column.title
        ) || `Column ${column.title}`
      );
    }, [columnTranslations, column.title]);

    const getSelectColumnLabel = useMemo(() => {
      if (!columnTranslations) return `Select column ${column.title}`;
      return (
        columnTranslations["select-column"]?.replace(
          "{{title}}",
          column.title
        ) || `Select column ${column.title}`
      );
    }, [columnTranslations, column.title]);

    const getEditColumnTitleLabel = useMemo(() => {
      if (!columnTranslations) return `Edit column title ${column.title}`;
      return (
        columnTranslations["edit-column-title"]?.replace(
          "{{title}}",
          column.title
        ) || `Edit column title ${column.title}`
      );
    }, [columnTranslations, column.title]);

    const getTotalImagesLabel = useMemo(() => {
      if (!columnTranslations) return `Total: ${totalImages}`;
      return (
        columnTranslations["total-images"]?.replace(
          "{{count}}",
          totalImages.toString()
        ) || `Total: ${totalImages}`
      );
    }, [columnTranslations, totalImages]);

    const getEditColumnLabel = useMemo(() => {
      if (!columnTranslations) return "Edit column";
      return columnTranslations["edit-column"] || "Edit column";
    }, [columnTranslations]);

    const getRemoveColumnLabel = useMemo(() => {
      if (!columnTranslations) return "Remove column";
      return columnTranslations["remove-column"] || "Remove column";
    }, [columnTranslations]);

    const getImagesInColumnLabel = useMemo(() => {
      if (!columnTranslations) return `Images in column ${column.title}`;
      return (
        columnTranslations["images-in-column"]?.replace(
          "{{title}}",
          column.title
        ) || `Images in column ${column.title}`
      );
    }, [columnTranslations, column.title]);

    return (
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col w-64 min-w-[16rem] rounded-lg shadow transition-all duration-200 ${
              isDragOver || snapshot.isDraggingOver
                ? "bg-primary/10 border-2 border-dashed border-primary"
                : "bg-card"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-label={getColumnLabel}
          >
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={handleCheckboxChange}
                    className="cursor-pointer"
                    aria-label={getSelectColumnLabel}
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
                      aria-label={getEditColumnTitleLabel}
                    />
                  ) : (
                    <div className="flex flex-col">
                      <p className="font-medium truncate">{column.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {getTotalImagesLabel}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-7 w-7 p-0 cursor-pointer"
                    aria-label={getEditColumnLabel}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveColumn}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 cursor-pointer"
                      aria-label={getRemoveColumnLabel}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <section
              className="flex-grow overflow-y-auto max-h-[calc(100vh-200px)] p-2"
              aria-label={getImagesInColumnLabel}
            >
              {column.items.map((item: ImageItem, itemIndex: number) => (
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
            </section>
          </section>
        )}
      </Droppable>
    );
  }
);

// Add display name for debugging
ColumnComponent.displayName = "ColumnComponent";

export { ColumnComponent };
