"use client";

import dynamic from "next/dynamic";
import { type DragEvent, memo, useCallback, useState } from "react";
import { Header } from "@/components/header";
import { useLanguageKey } from "@/hooks/use-i18n";
import { useKanban } from "@/providers/kanban-provider";
import type { ImageItem } from "@/types/kanban";

// Dynamically import components that are not critical for initial render
const DynamicBoard = dynamic(
  () => import("@/components/board").then((mod) => mod.Board),
  {
    ssr: false,
    loading: () => (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-pulse">Carregando quadro...</div>
      </div>
    ),
  }
);

// Memoize the Dashboard component to prevent unnecessary re-renders
const Dashboard = memo(() => {
  const [isDragging, setIsDragging] = useState(false);
  const [_dragOverColumnId, setDragOverColumnId] = useState<string | null>(
    null
  );
  const { addImagesToColumn, columns } = useKanban();

  // Column translations for drag drop area
  const columnTranslations = useLanguageKey("column");

  // Memoize the handleDrop function to prevent recreation on each render
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
              new URL(url).pathname.split("/").pop() || "image"
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
    [addImagesToColumn, columns]
  );

  // Memoize event handlers
  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
    setDragOverColumnId(null);
  }, []);

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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
        aria-label={columnTranslations["drag-drop-area"]}
      >
        <DynamicBoard />
      </section>
    </main>
  );
});

// Add display name for debugging
Dashboard.displayName = "Dashboard";

export default Dashboard;
