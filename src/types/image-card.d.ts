import type { ImageItem } from "./kanban";

export interface ImageCardProps {
  item: ImageItem;
  index: number;
  columnId: string;
  onRemove: (columnId: string, imageId: string) => void;
  onRotate: (columnId: string, imageId: string, rotation: number) => void;
}
