"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { ImageItem } from "@/types/kanban";

interface PreviewerContextProps {
  previewImage: ImageItem | null;
  previewImageColumnId: string | null;
  isPreviewerOpen: boolean;
  setPreviewerImage: (image: ImageItem | null, columnId?: string) => void;
  openPreviewer: (image: ImageItem, columnId?: string) => void;
  closePreviewer: () => void;
  updatePreviewImage: (image: ImageItem) => void;
}

const PreviewerContext = createContext<PreviewerContextProps | undefined>(
  undefined
);

export function PreviewerProvider({ children }: { children: ReactNode }) {
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [previewImageColumnId, setPreviewImageColumnId] = useState<
    string | null
  >(null);
  const [isPreviewerOpen, setIsPreviewerOpen] = useState(false);

  const openPreviewer = (image: ImageItem, columnId?: string) => {
    setPreviewImage(image);
    setPreviewImageColumnId(columnId || null);
    setIsPreviewerOpen(true);
  };

  const closePreviewer = () => {
    setPreviewImage(null);
    setPreviewImageColumnId(null);
    setIsPreviewerOpen(false);
  };

  const setPreviewerImage = (image: ImageItem | null, columnId?: string) => {
    setPreviewImage(image);
    setPreviewImageColumnId(columnId || null);
  };

  const updatePreviewImage = (image: ImageItem) => {
    setPreviewImage(image);
  };

  return (
    <PreviewerContext.Provider
      value={{
        previewImage,
        previewImageColumnId,
        isPreviewerOpen,
        setPreviewerImage,
        openPreviewer,
        closePreviewer,
        updatePreviewImage,
      }}
    >
      {children}
    </PreviewerContext.Provider>
  );
}

export function usePreviewer() {
  const context = useContext(PreviewerContext);
  if (context === undefined) {
    throw new Error("usePreviewer must be used within a PreviewerProvider");
  }
  return context;
}
