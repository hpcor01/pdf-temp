"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { ImageItem } from "@/types/kanban";

interface PreviewerContextProps {
  previewImage: ImageItem | null;
  isPreviewerOpen: boolean;
  setPreviewerImage: (image: ImageItem | null) => void;
  openPreviewer: (image: ImageItem) => void;
  closePreviewer: () => void;
}

const PreviewerContext = createContext<PreviewerContextProps | undefined>(
  undefined,
);

export function PreviewerProvider({ children }: { children: ReactNode }) {
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [isPreviewerOpen, setIsPreviewerOpen] = useState(false);

  const openPreviewer = (image: ImageItem) => {
    setPreviewImage(image);
    setIsPreviewerOpen(true);
  };

  const closePreviewer = () => {
    setPreviewImage(null);
    setIsPreviewerOpen(false);
  };

  const setPreviewerImage = (image: ImageItem | null) => {
    setPreviewImage(image);
  };

  return (
    <PreviewerContext.Provider
      value={{
        previewImage,
        isPreviewerOpen,
        setPreviewerImage,
        openPreviewer,
        closePreviewer,
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
