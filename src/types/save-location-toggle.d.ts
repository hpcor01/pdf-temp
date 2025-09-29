import type { Dispatch, SetStateAction } from "react";

export interface SaveLocationToggleProps {
  isProcessing: boolean;
  isSingleSaveLocation: boolean;
  setIsSingleSaveLocation: (value: boolean) => void;
  setSaveFolderPath: (value: string) => void;
  setToastVariant: Dispatch<SetStateAction<"default" | "destructive">>;
  setToastTitle: Dispatch<SetStateAction<string>>;
  setToastDescription: Dispatch<SetStateAction<string>>;
  setToastOpen: Dispatch<SetStateAction<boolean>>;
}
