import type { FileSystemDirectoryHandle } from "@/types/pdf";

class DirectoryHandleManager {
  private static instance: DirectoryHandleManager;
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  private constructor() {}

  static getInstance(): DirectoryHandleManager {
    if (!DirectoryHandleManager.instance) {
      DirectoryHandleManager.instance = new DirectoryHandleManager();
    }
    return DirectoryHandleManager.instance;
  }

  setDirectoryHandle(handle: FileSystemDirectoryHandle): void {
    this.directoryHandle = handle;
  }

  getDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.directoryHandle;
  }

  clearDirectoryHandle(): void {
    this.directoryHandle = null;
  }
}

export const directoryHandleManager = DirectoryHandleManager.getInstance();
