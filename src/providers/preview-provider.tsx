"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { ImageItem } from "@/types/kanban";
import type { PreviewContextType } from "@/types/previewer";

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewImage, setPreviewImageState] = useState<ImageItem | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isClickPreview, setIsClickPreview] = useState<boolean>(false);
  const [isPreviewerImageChecked, setIsPreviewerImageChecked] =
    useState<boolean>(true);

  const setPreviewImage = (
    image: ImageItem | null,
    position: { x: number; y: number } | null = null,
    isClickPreview: boolean = false,
  ) => {
    setPreviewImageState(image);
    setPreviewPosition(position);
    setIsClickPreview(isClickPreview);
  };

  const clearPreview = () => {
    setPreviewImageState(null);
    setPreviewPosition(null);
    setIsClickPreview(false);
  };

  return (
    <PreviewContext.Provider
      value={{
        previewImage,
        previewPosition,
        isClickPreview,
        isPreviewerImageChecked,
        setPreviewImage,
        clearPreview,
        setIsPreviewerImageChecked,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
}
