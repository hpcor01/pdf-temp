"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Column, ImageItem, KanbanContextType } from "@/types/kanban";

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "column-1",
      title: "PDF 1",
      items: [],
      save: false,
    },
  ]);
  const [selectedColumns, setSelectedColumns] = useState<
    Record<string, boolean>
  >({});

  // Memoize areAllColumnsSelected to prevent unnecessary recalculations
  const areAllColumnsSelected = useMemo(
    () =>
      columns.length > 0 &&
      columns.every((column) => selectedColumns[column.id]),
    [columns, selectedColumns]
  );

  const addColumn = useCallback(
    (title: string) => {
      const newColumn: Column = {
        id: `column-${Date.now()}`,
        title: title || `PDF ${columns.length + 1}`,
        items: [],
        save: false,
      };
      setColumns((prev) => [...prev, newColumn]);
    },
    [columns.length]
  );

  const removeColumn = useCallback((id: string) => {
    if (id === "column-1") return;
    setColumns((prev) => prev.filter((col) => col.id !== id));
    setSelectedColumns((prev) => {
      const newSelected = { ...prev };
      delete newSelected[id];
      return newSelected;
    });
  }, []);

  const renameColumn = useCallback((id: string, title: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, title } : col))
    );
  }, []);

  const addImagesToColumn = useCallback(
    (columnId: string, images: ImageItem[]) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, items: [...col.items, ...images] }
            : col
        )
      );
    },
    []
  );

  const removeImage = useCallback((columnId: string, imageId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, items: col.items.filter((img) => img.id !== imageId) }
          : col
      )
    );
  }, []);

  const updateImage = useCallback(
    (columnId: string, updatedImage: ImageItem) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? {
                ...col,
                items: col.items.map((img) =>
                  img.id === updatedImage.id ? updatedImage : img
                ),
              }
            : col
        )
      );
    },
    []
  );

  const rotateImage = useCallback(
    (columnId: string, imageId: string, rotation: number) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? {
                ...col,
                items: col.items.map((img) =>
                  img.id === imageId ? { ...img, rotation } : img
                ),
              }
            : col
        )
      );
    },
    []
  );

  const moveImage = useCallback(
    (
      sourceColumnId: string,
      destColumnId: string,
      imageId: string,
      destIndex: number
    ) => {
      setColumns((prev) => {
        const newColumns = [...prev];
        const sourceColumnIndex = newColumns.findIndex(
          (col) => col.id === sourceColumnId
        );
        const destColumnIndex = newColumns.findIndex(
          (col) => col.id === destColumnId
        );

        if (sourceColumnIndex === -1 || destColumnIndex === -1) return prev;

        const sourceColumn = newColumns[sourceColumnIndex];
        const destColumn = newColumns[destColumnIndex];

        const imageIndex = sourceColumn.items.findIndex(
          (img) => img.id === imageId
        );

        if (imageIndex === -1) return prev;

        const [movedImage] = sourceColumn.items.splice(imageIndex, 1);

        if (sourceColumnId === destColumnId) {
          sourceColumn.items.splice(destIndex, 0, movedImage);
        } else destColumn.items.splice(destIndex, 0, movedImage);

        return newColumns;
      });
    },
    []
  );

  const moveColumn = useCallback((sourceIndex: number, destIndex: number) => {
    setColumns((prev) => {
      const newColumns = [...prev];
      const [movedColumn] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(destIndex, 0, movedColumn);
      return newColumns;
    });
  }, []);

  const toggleColumnSelection = useCallback(
    (columnId: string, selected: boolean) => {
      setSelectedColumns((prev) => ({
        ...prev,
        [columnId]: selected,
      }));
    },
    []
  );

  const toggleAllColumnsSelection = useCallback(
    (selected: boolean) => {
      const newSelected: Record<string, boolean> = {};
      columns.forEach((column) => {
        newSelected[column.id] = selected;
      });
      setSelectedColumns(newSelected);
    },
    [columns]
  );

  const saveSelectedColumns = useCallback(
    async (convertToPDF: boolean, savePath: string) => {
      const selectedColumnsList = columns.filter(
        (column) => selectedColumns[column.id]
      );

      if (selectedColumnsList.length === 0) {
        console.warn("No columns selected for saving");
        return;
      }

      alert(
        `Would save ${selectedColumnsList.length} columns to ${savePath} as ${
          convertToPDF ? "PDF" : "images"
        }`
      );
    },
    [columns, selectedColumns]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      columns,
      selectedColumns,
      addColumn,
      removeColumn,
      renameColumn,
      addImagesToColumn,
      removeImage,
      updateImage,
      rotateImage,
      moveImage,
      moveColumn,
      toggleColumnSelection,
      toggleAllColumnsSelection,
      areAllColumnsSelected,
      saveSelectedColumns,
    }),
    [
      columns,
      selectedColumns,
      addColumn,
      removeColumn,
      renameColumn,
      addImagesToColumn,
      removeImage,
      updateImage,
      rotateImage,
      moveImage,
      moveColumn,
      toggleColumnSelection,
      toggleAllColumnsSelection,
      areAllColumnsSelected,
      saveSelectedColumns,
    ]
  );

  return (
    <KanbanContext.Provider value={contextValue}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}
