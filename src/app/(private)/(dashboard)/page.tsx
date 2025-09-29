"use client";

import { type DragEvent, useCallback, useState } from "react";
import { Board } from "@/components/board";
import { Header } from "@/components/header";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useKanban } from "@/providers/kanban-provider";
import type { ImageItem } from "@/types/kanban";

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [_dragOverColumnId, setDragOverColumnId] = useState<string | null>(
    null,
  );
  const { addImagesToColumn, columns } = useKanban();

  // Column translations for drag drop area
  const columnTranslations = useLanguageKey("column");

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLElement>, targetColumnId?: string) => {
      e.preventDefault();
      setIsDragging(false);
      setDragOverColumnId(null);

      // Determine which column to add the image to
      const columnId = targetColumnId || columns[0]?.id;
      if (!columnId) return;

      const url =
        e.dataTransfer.getData("text/uri-list") ||
        e.dataTransfer.getData("text/plain");

      if (url && /^https?:\/\//i.test(url)) {
        if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(url)) {
          const fileName =
            decodeURIComponent(
              new URL(url).pathname.split("/").pop() || "image",
            ) || "image";
          const newImage: ImageItem = {
            id: crypto.randomUUID(),
            src: url,
            fileName,
            rotation: 0,
            size: 0,
          };
          addImagesToColumn(columnId, [newImage]);
          return;
        }
      }

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        const newImages: ImageItem[] = imageFiles.map((file) => ({
          id: crypto.randomUUID(),
          src: URL.createObjectURL(file),
          fileName: file.name,
          rotation: 0,
          size: file.size,
        }));
        addImagesToColumn(columnId, newImages);
      }
    },
    [addImagesToColumn, columns],
  );

  return (
    <main className="h-screen flex flex-col">
      <Header onToggleAllChange={() => {}} toggleAllColumnsSave={() => {}} />

      <section
        className={[
          "flex-grow relative border-2 border-dashed rounded-xl m-4 transition-all duration-300",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-inner"
            : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragging) setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
          setDragOverColumnId(null);
        }}
        onDrop={(e) => handleDrop(e)}
        aria-label={columnTranslations.dragDropArea}
      >
        <Board />
      </section>
    </main>
  );
}
