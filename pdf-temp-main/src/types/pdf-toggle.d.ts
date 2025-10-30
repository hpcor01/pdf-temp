import type { Dispatch, SetStateAction } from "react";

export interface PDFToggleProps {
  isProcessing: boolean;
  isConvertToPDFChecked: boolean;
  setIsConvertToPDFChecked: Dispatch<SetStateAction<boolean>>;
}
