import type { ImageItem } from "@/types/kanban";

export interface PreviewerImageProps {
  image: ImageItem | null;
  position: { x: number; y: number } | null;
  isClickPreview: boolean;
  onClose: () => void;
}

export interface MousePreviewerImageProps {
  image: ImageItem | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export interface PreviewContextType {
  previewImage: ImageItem | null;
  previewPosition: { x: number; y: number } | null;
  isClickPreview: boolean;
  isPreviewerImageChecked: boolean;
  setPreviewImage: (
    image: ImageItem | null,
    position?: { x: number; y: number } | null,
    isClickPreview?: boolean,
  ) => void;
  clearPreview: () => void;
  setIsPreviewerImageChecked: (checked: boolean) => void;
}

export interface PreviewerContextProps {
  previewImage: ImageItem | null;
  previewImageColumnId: string | null;
  isPreviewerOpen: boolean;
  setPreviewerImage: (image: ImageItem | null, columnId?: string) => void;
  openPreviewer: (image: ImageItem, columnId?: string) => void;
  closePreviewer: () => void;
  updatePreviewImage: (image: ImageItem) => void;
}
