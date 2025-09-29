import type { Dispatch, SetStateAction } from "react";

type ToastVariant = "default" | "destructive";

export interface UseToastProps {
  setToastVariant: Dispatch<SetStateAction<ToastVariant>>;
  setToastTitle: Dispatch<SetStateAction<string>>;
  setToastDescription: Dispatch<SetStateAction<string>>;
  setToastOpen: Dispatch<SetStateAction<boolean>>;
}
