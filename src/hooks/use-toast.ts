import { useCallback } from "react";
import type { ToastVariant, UseToastProps } from "@/types/toast";

export function useToast({
  setToastVariant,
  setToastTitle,
  setToastDescription,
  setToastOpen,
}: UseToastProps) {
  const showToast = useCallback(
    (variant: ToastVariant, title: string, description: string) => {
      setToastVariant(variant);
      setToastTitle(title);
      setToastDescription(description);
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
    },
    [setToastVariant, setToastTitle, setToastDescription, setToastOpen],
  );

  return { showToast };
}
