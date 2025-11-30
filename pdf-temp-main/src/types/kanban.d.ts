export interface ImageItem {
  id: string;
  src: string;
  fileName: string;
  rotation: number;
  width?: number;
  height?: number;
  size?: number;
  filePath?: string;
}

export interface Column {
  id: string;
  title: string;
  items: ImageItem[];
  save: boolean;
}

export interface KanbanContextType {
  columns: Column[];
  selectedColumns: Record<string, boolean>;
  isRemoveBgChecked: boolean;
  setIsRemoveBgChecked: (checked: boolean) => void;
  addColumn: (title: string) => void;
  removeColumn: (id: string) => void;
  renameColumn: (id: string, title: string) => void;
  addImagesToColumn: (columnId: string, images: ImageItem[]) => void;
  removeImage: (columnId: string, imageId: string) => void;
  updateImage: (columnId: string, updatedImage: ImageItem) => void;
  rotateImage: (columnId: string, imageId: string, rotation: number) => void;
  moveImage: (
    sourceColumnId: string,
    destColumnId: string,
    imageId: string,
    destIndex: number
  ) => void;
  moveColumn: (sourceIndex: number, destIndex: number) => void;
  toggleColumnSelection: (columnId: string, selected: boolean) => void;
  toggleAllColumnsSelection: (selected: boolean) => void;
  areAllColumnsSelected: boolean;
  saveSelectedColumns: (
    convertToPDF: boolean,
    savePath: string
  ) => Promise<void>;
}
