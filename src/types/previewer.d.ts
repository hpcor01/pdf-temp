import type { ImageItem } from "@/types/kanban";

export interface PreviewerImageProps {
  image: ImageItem | null;
  position: { x: number; y: number } | null;
  isClickPreview: boolean;
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
