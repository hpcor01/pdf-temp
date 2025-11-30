import type { Dispatch, SetStateAction } from "react";

export interface BackgroundToggleProps {
  isProcessing: boolean;
  isRemoveBgChecked: boolean;
  setIsRemoveBgChecked: (checked: boolean) => void;
}
