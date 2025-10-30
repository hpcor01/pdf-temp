export interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
  name: string;
  kind: "file";
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
  getFileHandle(
    name: string,
    options?: { create: boolean }
  ): Promise<FileSystemFileHandle>;
  name: string;
  kind: "directory";
  getDirectoryHandle(
    name: string,
    options?: { create: boolean }
  ): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive: boolean }): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

export interface FileSystemWritableFileStream {
  write(contents: Blob): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

declare global {
  interface Window {
    showSaveFilePicker?: (
      options: ShowSaveFilePickerOptions
    ) => Promise<FileSystemFileHandle>;
    showSaveFilePicker?: (options: {
      suggestedName: string;
      types: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
    showDirectoryPicker?: (options?: {
      mode: "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
  }
}
