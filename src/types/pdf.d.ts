/**
 * Type definitions for the File System Access API
 * These APIs are not yet available in TypeScript's standard DOM types
 */
export interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream {
  write(contents: Blob): Promise<void>;
  close(): Promise<void>;
}

// Extend the global Window interface
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
  }
}
