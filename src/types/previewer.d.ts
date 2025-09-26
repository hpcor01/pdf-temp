import type { ImageItem } from "@/types/kanban";

export interface PreviewerImageProps {
  image: ImageItem | null;
  position: { x: number; y: number } | null;
  isClickPreview: boolean;
  onClose: () => void;
}
